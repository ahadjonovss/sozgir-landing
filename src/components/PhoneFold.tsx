/** Telefonda yig'iladigan qism — tugma va uning ostidagi hamma narsa.
 *
 *  O'yin sahifalari telefonda ming-ming piksel edi: taxta birinchi
 *  ekranga sig'sa ham, ostida statistika, qoidalar, savollar va
 *  bannerlar turardi. O'ynayotgan odamga ularning bittasi ham o'sha
 *  daqiqada kerak emas, lekin barmoq ekranni surishi bilan
 *  brauzerning manzil qatori yig'ilib, sahifa qayta o'lchanardi —
 *  taxta o'yin o'rtasida siljirdi. Yig'ilgan holda surish uchun
 *  joyning o'zi qolmaydi.
 *
 *  Kompyuterda komponent **umuman aralashmaydi**: tugma chizilmaydi,
 *  bolalar esa `display: contents` bilan to'g'ridan-to'g'ri ota
 *  elementga tushadi — grid va `:has` qoidalari o'zgarmaydi. */
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useNarrow } from '../lib/useNarrow';

export default function PhoneFold({
  label = 'Qoidalar, savollar va boshqasi',
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  const narrow = useNarrow();
  const [open, setOpen] = useState(false);
  const shown = !narrow || open;

  return (
    <>
      {narrow && (
        <button
          className={`fold__btn${open ? ' fold__btn--open' : ''}`}
          onClick={() => setOpen((was) => !was)}
          aria-expanded={open}
        >
          {open ? 'Yopish' : label}
        </button>
      )}
      <div className={shown ? 'fold' : 'fold fold--off'}>{children}</div>
    </>
  );
}
