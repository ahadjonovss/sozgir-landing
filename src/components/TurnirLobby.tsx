/** Turnirning yig'ilish xonasi — `/turnir/{KOD}`, `status: gathering`.
 *
 *  Tadbirda eng qimmat narsa — vaqt: o'ttiz kishini ro'yxatga olish
 *  uchun kod terib o'tirish uzoq. Shuning uchun bu yerda uchta yo'l
 *  yonma-yon turadi: **QR** (ekranga qarab olish — eng tezi), havola
 *  (chatga tashlash) va kodning o'zi (og'zaki aytish). Uchalasi bitta
 *  manzilni beradi.
 *
 *  Ro'yxat hujjat kuzatuvidan keladi, ya'ni yangi kelgan odam hamma
 *  ekranda bir vaqtda paydo bo'ladi — tashkilotchi «kim kirdi» deb
 *  so'rab turmaydi. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { functionError } from '../firebase/functions';
import { watchFriends, type Friend } from '../lib/friends';
import { qrMatrix, qrPath } from '../lib/qr';
import {
  inviteToTurnir,
  turnirLink,
  turnirRounds,
  TURNIR_MIN_PLAYERS,
} from '../lib/turnir';
import type { Unsubscribe } from '../firebase/live';
import type { Turnir } from '../lib/useTurnir';
import Avatar from './Avatar';
import Modal from './Modal';
import PlayerName from './PlayerName';
import { Check, Close, Copy, PersonAdd, Trophy } from './Icons';

export default function TurnirLobby({ turnir }: { turnir: Turnir }) {
  const rounds = turnirRounds(turnir.capacity);
  // Tezkor turnirda sanoq turadi: xonaga kod bilan emas, navbat
  // bilan kiriladi va boshlashni hech kim bosmaydi.
  const quick = turnir.isQuick;
  const left = turnir.nextIn;

  // Do'stlar ro'yxati shu yerda yashaydi: panjaradagi «Chaqirish»
  // kataklari do'st bor-yo'qligini bilishi kerak, oyna esa ro'yxatning
  // o'zini ko'rsatadi.
  const friends = useFriends(turnir.joined ? turnir.mine : undefined);
  const [inviting, setInviting] = useState(false);
  const canInvite =
    turnir.joined && friends.length > 0 && turnir.players < turnir.capacity;

  return (
    <div className="stage tnr-lobby">
      <div className="stage__head">
        <h2>{turnir.doc?.title || 'Turnir'}</h2>
        <span className="stage__tag">
          {turnir.turnirGame === 'guncha' ? 'G‘uncha' : 'So‘zjang'} ·{' '}
          {turnir.players}/{turnir.capacity}
        </span>
      </div>

      {/* Zinapoya — necha davra o'ynalishi. Son yig'ilish paytida ham
          turnir hajmidan olinadi: odam nimaga yozilayotganini bilsin.

          Sanoq **har qanday** turnirda turadi, tezkorida ham,
          do'stlar turnirida ham: server ikkalasiga ham yig'ilish
          muddatini yozadi (`startsAt`) va muddat tugaganda turnir
          o'zi boshlanadi. Ilgari sanoq faqat tezkorida ko'rinardi
          va do'stlar turnirini ochgan odam vaqt ketayotganini
          bilmasdi — ilovada esa u ko'rinib turardi. */}
      <p className="tnr-lobby__steps">
        {left !== null ? (
          <>
            <b>
              Boshlanishiga:{' '}
              {left < 60
                ? `${left} s`
                : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`}
            </b>{' '}
            · {rounds} davra
          </>
        ) : (
          <>
            <b>{rounds} davra</b> · hamma oxirigacha o‘ynaydi
          </>
        )}
      </p>

      {/* Tezkor turnirda kod ko'rsatilmaydi: ochiq xonaga havola
          tarqatilmaydi va ekranda sanoq turadi. */}
      {!quick && <Invite turnir={turnir} />}

      <Seats turnir={turnir} onInvite={canInvite ? () => setInviting(true) : null} />

      {/* Do'stni chaqirish — kodning yonidagi ikkinchi yo'l. Kod chatga
          tashlanadi va kim ko'rsa o'sha keladi; bu esa aniq bir odamning
          telefoniga push bo'lib boradi.

          Ro'yxatning o'zi **oynada**: sahifada ochiq turganda u
          xonadagilar panjarasiga qo'shilib ketardi — ikkita bir xil
          ko'rinishdagi ro'yxat yonma-yon turib, qaysi biri kim ekani
          bilinmasdi. */}
      {inviting && (
        <InviteSheet
          turnir={turnir}
          friends={friends}
          onClose={() => setInviting(false)}
        />
      )}

      <div className="result__actions">
        {turnir.isHost && !quick && (
          <button
            className="btn"
            onClick={turnir.start}
            disabled={turnir.busy || !turnir.canStart}
            title={turnir.canStart ? undefined : `Kamida ${TURNIR_MIN_PLAYERS} kishi kerak`}
          >
            <Trophy size={16} />
            {turnir.busy ? 'Boshlanmoqda…' : 'Boshlash'}
          </button>
        )}
        {turnir.joined ? (
          <button className="btn btn--outline" onClick={turnir.leave}>
            Chiqish
          </button>
        ) : (
          <button
            className="btn"
            onClick={() => turnir.join(turnir.code)}
            disabled={turnir.busy}
          >
            {turnir.busy ? 'Qo‘shilmoqda…' : 'Qo‘shilish'}
          </button>
        )}
      </div>

      <p className="stage__hint" role="status">
        {quick
          ? 'Sanoq tugaguncha qatnashchilar yig‘iladi — kutib turing yoki do‘stingizni chaqiring.'
          : turnir.isHost
            ? 'Sanoq tugaganda turnir o‘zi boshlanadi. Kutmay boshlash uchun «Boshlash» ni bosing — bu sahifa ochiq tursin.'
            : 'Sanoq tugaganda turnir o‘zi boshlanadi — tashkilotchi uni ertaroq ham boshlashi mumkin. Bu sahifa ochiq tursin.'}
      </p>
    </div>
  );
}

/** Xonaning panjarasi — turnir sig'imicha katak.
 *
 *  Ilgari bu yerda qator-qator ro'yxat turardi va uning oxirida «yana
 *  N o'rin bor» degan yozuv. Ro'yxat kimlar kelganini aytardi, lekin
 *  **qancha kutish borligini** aytmasdi: to'rtta ism ko'rinardi, sakkiz
 *  kishilik xona esa yarmigacha ham to'lmaganini faqat yozuvdan bilib
 *  olish kerak edi. Panjarada esa bo'sh o'rin ko'rinib turadi — xona
 *  to'lgani ekranning o'zidan o'qiladi (ilovadagi yig'ilish ekranidek).
 *
 *  «Chaqirish» katagi — bo'sh o'rinlarning boshida: odam bo'sh joyni
 *  ko'rib, uni kim bilan to'ldirishni o'sha yerda hal qiladi. */
function Seats({
  turnir,
  onInvite,
}: {
  turnir: Turnir;
  /** Do'sti bor va xonada joy bor bo'lsagina tugma — aks holda katak
      bosilib bo'sh oyna ochardi. */
  onInvite: (() => void) | null;
}) {
  const host = turnir.doc?.host ?? turnir.doc?.createdBy;
  const free = Math.max(0, turnir.capacity - turnir.players);

  return (
    <section className="tnr-seats" aria-label="Qatnashchilar">
      <p className="tnr-seats__count">
        <b>{turnir.players}</b> / {turnir.capacity} kishi
      </p>

      <ul className="tnr-seats__grid">
        {turnir.members.map((member) => (
          <li
            key={member.uid}
            className={`seat${member.mine ? ' seat--me' : ''}`}
          >
            <span className="seat__face">
              <Avatar name={member.nickname} uid={member.uid} size={44} />
              {member.uid === host && (
                <i className="seat__host" title="Tashkilotchi">
                  <Trophy size={11} />
                </i>
              )}
            </span>
            <span className="seat__name">
              <PlayerName uid={member.uid} name={member.nickname} size={12} />
            </span>
            {turnir.isHost && !turnir.isQuick && !member.mine && (
              <button
                type="button"
                className="icon-btn seat__kick"
                onClick={() => turnir.kick(member.uid)}
                disabled={turnir.busy}
                aria-label={`${member.nickname} ni chiqarish`}
                title="Turnirdan chiqarish"
              >
                <Close size={14} />
              </button>
            )}
          </li>
        ))}

        {onInvite && (
          <li className="seat seat--invite">
            <button type="button" className="seat__call" onClick={onInvite}>
              <span className="seat__face seat__face--icon">
                <PersonAdd size={22} />
              </span>
              <span className="seat__name">Chaqirish</span>
            </button>
          </li>
        )}

        {Array.from({ length: free }, (_, index) => (
          <li key={`free-${index}`} className="seat seat--empty">
            <span className="seat__face">
              <Avatar name="" size={44} waiting />
            </span>
            <span className="seat__name">Bo‘sh o‘rin</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Do'stlar ro'yxatini kuzatish — xona ochiq turganda yangi do'st ham
    o'zi qo'shiladi. */
function useFriends(uid: string | null | undefined) {
  const [friends, setFriends] = useState<Friend[]>([]);

  useEffect(() => {
    // Chiqib ketilsa ro'yxat shu holicha qoladi: u ekranda
    // ko'rinmaydi (chaqirish faqat xonadagilarga ochiq), tozalash
    // uchun esa qo'shimcha render ketardi.
    if (!uid) return;
    let alive = true;
    let stop: Unsubscribe | null = null;

    void watchFriends(uid, (list) => {
      if (alive) setFriends(list);
    }).then((unsubscribe) => {
      if (alive) stop = unsubscribe;
      else unsubscribe();
    });

    return () => {
      alive = false;
      stop?.();
    };
  }, [uid]);

  return friends;
}

/** Do'stlar ro'yxati — har qatorda bitta chaqiruv tugmasi.
 *
 *  Javob kutilmaydi: turnir allaqachon ochiq, chaqirilgan odam esa
 *  istagan paytda kelib qo'shiladi. Shuning uchun bu yerda sanoq
 *  ham, «qabul qilindi» ham yo'q — qator shunchaki «chaqirildi»
 *  bo'lib qoladi (ilovadagi `TurnirInviteSheet` dagidek). */
function InviteSheet({
  turnir,
  friends,
  onClose,
}: {
  turnir: Turnir;
  friends: Friend[];
  onClose: () => void;
}) {
  const [invited, setInvited] = useState<string[]>([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState<string | null>(null);

  const invite = async (friend: Friend) => {
    if (busy) return;
    setBusy(friend.uid);
    setError(null);
    try {
      await inviteToTurnir({
        code: turnir.code,
        toUid: friend.uid,
        nickname: turnir.members.find((item) => item.mine)?.nickname ?? '',
      });
      setInvited((previous) => [...previous, friend.uid]);
    } catch (raw) {
      // Serverning izohi o'zbekcha va aniq: «Turnir to'ldi»,
      // «Turnir allaqachon boshlandi».
      setError(functionError(raw));
    } finally {
      setBusy('');
    }
  };

  return (
    <Modal
      title="Do‘stni chaqirish"
      lead="Chaqirilgan do‘stga xabar boradi — bosishi bilan shu turnirga qo‘shiladi"
      onClose={onClose}
    >
      <ul className="arena__members tnr-friends__list">
        {friends.map((friend) => {
          const joined = turnir.members.some((item) => item.uid === friend.uid);
          const sent = invited.includes(friend.uid);
          return (
            <li key={friend.uid} className="arena__member">
              <Avatar name={friend.nickname} uid={friend.uid} size={30} />
              <span className="arena__name">
                <PlayerName uid={friend.uid} name={friend.nickname} size={14} />
              </span>
              {joined ? (
                <span className="arena__host">turnirda</span>
              ) : sent ? (
                <span className="arena__host">chaqirildi</span>
              ) : (
                <button
                  type="button"
                  className="btn btn--sm btn--ghost"
                  onClick={() => void invite(friend)}
                  disabled={busy === friend.uid}
                >
                  {busy === friend.uid ? 'Yuborilmoqda…' : 'Chaqirish'}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {error && <p className="form__err">{error}</p>}
    </Modal>
  );
}

/** Kod, havola va QR — bitta manzilning uch ko'rinishi. */
function Invite({ turnir }: { turnir: Turnir }) {
  const [copied, setCopied] = useState<'kod' | 'havola' | null>(null);
  const timer = useRef(0);
  const link = turnirLink(turnir.code);

  // QR hisobi arzon emas (sakkiz maska baholanadi), lekin kod
  // o'zgarmaydi — bir marta hisoblanadi va shu holicha qoladi.
  const path = useMemo(() => {
    const matrix = qrMatrix(link);
    return matrix ? { d: qrPath(matrix), size: matrix.length } : null;
  }, [link]);

  const copy = async (text: string, what: 'kod' | 'havola') => {
    await navigator.clipboard.writeText(text).catch(() => undefined);
    setCopied(what);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1600);
  };

  return (
    <div className="tnr-invite">
      <div className="tnr-invite__left">
        <button
          type="button"
          className="code"
          onClick={() => void copy(turnir.code, 'kod')}
          aria-label={`Turnir kodi ${turnir.code}. Nusxa olish`}
          title="Kodni nusxalash"
        >
          {[...turnir.code].map((char, index) => (
            <span key={index} style={{ '--i': index } as React.CSSProperties}>
              {char}
            </span>
          ))}
        </button>

        <div className="linkbox">
          <span className="linkbox__url">{link.replace('https://', '')}</span>
          <button
            type="button"
            className="icon-btn"
            onClick={() => void copy(link, 'havola')}
            aria-label="Havolani nusxalash"
            title="Havolani nusxalash"
          >
            {copied === 'havola' ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>

        <p className="stage__hint" role="status">
          {copied === 'kod'
            ? 'Kod nusxalandi'
            : copied === 'havola'
              ? 'Havola nusxalandi'
              : 'Kodni ayting, havolani tashlang yoki QR ni ko‘rsating'}
        </p>
      </div>

      {path && (
        // `shape-rendering` muhim: silliqlangan chekka belgilarni
        // xiralashtiradi va kichik ekranda QR o'qilmay qoladi.
        <svg
          className="tnr-qr"
          viewBox={`-2 -2 ${path.size + 4} ${path.size + 4}`}
          shapeRendering="crispEdges"
          role="img"
          aria-label={`${link} havolasining QR kodi`}
        >
          <rect x={-2} y={-2} width={path.size + 4} height={path.size + 4} fill="#fff" />
          <path d={path.d} fill="#000" />
        </svg>
      )}
    </div>
  );
}
