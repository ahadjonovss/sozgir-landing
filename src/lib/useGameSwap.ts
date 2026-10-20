/** O'yin turini almashtirish — So'ztop ↔ g'uncha.
 *
 *  Taxta ustidagi belgi shu yerdan boshqariladi. Bosilganda **hech
 *  qayerga o'tilmaydi**: manzil ham, sahifa ham, yon ustun ham
 *  o'sha-o'sha qoladi — faqat belgining ostidagi taxta almashadi.
 *
 *  Hook uchta joyda kerak: `/oyin` (`GameHub`), uzunlik sahifalari
 *  (`EndlessPage`) va bosh sahifadagi taxta (`Hero`). Ilgari
 *  almashtirgich faqat birinchisida bor edi va qolgan ikkitasida
 *  belgi umuman chizilmasdi.
 *
 *  `forced` — manzil aytgan o'yin (`/guncha` da g'uncha). Tanlov uning
 *  **ustiga** yoziladi va manzil o'zgarishi bilan o'zi bekor bo'ladi:
 *  odam menyudan boshqa o'yinni ochsa, oldingi almashtirish qoldig'i
 *  unga ta'sir qilmaydi. Shu sabab alohida tozalash effekti kerak
 *  emas.
 *
 *  G'uncha holati ham shu yerda: u taxta ko'rinmaganda ham saqlanib
 *  turadi, ya'ni almashib qaytgan odam g'unchasini o'sha joyidan davom
 *  ettiradi. Klaviatura esa faqat ko'rinib turgan o'yinga bog'lanadi
 *  (`useGuncha(active)`) — ikkalasi ham eshitsa, bitta bosilgan harf
 *  ikkala taxtaga tushardi. */
import { useState } from 'react';
import { useGuncha } from './useGuncha';

export function useGameSwap(forced = false) {
  const [swap, setSwap] = useState<{ from: boolean; to: boolean } | null>(null);
  const flower = swap?.from === forced ? swap.to : forced;
  const guncha = useGuncha(flower);

  return {
    /** Hozir g'uncha ko'rinib turibdimi. */
    flower,
    guncha,
    toggle: () => setSwap({ from: forced, to: !flower }),
  };
}
