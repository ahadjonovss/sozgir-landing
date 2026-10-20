/** So'ztop va g'uncha — **bitta** sahifa.
 *
 *  Ikkala o'yin ham shu yerda yashaydi va taxta ustidagi belgi
 *  bosilganda faqat markazdagi taxta almashadi: sahifa qayta
 *  chizilmaydi, yon ustun joyida qoladi, surilish qimirlamaydi va
 *  hech narsa qaytadan yuklanmaydi. Ilgari ikkisi ikki sahifa edi va
 *  almashish «boshqa sahifaga o'tish» bo'lib ko'rinardi.
 *
 *  Manzil esa o'zgaraveradi (`/oyin` ↔ `/guncha`): u ulashiladi,
 *  yangilanadi va qidiruvda alohida sahifa bo'lib turadi. React uchun
 *  bu bitta komponent — marshrut o'zgarsa ham u qayta o'rnashmaydi,
 *  shuning uchun ikkala o'yinning holati ham saqlanib qoladi: g'unchaga
 *  o'tib qaytgan odam So'ztop taxtasini o'sha joyidan davom ettiradi.
 *
 *  **Klaviatura** faqat ko'rinib turgan o'yinga bog'lanadi
 *  (`useSozTop(..., active)`, `useGuncha(active)`): ikkalasi ham
 *  eshitsa, bitta bosilgan harf ikkala taxtaga ham tushardi. */
import { useEffect } from 'react';
import { links } from '../data/site';
import { useAuth } from '../lib/auth';
import { dailyNumber } from '../lib/daily';
import { useGameChoice } from '../lib/useGameChoice';
import { useGameSwap } from '../lib/useGameSwap';
import { useSozTop } from '../lib/useSozTop';
import AdBanner from './AdBanner';
import ArenaHistory from './ArenaHistory';
import BadgesCard from './BadgesCard';
import { GunchaBoard, GunchaFound } from './GunchaBoard';
import Play from './Play';
import StatsPanel from './StatsPanel';
import TelegramBanner from './TelegramBanner';

export type HubGame = 'soztop' | 'guncha';

export default function GameHub({ game }: { game: HubGame }) {
  const { account, openPrompt } = useAuth();
  const choice = useGameChoice();

  /* Almashtirgich va g'uncha holati — `lib/useGameSwap.ts` da:
     o'sha mexanizm uzunlik sahifalarida va bosh sahifadagi taxtada
     ham ishlatiladi. */
  const swap = useGameSwap(game === 'guncha');
  const shown: HubGame = swap.flower ? 'guncha' : 'soztop';

  const soztop = useSozTop(choice, shown === 'soztop');
  const guncha = swap.guncha;
  const flower = swap.flower;

  /* Ikkinchi o'yinning lug'ati fonda tayyorlanadi — almashganda
     «Lug'at yuklanmoqda…» chiqmasligi uchun. Ikkalasi ham bir marta
     yig'iladi va keshda qoladi, ya'ni bu bir martalik ish. */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void import('../lib/gunchaLexicon').then((m) => m.gunchaLexicon()).catch(() => {});
    }, 1500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <section className="oyin">
      <div className="wrap oyin__grid">
        {/* `--fit`: telefonda taxta va klaviatura bitta ekranga sig'adi —
            o'ynash uchun surish kerak emas (ilovadagidek). G'unchada
            bunday chegara yo'q: u o'zi ixcham. */}
        <div className={`oyin__board${flower ? '' : ' oyin__board--fit'}`}>
          {flower ? (
            <GunchaBoard guncha={guncha} onSwap={swap.toggle} />
          ) : (
            <Play choice={choice} game={soztop} onSwap={swap.toggle} />
          )}
        </div>

        <aside className="oyin__side">
          {!account && (
            <div className="panel panel--call">
              <h3>Natijangiz saqlanmayapti</h3>
              <p className="panel__note">
                {flower
                  ? 'Hozir hisobsiz o‘ynayapsiz — g‘unchada yig‘ilgan aqcha faqat shu brauzerda qoladi. Kirsangiz u umumiy jadvalga qo‘shiladi.'
                  : 'Hozir hisobsiz o‘ynayapsiz — natija faqat shu brauzerda qoladi. Kirsangiz aqcha jadvalga tushadi va boshqa qurilmadan ham ko‘rinadi.'}
              </p>
              <button className="btn btn--sm" onClick={() => openPrompt('signIn')}>
                Kirish
              </button>
            </div>
          )}

          {/* O'yinning o'z paneli — yon ustunda almashadigan yagona
              narsa. Qolgan kartochkalar ikkala o'yinda ham bir xil
              o'rinda turadi. */}
          {flower ? (
            <GunchaFound guncha={guncha} />
          ) : (
            <StatsPanel choice={choice} stats={soztop.stats} total={soztop.total} />
          )}

          {/* Nishonlar o'yin panelidan keyin: ikkalasi ham «men qanday
              o'ynayapman» degan savolga javob beradi. */}
          <BadgesCard />

          {/* Janglar tarixi — «kim bilan o'ynadim» degan savol o'yinga
              qarab bo'linmaydi. Hisobsiz odamga umuman chizilmaydi. */}
          <ArenaHistory />

          <TelegramBanner compact />

          <div className="panel panel--call">
            <h3>{flower ? 'Raqib bilan o‘ynash' : 'Do‘st bilan bellashing'}</h3>
            <p className="panel__note">
              {flower
                ? 'G‘uncha jangida ikkalangizga bir xil g‘uncha beriladi va uch daqiqa vaqt bo‘ladi. Kim ko‘p so‘z yig‘sa — o‘sha yutadi.'
                : 'So‘zjangda bir so‘z ikki o‘yinchiga beriladi: kim birinchi topsa — o‘sha yutadi. Do‘stingizni kod bilan chaqiring yoki tasodifiy raqib toping.'}
            </p>
            <a className="btn btn--sm" href={flower ? links.gunchaBattle : links.battle}>
              {flower ? 'G‘uncha jangiga o‘tish' : 'So‘zjangga o‘tish'}
            </a>
          </div>

          {/* Ikkinchi o'yinga havola — taxta ustidagi belgi ham shu
              ishni qiladi, lekin u faqat o'ynab turgan odamning ko'z
              oldida; bu kartochka esa pastga surgan odam uchun. */}
          <div className="panel panel--call">
            <h3>{flower ? 'Bugungi so‘zni toping' : 'Harflardan so‘z yig‘ing'}</h3>
            <p className="panel__note">
              {flower
                ? 'So‘ztopda yashirin so‘z oltita urinishda topiladi. Kunlik so‘z butun O‘zbekistonda bir xil.'
                : 'G‘unchada yettita harf beriladi: o‘rtadagi yurak harf har bir so‘zda qatnashadi. Topilgan so‘zning ma’nosi ham shu yerda.'}
            </p>
            <a
              className="btn btn--sm btn--ghost"
              href={flower ? links.play : links.guncha}
              data-scroll="keep"
            >
              {flower ? 'So‘ztopni ochish' : 'G‘unchani ochish'}
            </a>
          </div>

          <div className="panel panel--call">
            <h3>Ilovada ko‘proq</h3>
            <p className="panel__note">
              Yangso‘z, kategoriyalar va bildirishnomalar — bularning hammasi
              ilovada. Internetsiz ham ishlaydi.
            </p>
            <a className="btn btn--sm btn--ghost" href="/#yuklab-olish">
              Ilovani yuklab olish
            </a>
          </div>

          {/* Yon ustunning eng oxirida: taxta, klaviatura va natija
              reklamasiz qoladi. */}
          <AdBanner placement={flower ? 'guncha' : 'game'} />
        </aside>
      </div>

      {/* Sarlavha va izoh taxtadan keyin: sahifa nima ekanini
          tushuntiradi va `h1` ni ham shu yerda qoldiradi. */}
      <div className="wrap oyin__about">
        <span className="section__kicker">
          {flower ? 'G‘uncha' : `So‘ztop №${dailyNumber()}`}
        </span>
        <h1>{flower ? 'Yettita harfdan so‘z yig‘ing' : 'Bugungi so‘zni toping'}</h1>
        <p className="section__lead">
          {flower
            ? 'O‘rtadagi yurak harf har bir so‘zda qatnashadi, qolgan oltitasi xohlagancha takrorlanadi. Topilgan har bir so‘zning ma’nosi ham shu yerda — o‘ynab turib lug‘at boyitasiz.'
            : 'Kunlik so‘z butun O‘zbekistonda bir xil va ilovadagi bilan aynan bitta. Cheksiz rejimda esa 4 dan 7 harfgacha xohlagancha mashq qilasiz.'}
        </p>
      </div>
    </section>
  );
}
