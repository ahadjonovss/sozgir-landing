/** O'yinchi nomi va tasdiq belgisi.
 *
 *  Belgi **nom turgan har joyda** chiqadi: jadvalda, jangda, tarixda,
 *  profilda. Shuning uchun nom ham, belgi ham bitta komponentda —
 *  yangi ro'yxat qo'shilganda uni yana o'n joyga qo'lda qo'shish
 *  kerak bo'lmasin.
 *
 *  Jadvalda belgi shunchaki rasm: bosilsa qator havolasi ochilishi
 *  kerak, tugma ichida tugma bo'lmaydi. Profilda esa u bosiladi va
 *  tepasida bir jumlalik izoh chiqadi — «bu kim?» degan savol aynan
 *  o'sha yerda tug'iladi (`DonorChip` bilan bir xil xulq). */
import { useEffect, useRef, useState } from 'react';
import { verifiedNote, verifiedOf } from '../lib/verified';
import { pretty } from '../lib/uz';

/** Faqat belgi — nomi boshqa joyda chizilgan bo'lsa. */
export function VerifiedMark({
  uid,
  size = 16,
}: {
  uid: string | null | undefined;
  size?: number;
}) {
  const person = verifiedOf(uid);
  if (!person) return null;
  return (
    <img
      className="verified"
      src="/verified.png"
      alt="Tasdiqlangan hisob"
      title={verifiedNote(person)}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
    />
  );
}

/** Profildagi belgi: bosilsa izoh chiqadi. */
export function VerifiedBadge({
  uid,
  size = 22,
}: {
  uid: string | null | undefined;
  size?: number;
}) {
  const person = verifiedOf(uid);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent | TouchEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!person) return null;
  const toggle = () => setOpen((value) => !value);

  return (
    <span
      ref={root}
      className={`verified-badge${open ? ' verified-badge--open' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`${person.name} — tasdiqlangan hisob haqida`}
      aria-expanded={open}
      onClick={toggle}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle();
        }
      }}
    >
      <img
        className="verified"
        src="/verified.png"
        alt="Tasdiqlangan hisob"
        width={size}
        height={size}
        decoding="async"
      />
      {open && (
        <span className="verified-badge__tip" role="tooltip">
          {verifiedNote(person)}
        </span>
      )}
    </span>
  );
}

/** Nom va uning yonidagi belgi — jadval, jang va tarix uchun. */
export default function PlayerName({
  uid,
  name,
  size = 16,
}: {
  uid: string | null | undefined;
  name: string;
  size?: number;
}) {
  return (
    <>
      {pretty(name)}
      <VerifiedMark uid={uid} size={size} />
    </>
  );
}
