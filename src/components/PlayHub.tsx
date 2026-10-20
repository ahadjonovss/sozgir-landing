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
import { useAuth } from '../lib/auth';
import BattlePage from './BattlePage';
import BattleStats from './BattleStats';
import GameHub from './GameHub';
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
  const { account, ready } = useAuth();
  /** Ochiq turgani — birinchisi: So'zjang bu sahifadagi eng ko'p
   *  bosiladigan o'yin. */
  const [tab, setTab] = useState<TabId>('sozjang');

  return (
    <>
      <section className="oyin">
        <div className="wrap hub hub--pick">
          {/* Aqcha va daraja tanlovdan **oldin**.
              Kirmaganga ko'rsatilmaydi: yangi odam avval o'yinni
              ko'rishi kerak, kirish taklifi esa o'yinning o'zida bor.
              `ready` kutiladi — aks holda kirgan odam ham har
              tashrifda bir lahza bo'sh joyni ko'rardi. */}
          {ready && account && (
            <section className="hub__block">
              <h2 className="hub__block-title">Ballaringiz</h2>
              <BattleStats uid={account.uid} />
            </section>
          )}

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
        {/* G'uncha sahifasi endi So'ztop bilan bitta komponentda
            (`GameHub`): ikkala taxta bir joyda yashaydi va belgi bilan
            almashadi. Bu yerda uning g'uncha ko'rinishi kerak. */}
        {tab === 'guncha' && <GameHub game="guncha" />}
        {tab === 'mardu' && <MarduPage />}
        {tab === 'turnir' && <TurnirPage />}
      </div>

      {/* Umumiy reyting o'yindan keyin. Janglar tarixi bu yerda yo'q:
          u tanlangan o'yinning o'z sahifasida chiqadi va bu yerda
          ikkinchi marta turardi. */}
      <section className="oyin">
        <div className="wrap hub">
          <Leaderboard />
        </div>
      </section>
    </>
  );
}
