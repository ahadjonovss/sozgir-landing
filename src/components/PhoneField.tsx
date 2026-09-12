/** Telefon raqam maydoni — `+998` qat'iy turadi.
 *
 *  Hisob raqam bilan ochiladi va raqam bilan kiriladi, shuning uchun
 *  maydonda tanlov qoldirilmagan: mamlakat kodi yozuvning bir qismi emas,
 *  maydonning o'zida chizilgan yorliq. Odam faqat to'qqiz raqamni teradi,
 *  ya'ni `+998`, `998`, `8` kabi turli shakllarda yozib xato qilishning
 *  iloji yo'q.
 *
 *  Qiymat har doim **faqat raqamlar** bo'lib chiqadi (`901234567`) —
 *  `loginId.ts` uni shundan kanonik shaklga keltiradi. Ekranda esa
 *  o'qishga qulay guruhlarga bo'linadi: `90 123 45 67`. */
import type { Ref } from 'react';

/** Milliy raqamning uzunligi. */
export const PHONE_LENGTH = 9;

/** `901234567` → `90 123 45 67`. Yarim yozilgan raqam ham bo'linadi. */
export function formatPhone(digits: string): string {
  const parts = [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 7),
    digits.slice(7, 9),
  ].filter(Boolean);
  return parts.join(' ');
}

export default function PhoneField({
  value,
  onChange,
  inputRef,
  label = 'Telefon raqam',
  autoComplete = 'tel',
}: {
  /** Faqat raqamlar (eng ko'pi bilan to'qqizta). */
  value: string;
  onChange: (digits: string) => void;
  inputRef?: Ref<HTMLInputElement>;
  label?: string;
  autoComplete?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="phone">
        <span className="phone__code" aria-hidden="true">
          +998
        </span>
        <input
          ref={inputRef}
          className="phone__input"
          type="tel"
          inputMode="numeric"
          autoComplete={autoComplete}
          placeholder="90 123 45 67"
          aria-label={`${label} (+998 dan keyingi qismi)`}
          value={formatPhone(value)}
          onChange={(event) => {
            // Yozilganidan faqat raqamlar olinadi: odam bo'shliq, tire
            // yoki qavs bilan yozsa ham bir xil natija chiqadi. Boshidagi
            // `998` — mamlakat kodi ikki marta yozilgani, u tashlanadi.
            let digits = event.target.value.replace(/\D/g, '');
            if (digits.length > PHONE_LENGTH && digits.startsWith('998')) {
              digits = digits.slice(3);
            }
            onChange(digits.slice(0, PHONE_LENGTH));
          }}
        />
      </div>
    </label>
  );
}
