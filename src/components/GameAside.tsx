/** O'yin maydonining yonidagi ustunlar — **ochiq turnirlar**.
 *
 *  Keng ekranda taxta ekran o'rtasida tor ustunda turadi va chap-o'ng
 *  tomoni butunlay bo'sh qoladi. O'sha bo'shliqda ilgari boshqa
 *  o'yinlarimizning kartochkalari turardi: «Turnir», «Mardu
 *  maydon» va hokazo. Ular bo'limga olib borardi, lekin bo'limda
 *  odam yana qidirishi kerak edi — hozir kimdir yig'ilayaptimi,
 *  yo'qmi.
 *
 *  Endi o'sha joyda **hozir yig'ilayotgan turnirlar** turadi: chapda
 *  So'zjang, o'ngda G'uncha. Farqi bitta bosishda emas, javobda —
 *  kartochka «turnir bor» deb emas, «mana shu turnirga hozir
 *  qo'shilish mumkin» deb turadi. O'ynab o'tirgan odam uchun bu
 *  aynan o'sha paytda foydali: u allaqachon o'ynayapti, demak
 *  keyingi o'yinga tayyor.
 *
 *  Ro'yxat bo'sh bo'lsa — turnir ochishga taklif. Bo'sh ustun
 *  qoldirilmaydi: u nosozlikka o'xshaydi.
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
import { links } from '../data/site';
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
        title="So‘zjang turnirlari"
        rows={open.filter((row) => row.game === 'soztop').slice(0, LIMIT)}
      />
      <Column
        side="right"
        title="G‘uncha turnirlari"
        rows={open.filter((row) => row.game === 'guncha').slice(0, LIMIT)}
      />
    </>
  );
}

function Column({
  side,
  title,
  rows,
}: {
  side: 'left' | 'right';
  title: string;
  rows: TurnirRow[];
}) {
  return (
    <aside className={`aside-games aside-games--${side}`} aria-label={title}>
      <h3 className="aside-games__title">{title}</h3>

      {rows.length === 0 ? (
        /* Hech kim yig'ilmayotgan bo'lsa — o'zing ochishga taklif.
           Bo'sh ustun qoldirilmaydi. */
        <a className="aside-game" href={links.turnir}>
          <span className="aside-game__emoji" aria-hidden="true">
            🥇
          </span>
          <span className="aside-game__text">
            <strong>Hozir yig‘ilayotgani yo‘q</strong>
            <span>O‘zingiz ochsangiz, kod bilan do‘st chaqirasiz.</span>
          </span>
        </a>
      ) : (
        rows.map((row) => (
          <a className="aside-game" key={row.code} href={turnirPath(row.code)}>
            <span className="aside-game__emoji" aria-hidden="true">
              🥇
            </span>
            <span className="aside-game__text">
              <strong>{row.title || 'Turnir'}</strong>
              <span>
                {row.players} / {row.capacity} kishi
                {row.capacity - row.players > 0
                  ? ` · yana ${row.capacity - row.players} o‘rin`
                  : ' · to‘ldi'}
              </span>
            </span>
          </a>
        ))
      )}

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
