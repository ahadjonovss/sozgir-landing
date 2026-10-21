/** Onlayn o'yin oldidagi darvoza oynasi — ilovadagi `AdGateSheet`.
 *
 *  Oyna **reklama haqida emas, tarif haqida** gapiradi: eng katta
 *  raqam — eng arzon tarifning narxi, ostida u necha kunga yetishi va
 *  nima berishi. Reklamani ko'rish esa ikkinchi, jim tugma bo'lib
 *  qoladi. Sabab oddiy: odamga ikkita yo'l taklif qilinyapti va
 *  ulardan birini loyiha afzal ko'radi.
 *
 *  Yopilishi mumkin — fon, ✕ va Escape. Majburlash o'yinchining
 *  g'ashiga tegadi va uni saytdan butunlay chiqarib yuborishi
 *  mumkin. Lekin yopish «reklamasiz o'ynayver» degani emas: o'yin ham
 *  boshlanmaydi va sanoq nolga qaytmaydi, ya'ni keyingi o'yinda yana
 *  so'raladi.
 *
 *  Qoidaning o'zi `lib/adGate.ts` da — bu yerda faqat ko'rinish. */
import { useEffect, useState } from 'react';
import { answerGate, EVERY_GAMES, watchGate } from '../lib/adGate';
import { ENTRY_DAYS, ENTRY_PRICE } from '../lib/premium';
import { formatSum } from '../lib/support';
import DonateModal from './DonateModal';
import Modal from './Modal';

export default function AdGate() {
  const [open, setOpen] = useState(false);
  const [donate, setDonate] = useState(false);

  useEffect(() => watchGate(setOpen), []);

  if (!open) return null;

  return (
    <>
      <Modal
        title="Reklamasiz o‘ynang"
        lead="So‘zgir bepul va reklama uni shunday ushlab turadi. Xohlasangiz, arzon tarif bilan reklamani butunlay o‘chirasiz."
        onClose={() => answerGate('closed')}
      >
        <div className="gate">
          {/* Oynadagi eng katta raqam — kirish tarifi. U haftalik
              ulushdan ham arzon, ya'ni bu yerda eng past summa
              turadi. */}
          <p className="gate__price">
            <strong>{formatSum(ENTRY_PRICE)}</strong>
            <span>so‘m — {ENTRY_DAYS} kun reklamasiz</span>
          </p>

          <ul className="gate__perks">
            <li>Bannerlar ham, to‘liq ekranlilari ham yo‘q</li>
            <li>Profilda qo‘llovchi muhri</li>
            <li>Loyihaga to‘g‘ridan-to‘g‘ri yordam</li>
          </ul>

          {/* Va'da raqam bilan: «reklama kamroq» emas, aynan shu oyna
              boshqa chiqmaydi. */}
          <p className="panel__note">
            Premium olsangiz, har {EVERY_GAMES} o‘yindan keyin bu oyna
            chiqmaydi.
          </p>

          <div className="gate__actions">
            {/* To'lov oynasi darvozaning **ustiga** ochiladi: yopilganda
                odam shu yerga qaytadi. Darvozani oldin yopish uni
                to'lovdan voz kechgan zahoti raqib qidiruviga otib
                yuborardi. */}
            <button className="btn btn--lg" onClick={() => setDonate(true)}>
              Reklamani o‘chirish
            </button>
            <button className="link gate__watch" onClick={() => answerGate('watch')}>
              Reklamani ko‘rish
            </button>
          </div>
        </div>
      </Modal>

      {donate && <DonateModal onClose={() => setDonate(false)} />}
    </>
  );
}
