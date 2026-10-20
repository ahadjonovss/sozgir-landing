/** O'ynash sahifasi — `/oynash`.
 *
 *  Tepada to'rtta nom, ostida **o'yinning o'z sahifasi**: So'zjangda
 *  raqib qidirish va kod bilan chaqirish, g'unchada harflarning o'zi,
 *  maydonda va turnirda ularning ekranlari.
 *
 *  Ilgari bu yerda to'rtta tanishtiruv kartochkasi turardi: odam
 *  «Mardu maydon — yangi o'yin emas, yangi shakl» degan jumlani
 *  o'qib, keyin tugmani bosib, keyin yana bir sahifa ochilishini
 *  kutardi. Holbuki u o'ynagani kelgan. Endi tanlangan o'yin
 *  **shu yerda, shu zahoti** ochiladi — nom bosilishi o'yinni
 *  almashtiradi, boshqa hech narsa qilmaydi.
 *
 *  **So'ztop bu yerda yo'q.** Uning taxtasi bosh sahifaning birinchi
 *  ekranida turibdi va kunlik so'z kartochkasi ham o'sha yerda. Bu
 *  sahifa «yolg'iz o'ynashdan boshqa yana nima bor» degan savolga
 *  javob beradi.
 *
 *  Tartib: avval o'yinning o'zi (So'zjang, G'uncha), keyin shakl
 *  (Mardu maydon, Turnir) — ikkinchisining ichida baribir birinchisi
 *  o'ynaladi.
 *
 *  Kirgan odamning aqchasi tanlovdan oldin: u bu yerga ko'pincha
 *  o'ynagani emas, «qanchaman» deb keladi. Umumiy reyting esa
 *  o'yindan keyin — u «boshqalarga nisbatan qanday» degan boshqa
 *  savol. */
import { useState } from 'react';
import BattlePage from './BattlePage';
import GunchaBattlePage from './GunchaBattlePage';
import Leaderboard from './Leaderboard';
import MarduPage from './MarduPage';
import PlaysLeft from './PlaysLeft';
import TurnirPage from './TurnirPage';

/** Tanlov ro'yxati — tartibi yuqorida aytilgan. */
const TABS = [
  { id: 'sozjang', name: 'So‘zjang' },
  { id: 'guncha', name: 'G‘uncha' },
  { id: 'mardu', name: 'Mardu maydon' },
  { id: 'turnir', name: 'Turnir' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function PlayHub() {
  /** Ochiq turgani — birinchisi: So'zjang bu sahifadagi eng ko'p
   *  bosiladigan o'yin. */
  const [tab, setTab] = useState<TabId>('sozjang');

  return (
    <>
      <section className="oyin">
        <div className="wrap hub hub--pick">
          {/* Aqcha kartochkasi bu yerda yo'q: tanlangan o'yinning
              sahifasida «Jang aqchasi» allaqachon turibdi va
              ikkalasi bir ekranda ikki marta bir xil sonni
              ko'rsatardi. Tanlovdan oldin faqat qolgan o'yinlar
              soni — u bir qatorlik. */}
          <PlaysLeft />

          <div className="hub__tabs" role="tablist" aria-label="O‘yinlar">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`hub-tab-${item.id}`}
                aria-selected={tab === item.id}
                aria-controls={`hub-panel-${item.id}`}
                className={`hub-tab hub-tab--${item.id}${tab === item.id ? ' hub-tab--on' : ''}`}
                onClick={() => setTab(item.id)}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* O'yinning o'z sahifasi — ko'chirma emas, o'sha komponentning
          o'zi. Ikki nusxa ikki xil xulq degani bo'lardi: bu yerda
          tugma boshqacha ishlasa, odam `/sozjang` ga o'tganda
          boshqa narsa ko'rardi.

          O'ram `.hub__panel` ichida emas: har sahifa o'zining
          `section.oyin > .wrap` i bilan keladi va uni yana bir
          o'ramga solish ikki qavat hoshiya degani bo'lardi. */}
      <div className="hub__stage" id={`hub-panel-${tab}`} role="tabpanel" aria-labelledby={`hub-tab-${tab}`}>
        {tab === 'sozjang' && <BattlePage />}
        {/* G'unchaning **onlayn** ko'rinishi: bu sahifadagi to'rttala
            tab ham birovlar bilan o'ynash haqida (So'zjang, maydon,
            turnir). Kunlik g'uncha va mashq yolg'iz o'ynaladi —
            ularning o'z joyi bor (`/guncha`), bu yerda esa odam
            raqib qidirib turibdi. */}
        {tab === 'guncha' && <GunchaBattlePage />}
        {tab === 'mardu' && <MarduPage />}
        {tab === 'turnir' && <TurnirPage />}
      </div>

      {/* Umumiy reyting o'yindan keyin. Janglar tarixi bu yerda yo'q:
          u tanlangan o'yinning o'z sahifasida chiqadi va bu yerda
          ikkinchi marta turardi. */}
      <section className="oyin hub__after">
        <div className="wrap hub">
          <Leaderboard />
        </div>
      </section>
    </>
  );
}
