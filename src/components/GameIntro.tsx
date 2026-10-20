/** O'yinning bosh qatori — nomi va bir jumlalik izohi.
 *
 *  To'rttala onlayn o'yin (So'zjang, G'uncha jangi, Mardu maydon,
 *  Turnir) bitta sahifada tab orqali almashadi, ya'ni ularning boshi
 *  ham bir xil ko'rinishda bo'lishi kerak: sarlavha, ostida belgi
 *  bilan bitta jumla. Ilgari izoh faqat So'zjangda bor edi va
 *  qolganlariga o'tganda odam lobbining tugmalariga qarab, o'yinni
 *  o'zi taxmin qilardi.
 *
 *  Jumla **qoidani** aytadi, maqtamaydi: odam shu bir qatordan
 *  o'yinni tushunishi kerak. */
import type { CSSProperties, ReactNode } from 'react';

export default function GameIntro({
  icon,
  title,
  note,
  tone,
}: {
  /** Belgi — o'sha o'yinning tanlovdagi belgisi. */
  icon: ReactNode;
  title: string;
  note: string;
  /** Belgining rangi — mavzu o'zgaruvchisining nomi (`orange`,
   *  `teal`, `violet`, `yellow`). Tanlov qatoridagi rangning o'zi:
   *  ikkalasi bitta o'yinni ko'rsatadi. */
  tone: 'orange' | 'teal' | 'violet' | 'yellow';
}) {
  return (
    <div className="lobby__head" style={{ '--tone': `var(--${tone})` } as CSSProperties}>
      <h1>{title}</h1>
      <p className="lobby__note">
        <span className="lobby__note-icon" aria-hidden="true">
          {icon}
        </span>
        {note}
      </p>
    </div>
  );
}
