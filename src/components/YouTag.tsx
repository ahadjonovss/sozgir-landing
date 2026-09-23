/** Ro'yxatda o'z qatorini belgilaydigan yorliq.
 *
 *  Ilgari yorliq nomga qo'shib yozilardi («Ism · Siz», donatlarda esa
 *  «Bu siz») — oddiy matn. Kimdir taxallusiga aynan shu quyruqni yozib
 *  qo'ysa («Otabek • Siz»), begona qator ham o'ziniki bo'lib ko'rinardi
 *  va odam boshqaning ballini o'ziniki deb o'qirdi.
 *
 *  Endi yorliq alohida element: o'yin rangidagi quticha. Uni taxallus
 *  bilan takrorlab bo'lmaydi — matn emas, shakl. Nom darajasida ham
 *  to'siq bor (`imitatesYouTag`), ya'ni bitta ro'yxatda ikki xil «Siz»
 *  turmaydi.
 *
 *  Ilovadagi `YouTag` bilan bir xil ko'rinadi. Rangli yuzada (podium
 *  zinasi) yashil begona ko'rinardi — u yerda yorliq yuzaning o'z
 *  siyohini oladi, buni uslub hal qiladi. */
export default function YouTag() {
  return <span className="you-tag">Siz</span>;
}
