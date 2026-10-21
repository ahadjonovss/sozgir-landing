/** Sayt ramkasi: tepada sarlavha, o'rtada sahifa, pastda footer.
 *
 *  Bosh sahifa — tanishtiruv: hero'da haqiqiy o'yin, so'ng qoida, alifbo,
 *  modullar va yuklab olish. Qolgan manzillar shu ramka ichida ochiladi. */
import { useEffect, useLayoutEffect } from 'react';
import { pageOf } from './data/pages';
import { guideOf } from './data/guides';
import { lugatPageOf } from './data/lugat';
import { lengthPageOf } from './data/lengths';
import Alphabet from './components/Alphabet';
import Categories from './components/Categories';
import Contact from './components/Contact';
import Download from './components/Download';
import Faq from './components/Faq';
import Footer from './components/Footer';
import AnswersPage from './components/AnswersPage';
import AppPopup from './components/AppPopup';
import EndlessPage from './components/EndlessPage';
import GuidePage, { GuidesPage } from './components/GuidePage';
import LugatPage, { LugatIndex } from './components/LugatPage';
import UpdatesPage from './components/UpdatesPage';
import BadgesPage from './components/BadgesPage';
import BattlePage from './components/BattlePage';
import ChallengePage from './components/ChallengePage';
import GameHub from './components/GameHub';
import GunchaBattlePage from './components/GunchaBattlePage';
import MarduPage from './components/MarduPage';
import TurnirPage from './components/TurnirPage';
import Header from './components/Header';
import SideAds from './components/SideAds';
import { StageProvider } from './lib/stage';
import Hero from './components/Hero';
import InviteOverlay from './components/InviteOverlay';
import Modules from './components/Modules';
import PlayHub from './components/PlayHub';
import PlayerPage from './components/PlayerPage';
import ReportPage from './components/ReportPage';
import Privacy from './components/Privacy';
import Rules from './components/Rules';
import SupportPage from './components/SupportPage';
import { AccountDialog } from './components/Account';
import { startScriptDom } from './lib/scriptDom';
import { prose, useScript } from './lib/useScript';
import { useReveal } from './lib/useReveal';
import AccountDeletion from './components/AccountDeletion';
import { startMetrika, trackPage } from './lib/metrika';
import { trackVisit, watchErrors, watchLinks } from './lib/track';
import { useRoute } from './lib/useRoute';

/** O'yin ekranlari — pastdagi footer shu yerda bir qatorga tushadi.
 *
 *  Taxta va klaviaturadan keyin uchta ustun havola kelishi o'yinni
 *  ro'yxatning tepasidagi narsaga aylantirardi; bu sahifalarga odam
 *  o'ynagani keladi, o'qigani emas. Uzunlik sahifalari (`/cheksiz/…`)
 *  bu ro'yxatda yo'q: ular qidiruvdan kelgan odam uchun yozilgan va
 *  ularda to'liq footer o'z o'rnida. */
const GAME_ROUTES = new Set([
  '/oyin',
  '/sozjang',
  '/guncha',
  '/gunchajang',
  '/maydon',
  '/turnir',
  '/soztop',
]);

export default function App() {
  useReveal();
  const route = useRoute();
  const script = useScript();
  const endless = lengthPageOf(route);
  const guide = guideOf(route);
  const lugat = lugatPageOf(route);

  /* Alifbo ko'chiruvchisi birinchi chizishdan oldin yoqiladi — matn bir
     lahza lotinda "yonib" ketmasin. Sahifa sarlavhasi `<head>` da, ya'ni
     ko'chiruvchi yetmaydigan joyda: u qo'lda o'giriladi. */
  useLayoutEffect(() => startScriptDom(document.body), []);

  useEffect(() => {
    // Sarlavhalar `data/pages.ts` da — build paytida yasaladigan statik
    // HTML fayllar ham o'sha ro'yxatdan oziqlanadi.
    document.title = prose(pageOf(route)?.title ?? '');
  }, [route, script]);

  /* Tashrif hisoblagichi. Effekt sarlavhadan **keyin** turadi: Metrika
     sahifa nomini ham yuboradi va u shu yuqoridagi effektda qo'yiladi.
     `script` bog'liqliklarda yo'q — alifbo almashuvi yangi sahifa
     emas, uni sanash ko'rish chuqurligini o'ylab topilgan raqamga
     aylantirardi. */
  useEffect(() => {
    startMetrika();
    trackPage();
  }, [route]);

  /* Telegram guruhiga: tashrif va tutilmagan xatolar. Metrikadan farqi
     — u raqam to'playdi, bu esa darhol ko'rinadigan oqim. Ikkalasi
     bir-birini almashtirmaydi: xatoni ertaga hisobotdan emas, bugun
     guruhdan bilish kerak.

     Bo'g'liqliklar ro'yxati bo'sh: tashrif seans boshiga bitta
     ([trackVisit]) va kuzatuvchilar bir marta o'rnatiladi. */
  useEffect(() => {
    watchErrors();
    watchLinks();
    trackVisit();
  }, []);

  return (
    <StageProvider>
      <Header route={route} />

      <main>
        {route === '/' && (
          <>
            <Hero />
            {/* O'yin ostidagi birinchi blok — «yana nima bor»: odam
                taxtani ko'rdi, endi qolgan o'yinlarni ko'rsatamiz.
                Qoida va alifbo undan keyin: ular birinchi marta kelgan
                odamga kerak, lekin taxtaning o'zi ularsiz ham
                tushunarli. */}
            <Modules />
            <Rules />
            <Alphabet />
            <Categories />
            <Faq />
            <Download />
          </>
        )}
        {route === '/oynash' && <PlayHub />}
        {/* So'ztop va g'uncha — bitta komponent.
            Marshrut almashganda u qayta o'rnashmaydi, ya'ni belgini
            bosganda faqat markazdagi taxta o'zgaradi: yon ustun ham,
            surilish ham, ikkala o'yinning holati ham joyida qoladi
            (`GameHub`). */}
        {(route === '/oyin' || route === '/guncha') && (
          <GameHub game={route === '/guncha' ? 'guncha' : 'soztop'} />
        )}
        {route === '/sozjang' && <BattlePage />}
        {route === '/gunchajang' && <GunchaBattlePage />}
        {route === '/maydon' && <MarduPage />}
        {route === '/turnir' && <TurnirPage />}
        {route === '/javoblar' && <AnswersPage />}
        {/* Uzunlik bo'yicha sahifalar (`/cheksiz/6-harf`) — bittasi
            komponent, matni `data/lengths.ts` dan keladi. */}
        {endless && <EndlessPage page={endless} />}
        {route === '/qollanma' && <GuidesPage />}
        {/* Lug'at — `/lugat` ro'yxati va `/lugat/{harf}` sahifalari.
            Matni `data/lugat.ts` da, so'zlari lug'atning o'zidan. */}
        {route === '/lugat' && <LugatIndex />}
        {lugat && <LugatPage page={lugat} />}
        {route === '/yangiliklar' && <UpdatesPage />}
        {guide && <GuidePage guide={guide} />}
        {route === '/nishonlar' && <BadgesPage />}
        {route === '/qollab' && <SupportPage />}
        {route === '/privacy' && <Privacy />}
        {route === '/hisob-ochirish' && <AccountDeletion />}
        {route === '/contact' && <Contact />}
        {route === '/oyinchi' && <PlayerPage />}
        {/* `/shikoyat/soz/{SO'Z}` va `/shikoyat/oyinchi/{uid}` — jang
            natijasidan ochiladi, oyna emas, o'z sahifasi. */}
        {route === '/shikoyat' && <ReportPage />}
        {/* `/soztop/{KOD}` — do'sti yashirgan so'z, shu yerda o'ynaladi. */}
        {route === '/soztop' && <ChallengePage />}
      </main>

      <Footer slim={GAME_ROUTES.has(route)} />

      {/* Hisob oynasi va jang chaqiruvi qaysi sahifada bo'lsangiz ham
          ko'rinadi, shuning uchun ular ramkaning o'zida turadi. */}
      <AccountDialog />
      <InviteOverlay />
      {/* Telefonda ochilgan har qanday sahifada — ilova taklifi. Oyna
          o'zi qaror qiladi: kompyuterda umuman chizilmaydi, telefonda
          esa kuniga bir marta va sahifa ochilgandan bir necha soniya
          keyin chiqadi. */}
      <AppPopup />
      {/* Jang paytida chetlarda qoladigan bo'shliq. Ramkaning o'zida
          turadi: o'yin qaysi sahifada ochilganidan qat'i nazar bir xil
          joyda bo'lishi kerak. */}
      <SideAds />
    </StageProvider>
  );
}
