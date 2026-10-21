/** O'yin maydonining yonidagi taklif ustunlari — «yana nima bor».
 *
 *  Keng ekranda taxta ekran o'rtasida tor ustunda turadi va chap-o'ng
 *  tomoni butunlay bo'sh qoladi. Mehmon uchun o'yin chegarasi olib
 *  tashlanganidan keyin odam shu holatda uzoq o'tiradi — ya'ni o'sha
 *  bo'shliq bizning boshqa o'yinlarimizni ko'rsatadigan yagona
 *  tabiiy joy. Bu reklama emas: yonida turgan taklif, saytning o'z
 *  kartochkalari tilida.
 *
 *  Ikki muhim shart:
 *
 *  1. **Markaz qimirlamaydi.** Ustunlar `position: absolute` bilan
 *     taxtaning yonidagi bo'shliqqa chiziladi, ya'ni ular paydo
 *     bo'lgani bilan taxta ham, klaviatura ham joyidan siljimaydi.
 *  2. **Faqat keng ekranda.** Ko'rsatish qarorini CSS qiladi
 *     (`@media`), JS emas: telefonda va planshetda ustun umuman
 *     chizilmaydi, shuning uchun o'lchovchi hook ham, qayta render
 *     ham kerak emas.
 *
 *  `aria-hidden` emas, lekin `aria-label` bor: bular haqiqiy
 *  havolalar, klaviatura bilan ham ochiladi. */
import { gameLinks } from '../data/site';
import AdBanner from './AdBanner';

export default function GameAside({ current }: { current: string }) {
  // Joriy o'yin chiqarib tashlanadi: o'ynab turgan odamga o'sha
  // o'yinni taklif qilishning ma'nosi yo'q.
  const items = gameLinks.filter((item) => item.id !== current);
  // Qolganlari ikkiga bo'linadi: birinchi yarmi chapga, ikkinchisi
  // o'ngga — ikki tomon ham teng to'ladi, bitta tomon uzun bo'lib
  // qolmaydi.
  const half = Math.ceil(items.length / 2);

  return (
    <>
      <Column items={items.slice(0, half)} side="left" />
      <Column items={items.slice(half)} side="right" />
    </>
  );
}

function Column({ items, side }: { items: typeof gameLinks; side: 'left' | 'right' }) {
  return (
    <aside className={`aside-games aside-games--${side}`} aria-label="Boshqa o‘yinlar">
      {items.map((item) => (
        <a className="aside-game" key={item.id} href={item.href}>
          <span className="aside-game__emoji" aria-hidden="true">
            {item.emoji}
          </span>
          <span className="aside-game__text">
            <strong>{item.name}</strong>
            <span>{item.tagline}</span>
          </span>
        </a>
      ))}
      {/* Kartochkalardan keyin — ustunning qolgan qismi baribir bo'sh
          qolardi. Taxtadan 28px narida va undan pastroqda: o'ynayotgan
          odamning ko'zi oldida emas, lekin surilganda ko'rinadi.

          Ustun `position: absolute`, ya'ni banner kelgani bilan taxta
          ham, klaviatura ham joyidan qimirlamaydi. Tor ekranda butun
          ustun chizilmaydi — banner ham u bilan birga yo'qoladi. */}
      <AdBanner placement={side === 'left' ? 'game' : 'guncha'} />
    </aside>
  );
}
