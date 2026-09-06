/** Kelgan jang chaqiruvi — istalgan sahifada pastdan chiqadigan xabar.
 *
 *  Ilgari chaqiruvni faqat So'zjang sahifasida ko'rish mumkin edi:
 *  do'st telefondan revansh yuborsa, brauzerda o'ynab o'tirgan odam uni
 *  umuman ko'rmasdi va muddat o'tib ketardi. Endi kuzatuv ilova
 *  darajasida turadi va xabar hamma narsaning ustida, ekran pastida
 *  chiqadi — barmoq ham, sichqoncha ham shu yerda.
 *
 *  Javob shu yerda beriladi: qabul qilinsa jang ochiladi, rad etilsa
 *  chaqirgan odamga server xabar yuboradi. */
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { callFunction } from '../firebase/functions';
import { watchInvites, type LiveInvite, type Unsubscribe } from '../firebase/live';
import { useAuth } from '../lib/auth';
import { openBattleById } from '../lib/useSozjang';
import { pretty } from '../lib/uz';

/** Chaqiruv muddati tugaguncha qolgan soniya. */
function useSecondsLeft(expiresAt: number): number {
  const [left, setLeft] = useState(() => remaining(expiresAt));

  // Kartochka har chaqiruv uchun qaytadan yaratiladi (`key`), shuning
  // uchun boshlang'ich qiymatni effekt ichida qayta yozish shart emas.
  useEffect(() => {
    const timer = window.setInterval(() => setLeft(remaining(expiresAt)), 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  return left;
}

function remaining(expiresAt: number): number {
  if (!expiresAt) return 0;
  return Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
}

export default function InviteOverlay() {
  const { account } = useAuth();
  const uid = account?.uid ?? '';
  const [live, setLive] = useState<LiveInvite[]>([]);
  const [busy, setBusy] = useState(false);
  /** Javob berilgan chaqiruvlar: server yozuvni yangilagunicha xabar
   *  qaytib chiqmasin. */
  const [answered, setAnswered] = useState<string[]>([]);

  useEffect(() => {
    if (!uid) return;

    let stop: Unsubscribe | null = null;
    let alive = true;

    void watchInvites(uid, (list) => {
      if (alive) setLive(list);
    }).then((unsubscribe) => {
      if (alive) stop = unsubscribe;
      else unsubscribe();
    });

    return () => {
      alive = false;
      stop?.();
    };
  }, [uid]);

  // Chiqariladigan chaqiruv render paytida hisoblanadi — kirish holati
  // o'zgarganda holatni effekt ichida tozalash kerak bo'lmaydi.
  const invite = uid
    ? (live.find((item) => !answered.includes(item.id)) ?? null)
    : null;

  const accept = useCallback(async () => {
    if (!invite || !account || busy) return;
    setBusy(true);
    try {
      const reply = await callFunction<{ battleId?: string }>(
        'battleInviteAccept',
        { inviteId: invite.id, nickname: account.nickname },
      );
      setAnswered((ids) => [...ids, invite.id]);
      if (reply.battleId) {
        openBattleById(reply.battleId);
        if (window.location.pathname !== '/sozjang') {
          window.history.pushState(null, '', '/sozjang');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      }
    } catch {
      // Xato bo'lsa chaqiruv joyida qoladi — qayta urinish mumkin.
    } finally {
      setBusy(false);
    }
  }, [account, busy, invite]);

  const decline = useCallback(async () => {
    if (!invite || busy) return;
    setAnswered((ids) => [...ids, invite.id]);
    try {
      await callFunction('battleInviteDecline', { inviteId: invite.id });
    } catch {
      // Rad etish serverda yozilmasa ham xabar qaytib chiqmaydi.
    }
  }, [busy, invite]);

  if (!invite) return null;

  return createPortal(
    <Card
      key={invite.id}
      invite={invite}
      busy={busy}
      onAccept={accept}
      onDecline={decline}
    />,
    document.body,
  );
}

function Card({
  invite,
  busy,
  onAccept,
  onDecline,
}: {
  invite: LiveInvite;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const left = useSecondsLeft(invite.expiresAt);

  return (
    <div className="invite" role="alert">
      <div className="invite__card">
        <div className="invite__head">
          <span className="invite__avatar" aria-hidden="true">
            {pretty(invite.fromNickname).trim().charAt(0).toUpperCase() || '?'}
          </span>
          <div className="invite__who">
            <strong>{pretty(invite.fromNickname)}</strong>
            <span>
              Sizni jangga chaqirdi ·{' '}
              {invite.kind === 'nearby' ? 'yaqin atrofdan' : 'revansh'}
            </span>
          </div>
          {left > 0 && <span className="invite__left">{left} s</span>}
        </div>

        <div className="invite__actions">
          <button className="btn btn--sm" onClick={onAccept} disabled={busy}>
            {busy ? 'Ochilmoqda…' : 'Qabul qilish'}
          </button>
          <button
            className="btn btn--sm btn--ghost"
            onClick={onDecline}
            disabled={busy}
          >
            Rad etish
          </button>
        </div>
      </div>
    </div>
  );
}
