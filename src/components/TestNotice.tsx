/** Sinov rejimi haqidagi ogohlantirish — sahifaning eng tepasida.
 *
 *  Sayt yangi serverga ko'chdi va natija yozilishi hali tekshirilmoqda.
 *  Odam buni o'ynab bo'lgandan keyin emas, **boshlashdan oldin** bilishi
 *  kerak — shuning uchun sarlavhadan ham yuqorida turadi va yopilmaydi.
 *
 *  Vaqtinchalik: tekshiruv tugagach shu fayl va `App.tsx` dagi bitta
 *  qator o'chiriladi, boshqa joyga iz qolmaydi. */
export default function TestNotice() {
  return (
    <aside className="testnotice" role="status">
      <div className="wrap testnotice__inner">
        <span className="testnotice__tag">Sinov rejimi</span>
        <p className="testnotice__text">
          Sayt hozir sinovdan o‘tmoqda — vaqtincha bu yerda o‘ynamang.
          Natijangiz yozilmay qolishi mumkin. O‘yinni{' '}
          <a href="/#yuklab-olish">ilovada</a> davom ettiring.
        </p>
      </div>
    </aside>
  );
}
