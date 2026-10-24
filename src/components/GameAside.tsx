/** O'yin maydonining yonidagi ustunlar.
 *
 *  Keng ekranda taxta ekran o'rtasida tor ustunda turadi va chap-o'ng
 *  tomoni butunlay bo'sh qoladi. O'sha bo'shliqda ikkita o'yin
 *  turadi: chapda So'zjang, o'ngda G'uncha jangi. Har birining
 *  ostida — **o'sha o'yinning hozir yig'ilayotgan turnirlari**.
 *
 *  Tartib shu sababdan: kartochka «bunday o'yin bor» deydi, ostidagi
 *  ro'yxat esa «mana shunga hozir qo'shilish mumkin». Ikkinchisi
 *  birinchisisiz ma'nosiz — odam turnir nima ekanini bilmasa,
 *  «0 / 8 kishi» unga hech narsa aytmaydi.
 *
 *  Ilgari bu yerda beshta o'yin ikki ustunga bo'lib tashlanardi
 *  (Turnir, Mardu maydon, Cheksiz ham). Ular bo'limga olib borardi,
 *  lekin bo'limda odam yana qidirishi kerak edi: hozir kimdir
 *  yig'ilayaptimi yoki yo'qmi.
 *
 *  Ikki muhim shart o'zgarmadi:
 *
 *  1. **Markaz qimirlamaydi.** Ustunlar `position: absolute` bilan
 *     taxtaning yonidagi bo'shliqqa chiziladi, ya'ni ular paydo
 *     bo'lgani bilan taxta ham, klaviatura ham joyidan siljimaydi.
 *  2. **Faqat keng ekranda.** Ko'rsatish qarorini CSS qiladi
 *     (`@media`), JS emas: telefonda va planshetda ustun umuman
 *     chizilmaydi. */
import { useEffect, useState } from 'react';
import { gameLinks } from '../data/site';
import { turnirPath, watchOpenTurnirList, type TurnirRow } from '../lib/turnir';
import AdBanner from './AdBanner';

/** Ustunga shuncha turnir sig'adi. Ortig'i kesiladi: yonidagi ustun
 *  taxtadan baland bo'lib ketmasligi kerak — u yordamchi, asosiy
 *  narsa emas. */
const LIMIT = 3;

export default function GameAside() {
  const [open, setOpen] = useState<TurnirRow[]>([]);

  useEffect(() => watchOpenTurnirList(setOpen), []);

  return (
    <>
      <Column
        side="left"
        id="sozjang"
        rows={open.filter((row) => row.game === 'soztop').slice(0, LIMIT)}
      />
      <Column
        side="right"
        id="guncha"
        rows={open.filter((row) => row.game === 'guncha').slice(0, LIMIT)}
      />
    </>
  );
}

function Column({
  side,
  id,
  rows,
}: {
  side: 'left' | 'right';
  /** Ustun boshidagi o'yin — `data/site.ts` dagi ro'yxatdan. */
  id: string;
  rows: TurnirRow[];
}) {
  const game = gameLinks.find((item) => item.id === id);
  if (!game) return null;

  return (
    <aside className={`aside-games aside-games--${side}`} aria-label={game.name}>
      <a className="aside-game" href={game.href}>
        <span className="aside-game__emoji" aria-hidden="true">
          {game.emoji}
        </span>
        <span className="aside-game__text">
          <strong>{game.name}</strong>
          <span>{game.tagline}</span>
        </span>
      </a>

      {/* Turnirlar o'yin kartochkasining ostida. Hech kim
          yig'ilmayotgan bo'lsa hech narsa chizilmaydi: «turnir yo'q»
          degan bo'sh qator kartochkaning o'zidan ko'ra ko'proq joy
          egallardi va hech narsa aytmasdi. */}
      {rows.length > 0 && (
        <>
          <h3 className="aside-games__title">
            Ochiq turnirlar
            {/* Tirik nuqta: ro'yxat o'zi yangilanadi, jim turgan
                sonlar esa odatda eski deb o'ylanadi. */}
            <span className="tnr-open__live">
              <i aria-hidden="true" />
            </span>
          </h3>
          {rows.map((row) => {
            const free = row.capacity - row.players;
            return (
              <a
                className="aside-game aside-game--sub"
                key={row.code}
                href={turnirPath(row.code)}
              >
                <span className="aside-game__emoji" aria-hidden="true">
                  🥇
                </span>
                <span className="aside-game__text">
                  <strong>{row.title || 'Turnir'}</strong>
                  <span>
                    {row.players} / {row.capacity} kishi
                    {free > 0 ? ` · yana ${free} o‘rin` : ' · to‘ldi'}
                  </span>
                  {/* To'lish chizig'i — turnir bo'limidagining o'zi
                      (`tnr-open__bar`). Sonning o'zi xona
                      yig'ilayotganini aytmasdi: odam uni bir marta
                      o'qiydi va u qimirlamaydigan yozuvga
                      o'xshaydi. Joy qolmaganda yorug'lik
                      yugurmaydi. */}
                  <span
                    className={`tnr-open__bar${free > 0 ? ' tnr-open__bar--live' : ''}`}
                  >
                    <i style={{ width: `${(row.players / row.capacity) * 100}%` }} />
                  </span>
                </span>
              </a>
            );
          })}
        </>
      )}

      {/* Kartochkalardan keyin — ustunning qolgan qismi baribir bo'sh
          qolardi. Taxtadan 28px narida va undan pastroqda: o'ynayotgan
          odamning ko'zi oldida emas, lekin surilganda ko'rinadi. */}
      <AdBanner placement={side === 'left' ? 'game' : 'guncha'} />
    </aside>
  );
}
