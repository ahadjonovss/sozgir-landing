/** O'ynash sahifasi — `/oynash`.
 *
 *  Sarlavhada bitta «O'ynash» tugmasi bor; nimani o'ynashni odam shu
 *  yerda tanlaydi: So'zjang, G'uncha, Mardu maydon yoki turnir.
 *
 *  **So'ztop bu yerda yo'q.** Uning taxtasi bosh sahifaning birinchi
 *  ekranida turibdi va kunlik so'z kartochkasi ham o'sha yerda —
 *  ya'ni bu yerdagi kartochka o'sha ikkisini uchinchi marta
 *  takrorlardi. Bu sahifa «yolg'iz o'ynashdan boshqa yana nima bor»
 *  degan savolga javob beradi.
 *
 *  Turnir va Mardu maydon kartochkalari qolganlaridan keyin turadi:
 *  ular yangi o'yin emas, **shakl** — ichida baribir So'zjang yoki
 *  G'uncha o'ynaladi, shuning uchun avval o'yinlarning o'zi
 *  ko'rinishi kerak.
 *
 *  Kartochkalardan keyin o'yinchining o'zi: aqchasi va darajasi, umumiy
 *  reyting va janglar tarixi. Ilgari bular sahifalar bo'ylab sochilgan
 *  edi — reyting o'yin ichida, tarix esa maydon sahifasining yon
 *  ustunida, ya'ni «qanday o'ynayapman» degan savolga javob olish uchun
 *  o'yin ochish kerak edi. Tartib shu savolning tartibi: avval nima
 *  o'ynash, keyin boshqalarga nisbatan qanday va nima bo'lgani.
 *  Kirgan odamning o'z aqchasi esa kartochkalardan oldin: u bu yerga
 *  ko'pincha o'ynagani emas, «qanchaman» deb keladi. */
import { links } from '../data/site';
import { useAuth } from '../lib/auth';
import AdBanner from './AdBanner';
import ArenaHistory from './ArenaHistory';
import BattleStats from './BattleStats';
import PlaysLeft from './PlaysLeft';
import Leaderboard from './Leaderboard';
import { Swords, Trophy, Users } from './Icons';
import GunchaCard from './GunchaCard';
import TelegramBanner from './TelegramBanner';

export default function PlayHub() {
  const { account, openPrompt, ready } = useAuth();

  return (
    <section className="oyin">
      <div className="wrap hub">
        <div className="hub__head">
          <span className="section__kicker">O‘ynash</span>
          <h1>Nimani o‘ynaymiz?</h1>
          <p className="section__lead">
            Do‘stingiz bilan bellashing, harflardan so‘z yig‘ing yoki
            butun davrani maydonga yig‘ing. Hammasi shu yerda, brauzerda.
          </p>
        </div>

        {/* Aqcha va daraja o'yinlardan **oldin**: kirgan odam bu
            sahifaga ko'pincha «qanchaman» deb keladi, kartochkalar esa
            telefonda ikki ekran joy oladi.

            Kirmaganga ko'rsatilmaydi: yangi odam avval o'yinni ko'rishi
            kerak, kirish taklifi esa reyting jadvalining o'zida bor.
            `ready` kutiladi — aks holda kirgan odam ham har tashrifda
            bir lahza bo'sh joyni ko'rardi (`AccountCall` dagi sabab). */}
        {ready && account && (
          <section className="hub__block">
            <h2 className="hub__block-title">Ballaringiz</h2>
            <BattleStats uid={account.uid} />
          </section>
        )}

        <PlaysLeft />

        <div className="hub__grid">
          <article className="hub-card hub-card--battle">
            <div className="hub-card__top">
              <span className="hub-card__icon">
                <Swords size={26} />
              </span>
              <span className="hub-card__badge">Jonli</span>
            </div>
            <h2>So‘zjang</h2>
            <p>
              Bir so‘z, ikki o‘yinchi. Do‘stingizni kod bilan chaqiring yoki
              tezkor jangda tasodifiy raqib toping — kim kamroq urinishda
              topsa, o‘sha yutadi.
            </p>
            <div className="hub-card__status">
              {account ? (
                <span>
                  <b>{account.nickname}</b> sifatida o‘ynaysiz
                </span>
              ) : (
                <span>Jang uchun hisob kerak — raqib taxallusingizni ko‘radi</span>
              )}
            </div>
            <div className="hub-card__actions">
              {/* Asosiy tugma jangning o'ziga olib boradi, lobbiga
                  emas: qidiruv havolaning o'zidan boshlanadi
                  (`?tezkor=1`). Ilgari bu yerda «Jangga kirish»
                  turardi va odam lobbida yana bir marta «Raqib
                  qidirish» ni bosardi — o'sha ekranda boshqa
                  qaror yo'q edi. Do'st bilan o'ynash esa qaror:
                  kod yaratish yoki terish kerak, shuning uchun u
                  alohida, ikkinchi darajali havola. */}
              {account ? (
                <>
                  <a className="btn" href={links.battleQuick}>
                    Raqib qidirish
                  </a>
                  <a className="btn btn--ghost" href={links.battle}>
                    Do‘st bilan
                  </a>
                </>
              ) : (
                <>
                  <button className="btn" onClick={() => openPrompt('signIn')}>
                    Kirish
                  </button>
                  <a className="btn btn--ghost" href={links.battle}>
                    Jangni ko‘rish
                  </a>
                </>
              )}
            </div>
          </article>

          <GunchaCard />

          <article className="hub-card hub-card--mardu">
            <div className="hub-card__top">
              <span className="hub-card__icon">
                <Users size={26} />
              </span>
              <span className="hub-card__badge">8 kishigacha</span>
            </div>
            <h2>Mardu maydon</h2>
            <p>
              Yangi o‘yin emas — yangi shakl. O‘sha So‘zjang yoki G‘uncha,
              lekin ikki kishi emas: sakkiztagacha odam bir vaqtda o‘ynaydi
              va oxirida jadval tuziladi.
            </p>
            <div className="hub-card__status">
              <span>
                Tezkor maydonga kiring yoki bitta havola bilan butun davrani
                yig‘ing
              </span>
            </div>
            <div className="hub-card__actions">
              <a className="btn" href={links.mardu}>
                Maydonga kirish
              </a>
            </div>
          </article>

          {/* Turnir maydondan **keyin**: ichida o'ynaladigani o'sha
              maydon, ya'ni odam avval maydonni ko'rishi kerak. */}
          <article className="hub-card hub-card--turnir">
            <div className="hub-card__top">
              <span className="hub-card__icon">
                <Trophy size={26} />
              </span>
              <span className="hub-card__badge">8–32 kishi</span>
            </div>
            <h2>Turnir</h2>
            <p>
              Ketma-ket bir necha maydon: har davrada o‘zingizga teng
              ochkodagilar bilan o‘ynaysiz, oxirida esa jadvalning birinchi
              ikki o‘rni finalga chiqadi.
            </p>
            <div className="hub-card__status">
              <span>
                Chiqarib yuborish yo‘q — hamma oxirgi davragacha o‘ynaydi
              </span>
            </div>
            <div className="hub-card__actions">
              <a className="btn" href={links.turnir}>
                Turnirga kirish
              </a>
            </div>
          </article>
        </div>

        {/* Sarlavha yo'q: `Leaderboard` va `ArenaHistory` o'z
            sarlavhasi bilan keladi (ular boshqa sahifalarda yolg'iz
            turadi), ikkinchisi takror bo'lardi.

            Ikkovi bitta o'ramda: keng ekranda yonma-yon turadi, aks
            holda jadval butun enga cho'zilib, ism chap chetda, aqcha
            o'ng chetda qolardi. Tarix hisobsiz umuman chizilmaydi —
            `ArenaHistory` o'zi qaror qiladi, o'ram esa shunda yolg'iz
            qolgan jadvalni o'qishga qulay enda ushlaydi. */}
        <div className="hub__panels">
          <Leaderboard />
          <ArenaHistory />
        </div>

        <TelegramBanner />

        {/* Reklama bo'lim oxirida: odam nimani o'ynashni tanlab bo'lgan,
            kartochkalar bilan tugma orasiga hech narsa qo'yilmagan. */}
        <AdBanner placement="hub" fit="edge" />

        <p className="hub__more">
          Ilovada yana:
          <a className="chip" href="/#modullar">
            Yangso‘z
          </a>
          <a className="chip" href="/#modullar">
            Kategoriyalar
          </a>
          <a className="chip" href="/#modullar">
            Reyting
          </a>
          <a className="chip" href="/#yuklab-olish">
            Yuklab olish →
          </a>
        </p>
      </div>
    </section>
  );
}
