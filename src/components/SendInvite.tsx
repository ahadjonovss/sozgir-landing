/** Yuborilgan chaqiruv — ilovadagi `SendInviteSheet` ning veb ko'rinishi.
 *
 *  Aniq raqibga chaqiruv yuboriladi va javob kutiladi. Bitta oyna ikki
 *  joyda: jang natijasidan **revansh** va reyting jadvalidagi o'yinchiga
 *  **profil** chaqiruvi (ilovada bu tugma ochiq profilda turadi; saytda
 *  profil sahifasi yo'q, shuning uchun jadval qatorining o'zida).
 *  Oqim bir xil — yuborildi, kutilmoqda, qabul qilindi yoki rad etildi.
 *
 *  Chaqiruv qabul qilinsa server jang yaratadi va hujjatga `battleId`
 *  yozadi — oyna yopilib, jang ochiladi. Muddat (2 daqiqa) tugagach oyna
 *  o'zi yakun yasaydi: serverdagi `expired` belgisi jadval bo'yicha
 *  qo'yiladi (daqiqada bir marta), undan kutilsa oyna bir daqiqagacha
 *  «kutamiz» deb turaverardi. Lekin darhol emas — raqib oxirgi soniyada
 *  qabul qilgan bo'lishi va javob yo'lda bo'lishi mumkin. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { functionError } from '../firebase/functions';
import type { Unsubscribe } from '../firebase/live';
import { useAuth } from '../lib/auth';
import {
  cancelInvite,
  gameOf,
  sendInvite,
  watchInvite,
  type BattleGame,
  type InviteKind,
} from '../lib/battle';
import { DEFAULT_LENGTH } from '../lib/modes';
import { showBattle } from '../lib/activeBattle';
import { pretty } from '../lib/uz';
import Avatar from './Avatar';
import { Close } from './Icons';

export interface InviteTarget {
  uid: string;
  nickname: string;
  kind: InviteKind;
  /** So'z uzunligi — berilmasa ilovadagi asosiy rejim (5). */
  length?: number;
  /** Qaysi o'yinga chaqiramiz — berilmasa So'zjang. */
  game?: BattleGame;
}

/** Server chaqiruvga beradigan muddat — `INVITE_SECONDS`. Hujjatdagi
 *  `expiresAt` kelgunicha sanoq shundan boshlanadi. */
const INVITE_SECONDS = 120;

/** Nol sanoqdan keyin yana shuncha kutamiz. */
const GRACE_SECONDS = 8;

type Outcome = 'declined' | 'expired' | 'error';

export default function SendInvite({
  target,
  onClose,
}: {
  target: InviteTarget;
  onClose: () => void;
}) {
  const { account } = useAuth();
  const [inviteId, setInviteId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState(() => Date.now() + INVITE_SECONDS * 1000);
  const [left, setLeft] = useState(INVITE_SECONDS);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  /** Yopilgan oyna: kechikib kelgan javob jangni ochib yubormasin. */
  const closed = useRef(false);
  const overtime = useRef(0);
  /** Chaqiruv bir marta yuboriladi — hisob obyekti qayta yaratilganda
   *  ham (`account` har renderda yangi bo'lishi mumkin). */
  const sent = useRef(false);

  // Yuborish — oyna ochilishi bilan bir marta.
  useEffect(() => {
    if (!account || sent.current) return;
    sent.current = true;
    let alive = true;
    void sendInvite({
      toUid: target.uid,
      nickname: account.nickname,
      length: target.length ?? DEFAULT_LENGTH,
      kind: target.kind,
      game: target.game ?? 'soztop',
    })
      .then((reply) => {
        if (alive) setInviteId(reply.inviteId);
      })
      .catch((raw) => {
        if (!alive) return;
        setError(functionError(raw));
        setOutcome('error');
      });
    return () => {
      alive = false;
    };
  }, [account, target]);

  // Javobni kuzatamiz: qabul → jang, rad → xabar, eskirdi → xabar.
  useEffect(() => {
    if (!inviteId) return;
    let alive = true;
    let stop: Unsubscribe | null = null;

    void watchInvite(inviteId, (invite) => {
      if (!alive || !invite) return;
      if (invite.expiresAt?.seconds) setExpiresAt(invite.expiresAt.seconds * 1000);
      if (invite.status === 'accepted' && invite.battleId) {
        if (closed.current) return;
        closed.current = true;
        // Qaysi ekran ochilishini chaqiruvning o'zi aytadi — maydoni
        // yo'q chaqiruv So'zjangniki.
        showBattle(gameOf(invite.game), invite.battleId);
        onClose();
      } else if (invite.status === 'declined') {
        setOutcome('declined');
      } else if (invite.status === 'expired') {
        setOutcome('expired');
      }
    }).then((unsubscribe) => {
      if (alive) stop = unsubscribe;
      else unsubscribe();
    });

    return () => {
      alive = false;
      stop?.();
    };
  }, [inviteId, onClose]);

  // Qolgan vaqt sekundlab; nolga tushgach imtiyozli soniyalardan keyin
  // yakun.
  useEffect(() => {
    if (outcome) return;
    const tick = () => {
      const remaining = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) overtime.current += 1;
      if (remaining === 0 && overtime.current > GRACE_SECONDS) setOutcome('expired');
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt, outcome]);

  const cancel = useCallback(async () => {
    if (closed.current) return;
    closed.current = true;
    setCancelling(true);
    // Hali kutilayotgan chaqiruv bekor qilinadi — raqibda oyna qolib
    // ketmasin. Yakunlanganini yopishda serverga tegilmaydi.
    if (inviteId && !outcome) await cancelInvite(inviteId).catch(() => undefined);
    onClose();
  }, [inviteId, onClose, outcome]);

  const name = pretty(target.nickname);
  const rematch = target.kind === 'rematch';
  const message =
    outcome === 'declined'
      ? rematch
        ? 'Raqib revanshdan voz kechdi'
        : 'Chaqiruv rad etildi'
      : outcome === 'expired'
        ? 'Javob kelmadi'
        : outcome === 'error'
          ? error
          : null;

  return createPortal(
    <div className="modal" role="dialog" aria-modal="true" aria-label="So‘zjangga chaqirish">
      {/* Parda bosilganda yopilmaydi (ilovadagi `isDismissible: false`):
          kutish tasodifan bekor bo'lib qolmasin. */}
      <div className="modal__veil" aria-hidden="true" />
      <div className="modal__card sendinv">
        {rematch && <h3 className="sendinv__title">Revansh</h3>}
        <Avatar name={name} uid={target.uid} size={56} className="sendinv__avatar" />
        <strong className="sendinv__name">{name}</strong>

        {message ? (
          <p className="sendinv__err" role="alert">
            {message}
          </p>
        ) : (
          <>
            <p className="sendinv__wait">
              {inviteId ? 'Raqib javobini kutamiz' : 'Chaqiruv yuborilmoqda…'}
            </p>
            <p className="sendinv__hint">
              Raqibga xabar boradi. Qabul qilsa, jang darhol boshlanadi.
            </p>
            <span className="sendinv__bar" aria-hidden="true">
              <i />
            </span>
            {inviteId && left > 0 && (
              <span className="sendinv__left" aria-live="off">
                {left} s
              </span>
            )}
          </>
        )}

        <button
          className="btn btn--outline sendinv__cancel"
          onClick={() => void cancel()}
          disabled={cancelling}
        >
          <Close size={16} />
          {message ? 'Yopish' : 'Bekor qilish'}
        </button>
      </div>
    </div>,
    document.body,
  );
}
