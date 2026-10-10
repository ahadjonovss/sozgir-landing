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
import { useMemo, useRef, useState } from 'react';
import { qrMatrix, qrPath } from '../lib/qr';
import { turnirLink, turnirRounds, TURNIR_MIN_PLAYERS } from '../lib/turnir';
import type { Turnir } from '../lib/useTurnir';
import Avatar from './Avatar';
import PlayerName from './PlayerName';
import { Check, Close, Copy, Trophy } from './Icons';

export default function TurnirLobby({ turnir }: { turnir: Turnir }) {
  const rounds = turnirRounds(turnir.capacity);
  // Tezkor turnirda sanoq turadi: xonaga kod bilan emas, navbat
  // bilan kiriladi va boshlashni hech kim bosmaydi.
  const quick = turnir.isQuick;
  const left = turnir.nextIn;

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
          turnir hajmidan olinadi: odam nimaga yozilayotganini bilsin. */}
      <p className="tnr-lobby__steps">
        {quick && left !== null ? (
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

      <ul className="arena__members tnr-lobby__list">
        {turnir.members.map((member) => (
          <li
            key={member.uid}
            className={`arena__member${member.mine ? ' arena__member--me' : ''}`}
          >
            <Avatar name={member.nickname} uid={member.uid} size={34} />
            <span className="arena__name">
              <PlayerName uid={member.uid} name={member.nickname} size={14} />
            </span>
            {member.uid === (turnir.doc?.host ?? turnir.doc?.createdBy) && (
              <span className="arena__host">tashkilotchi</span>
            )}
            {turnir.isHost && !quick && !member.mine && (
              <button
                type="button"
                className="icon-btn tnr-lobby__kick"
                onClick={() => turnir.kick(member.uid)}
                disabled={turnir.busy}
                aria-label={`${member.nickname} ni chiqarish`}
                title="Turnirdan chiqarish"
              >
                <Close size={16} />
              </button>
            )}
          </li>
        ))}
        {/* Bo'sh o'rin bitta: ro'yxat to'lib borayotgani sezilsin, lekin
            o'ttiz ikkita bo'sh qator ekranni egallab qolmasin. */}
        {turnir.players < turnir.capacity && (
          <li className="arena__member arena__member--empty">
            <i aria-hidden="true" />
            <span className="arena__name">
              yana {turnir.capacity - turnir.players} o‘rin bor
            </span>
          </li>
        )}
      </ul>

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
          ? 'Vaqt tugaguncha qatnashchilar yig‘iladi. Odam yig‘ilmasa turnir yopiladi.'
          : turnir.isHost
            ? 'Hamma yig‘ilgach «Boshlash» ni bosing. Turnir boshlanmaguncha bu sahifa ochiq tursin.'
            : 'Turnirni tashkilotchi boshlaydi — boshlanmaguncha bu sahifa ochiq tursin.'}
      </p>
    </div>
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
