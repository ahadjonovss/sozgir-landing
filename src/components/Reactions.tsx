/** Jangdagi reaksiyalar: yuborish tugmasi va kelgan belgining ko'rinishi.
 *
 *  Ikkala jang ham (So'zjang va g'uncha) shu komponentlarni ishlatadi —
 *  qoida bitta joyda turadi: ro'yxat yopiq, tugma yuborilgandan keyin
 *  sovuydi va kelgan belgi yuqoriga suzib ketadi. */
import { useEffect, useRef, useState } from 'react';
import { emojiOf, REACTIONS, type ReactionKey } from '../lib/reactions';
import { Smile } from './Icons';

/** Raqibdan endigina kelgan reaksiya — `token` bilan (sanoq, bayroq emas). */
export interface ReactionEvent {
  key: ReactionKey;
  token: number;
}

export function ReactionPicker({
  sent,
  onReact,
}: {
  sent: ReactionKey | null;
  onReact: (key: ReactionKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const emoji = emojiOf(sent);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="react" ref={box}>
      {open && (
        <div className="react__menu" role="menu" data-script="off">
          {REACTIONS.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              className="react__pick"
              title={item.label}
              aria-label={item.label}
              onClick={() => {
                setOpen(false);
                onReact(item.key);
              }}
            >
              {item.emoji}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className={`react__btn${emoji ? ' react__btn--sent' : ''}`}
        onClick={() => setOpen((value) => !value)}
        disabled={!!emoji}
        aria-label="Reaksiya yuborish"
        aria-expanded={open}
        aria-haspopup="menu"
        title="Reaksiya — raqibingiz darhol ko‘radi"
      >
        {emoji ? <span data-script="off">{emoji}</span> : <Smile size={20} />}
        <span className="react__label">Reaksiya</span>
      </button>
    </div>
  );
}

/** Raqibdan kelgan reaksiya: belgi paydo bo'lib, chayqalib turadi va
 *  yuqoriga suzib ketadi. `key` sifatida sanoq berilgan — element qaytadan
 *  yaratiladi va animatsiya boshidan yuriladi, ya'ni raqib ketma-ket bir
 *  xil belgini yuborsa ham har biri ko'rinadi. */
export function ReactionBurst({ event }: { event: ReactionEvent | null }) {
  const emoji = emojiOf(event?.key);
  if (!emoji) return null;
  return (
    <span className="burst" key={event!.token} aria-hidden="true" data-script="off">
      {emoji}
    </span>
  );
}
