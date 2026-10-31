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

/** `silent` — tugmasiz: telefonda bo'lim **butunlay** yopiladi.
 *
 *  Bosh sahifada aynan shunday. U yerda ochiladigan tugma ham o'yin
 *  bilan bir ekranda turardi va taxtadan ellik piksel yeb, o'zi
 *  hech kimga kerak bo'lmasdi: bosh sahifaga odam o'ynagani
 *  keladi, qoidalar esa menyuda va `/qollanma` da bor. Matn
 *  hujjatdan yo'qolmaydi (`display: none`) — qidiruv uni
 *  avvalgidek ko'radi. */
export default function PhoneFold({
  label = 'Qoidalar, savollar va boshqasi',
  silent = false,
  children,
}: {
  label?: string;
  silent?: boolean;
  children: ReactNode;
}) {
  const narrow = useNarrow();
  const [open, setOpen] = useState(false);
  const shown = !narrow || (open && !silent);

  return (
    <>
      {narrow && !silent && (
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
