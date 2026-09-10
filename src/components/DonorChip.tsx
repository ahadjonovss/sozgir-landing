/** Homiylik darajasi chipi — ♥, nom va burchagida kichik ⓘ.
 *
 *  Belgi raqibda yoki jadvalda ko'ringanda odam «bu nima?» deb qoladi —
 *  chip (yoki ⓘ) bosilsa tepasida bir jumlalik izoh chiqadi: bu ko'rinish
 *  loyihaga donat qilganlarda. Tashqariga bosilsa yoki Escape bilan
 *  yopiladi. Butun chip bitta tugma: ichida alohida tugma yo'q (tugma
 *  ichida tugma bo'lmaydi), ⓘ shunchaki belgi. */
import { useEffect, useRef, useState } from 'react';
import { donorLabel, type DonorTier } from '../lib/donor';
import { Heart } from './Icons';

export const DONOR_HINT = 'Bu ko‘rinish loyihaga donat qilganlarda chiqadi. Daraja donat summasiga bog‘liq.';

export default function DonorChip({
  tier,
  className = '',
}: {
  tier: DonorTier;
  className?: string;
}) {
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

  const toggle = () => setOpen((value) => !value);

  return (
    <span
      ref={root}
      className={`donor-chip donor-chip--${tier}${open ? ' donor-chip--open' : ''} ${className}`.trim()}
      role="button"
      tabIndex={0}
      aria-label={`${donorLabel(tier)} — homiylik belgisi haqida`}
      aria-expanded={open}
      onClick={toggle}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle();
        }
      }}
    >
      <Heart size={13} />
      {donorLabel(tier)}
      <span className="donor-chip__info" aria-hidden="true">
        i
      </span>
      {open && (
        <span className="donor-chip__tip" role="tooltip">
          {DONOR_HINT}
        </span>
      )}
    </span>
  );
}
