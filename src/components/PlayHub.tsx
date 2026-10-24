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
import BattlePage from './BattlePage';
import GunchaBattlePage from './GunchaBattlePage';
import Leaderboard from './Leaderboard';
import MarduPage from './MarduPage';
import SoonPage from './SoonPage';
import PlaysLeft from './PlaysLeft';
import BattleStats from './BattleStats';
import TurnirPage from './TurnirPage';
import AdBanner from './AdBanner';
import { isSoon, links } from '../data/site';
import { Flower, Swords, Trophy, Users } from './Icons';
import { routeParam } from '../lib/useRoute';
import { useStage } from '../lib/stage';
import { useAuth } from '../lib/auth';

/** Tanlov ro'yxati — tartibi yuqorida aytilgan.
 *
 *  `slug` — manzildagi bo'lak. U `id` dan farq qilishi mumkin: maydon
 *  saytda hamma joyda `/maydon` deb ataladi (`links.arena`), ichkarida
 *  esa `mardu` nomi ishlatiladi. Manzilga odam ko'radigan nom chiqadi. */
const TABS = [
  { id: 'turnir', slug: 'turnir', name: 'Turnir', icon: Trophy },
  { id: 'sozjang', slug: 'sozjang', name: 'So‘zjang', icon: Swords },
  { id: 'guncha', slug: 'guncha', name: 'G‘uncha', icon: Flower },
  { id: 'mardu', slug: 'maydon', name: 'Mardu maydon', icon: Users },
] as const;

type TabId = (typeof TABS)[number]['id'];

/** Ochiq turadigani — birinchisi: Turnir. U bo'limdagi eng katta
 *  shakl va unga kirishda vaqt muhim — xona yig'ilib turgan
 *  bo'lishi mumkin. Qolgan uchtasi bir bosishda ochiladi. */
const FIRST = TABS[0];

/** Tabning manzili. Birinchisi `/oynash` ning o'zi: bo'lak qo'shilsa
 *  bitta sahifaning ikkita manzili bo'lib qolardi. */
function hrefOf(slug: string): string {
  return slug === FIRST.slug ? links.hub : `${links.hub}/${slug}`;
}

export default function PlayHub() {
  /* Tanlangan o'yin **manzilda**, holatda emas.
   *
   *  Ilgari u `useState` da turardi va shundan uchta narsa kelib
   *  chiqardi: brauzerning «ortga» tugmasi tabni qaytarmasdi, tanlangan
   *  o'yinga havola yuborib bo'lmasdi, sahifa yangilansa esa odam
   *  qaysi tabda turgan bo'lsa ham birinchisiga qaytardi.
   *
   *  Manzil ko'rinishi — `/oynash/maydon`. Router buni parametrli
   *  manzil deb oladi (`useRoute.ts` dagi `PARAM_ROUTES`), ya'ni
   *  sahifa qayta yuklanmaydi va `PlayHub` daraxtda qolaveradi:
   *  faqat markazdagi o'yin almashadi. Noma'lum bo'lak — birinchi
   *  tab: qo'lda yozilgan manzil bo'sh ekran bermasligi kerak. */
  const { account } = useAuth();
  const slug = routeParam();
  const tab: TabId = (TABS.find((item) => item.slug === slug) ?? FIRST).id;
  /* Jang ketayotganda tanlov yashiriladi: taxtaning ustida boshqa
     o'yinga o'tkazadigan tugma turmasligi kerak. Jang tugab lobbiga
     qaytilganda nomlar o'z o'rniga qaytadi. */
  const live = useStage();

  return (
    <>
      <section className={`oyin hub__top${live ? ' hub__top--off' : ''}`}>
        <div className="wrap hub hub--pick">
          {/* Aqcha va jang sanog'i — tablarning **ustida**, butun
              kenglikda. Ilgari u So'zjang lobbisining ichida, chap
              ustunning pastida turardi: faqat bitta tabda
              ko'rinardi va uni ko'rish uchun surish kerak edi,
              holbuki son uchala tabga ham tegishli — aqcha
              So'zjangda ham, g'unchada ham, maydonda ham o'sha.

              Endi u sahifaning sarlavhasi bo'lib turadi va tanlovdan
              oldin javob beradi: qancha aqcham bor, nechta jang
              o'ynadim. */}
          {account && <BattleStats uid={account.uid} compact />}
          <PlaysLeft />

          <div className="hub__tabs" role="tablist" aria-label="O‘yinlar">
            {TABS.map((item) => (
              /* Tugma emas, havola: manzilni routerning o'zi suradi va
                 «ortga» tugmasi ham shundan ishlaydi. `data-scroll`
                 — sahifa tepaga sakramasin: almashadigan narsa
                 o'rtadagi o'yin, sahifaning o'zi emas.

                 Ochiq turgan tabning havolasi bosilganda hech narsa
                 qilinmaydi: router bir xil manzilni o'ziga olmaydi va
                 brauzer sahifani boshidan yuklab yuborardi. */
              <a
                key={item.id}
                role="tab"
                href={hrefOf(item.slug)}
                data-scroll="keep"
                id={`hub-tab-${item.id}`}
                aria-selected={tab === item.id}
                aria-controls={`hub-panel-${item.id}`}
                className={`hub-tab hub-tab--${item.id}${tab === item.id ? ' hub-tab--on' : ''}`}
                onClick={(event) => {
                  if (tab === item.id) event.preventDefault();
                }}
              >
                {/* Nom yonida ikonka — ilovadagi bilan bir xil
                    belgi. Bir qarashda ajratadi: to'rtta o'zbekcha
                    nom bir-biriga o'xshab ketadi va odam ularni
                    o'qib chiqishga majbur bo'lardi. */}
                <item.icon size={16} />
                {item.name}
                {/* Yopiq bo'lim tanlovdan olinmadi: u ilovada bor va
                    ro'yxatdan yo'qolsa «o'chirib tashlabdi» degan
                    taassurot qolardi. Bosiladi ham — ichida nega
                    yopiqligi yozilgan. */}
                {isSoon(item.id) && <span className="hub-tab__soon">Tez orada</span>}
              </a>
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
        {tab === 'sozjang' && <BattlePage inHub />}
        {/* G'unchaning **onlayn** ko'rinishi: bu sahifadagi to'rttala
            tab ham birovlar bilan o'ynash haqida (So'zjang, maydon,
            turnir). Kunlik g'uncha va mashq yolg'iz o'ynaladi —
            ularning o'z joyi bor (`/guncha`), bu yerda esa odam
            raqib qidirib turibdi. */}
        {tab === 'guncha' && <GunchaBattlePage />}
        {tab === 'mardu' &&
          (isSoon('mardu') ? (
            <SoonPage
              name="Mardu maydon"
              lead="O‘sha So‘zjang yoki G‘uncha, lekin ikki kishi emas: sakkiztagacha odam bir vaqtda o‘ynaydi va oxirida jadval tuziladi."
            />
          ) : (
            <MarduPage />
          ))}
        {tab === 'turnir' &&
          (isSoon('turnir') ? (
            <SoonPage
              name="Turnir"
              lead="Ketma-ket bir necha mardu maydoni: har davradan yuqori yarmi o‘tadi."
            />
          ) : (
            <TurnirPage />
          ))}
      </div>

      {/* Umumiy reyting o'yindan keyin. Janglar tarixi bu yerda yo'q:
          u tanlangan o'yinning o'z sahifasida chiqadi va bu yerda
          ikkinchi marta turardi.

          Jang ketayotganda reyting umuman chizilmaydi: o'ynayotgan
          odam uni o'qimaydi, lekin u taxtadan kengroq bo'lib
          chetdagi bannerlarga tiqilardi. Jang tugagach qaytadi —
          aynan o'sha payt «boshqalarga nisbatan qanday» degan savol
          tug'iladi. */}
      {!live && (
        <section className="oyin hub__after">
          <div className="wrap hub">
            {/* Turnir tabida reyting o'z qatorida turadi — turnirlar
                tarixi bilan yonma-yon (`TurnirPage`). Bu yerda ham
                chizilsa, bitta sahifada ikkita bir xil jadval
                bo'lardi. */}
            {tab !== 'turnir' && <Leaderboard />}
            {/* Sahifaning eng oxiri: taxta ham, raqib qidirish ham
                ancha yuqorida qoladi. */}
            <AdBanner placement="hub" />
          </div>
        </section>
      )}
    </>
  );
}
