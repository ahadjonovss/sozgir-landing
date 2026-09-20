/** Sayt ramkasi: tepada sarlavha, o'rtada sahifa, pastda footer.
 *
 *  Bosh sahifa — tanishtiruv: hero'da haqiqiy o'yin, so'ng qoida, alifbo,
 *  modullar va yuklab olish. Qolgan manzillar shu ramka ichida ochiladi. */
import { useEffect, useLayoutEffect } from 'react';
import { pageOf } from './data/pages';
import { guideOf } from './data/guides';
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
import UpdatesPage from './components/UpdatesPage';
import BadgesPage from './components/BadgesPage';
import BattlePage from './components/BattlePage';
import GamePage from './components/GamePage';
import GunchaBattlePage from './components/GunchaBattlePage';
import GunchaPage from './components/GunchaPage';
import MarduPage from './components/MarduPage';
import Header from './components/Header';
import Hero from './components/Hero';
import InviteOverlay from './components/InviteOverlay';
import Modules from './components/Modules';
import PlayHub from './components/PlayHub';
import PlayerPage from './components/PlayerPage';
import Privacy from './components/Privacy';
import Rules from './components/Rules';
import Support from './components/Support';
import SupportPage from './components/SupportPage';
import { AccountDialog } from './components/Account';
import { startScriptDom } from './lib/scriptDom';
import { prose, useScript } from './lib/useScript';
import { useReveal } from './lib/useReveal';
import AccountDeletion from './components/AccountDeletion';
import { useRoute } from './lib/useRoute';

export default function App() {
  useReveal();
  const route = useRoute();
  const script = useScript();
  const endless = lengthPageOf(route);
  const guide = guideOf(route);

  /* Alifbo ko'chiruvchisi birinchi chizishdan oldin yoqiladi — matn bir
     lahza lotinda "yonib" ketmasin. Sahifa sarlavhasi `<head>` da, ya'ni
     ko'chiruvchi yetmaydigan joyda: u qo'lda o'giriladi. */
  useLayoutEffect(() => startScriptDom(document.body), []);

  useEffect(() => {
    // Sarlavhalar `data/pages.ts` da — build paytida yasaladigan statik
    // HTML fayllar ham o'sha ro'yxatdan oziqlanadi.
    document.title = prose(pageOf(route)?.title ?? '');
  }, [route, script]);

  return (
    <>
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
            <Support />
            <Faq />
            <Download />
          </>
        )}
        {route === '/oynash' && <PlayHub />}
        {route === '/oyin' && <GamePage />}
        {route === '/sozjang' && <BattlePage />}
        {route === '/guncha' && <GunchaPage />}
        {route === '/gunchajang' && <GunchaBattlePage />}
        {route === '/maydon' && <MarduPage />}
        {route === '/javoblar' && <AnswersPage />}
        {/* Uzunlik bo'yicha sahifalar (`/cheksiz/6-harf`) — bittasi
            komponent, matni `data/lengths.ts` dan keladi. */}
        {endless && <EndlessPage page={endless} />}
        {route === '/qollanma' && <GuidesPage />}
        {route === '/yangiliklar' && <UpdatesPage />}
        {guide && <GuidePage guide={guide} />}
        {route === '/nishonlar' && <BadgesPage />}
        {route === '/qollab' && <SupportPage />}
        {route === '/privacy' && <Privacy />}
        {route === '/hisob-ochirish' && <AccountDeletion />}
        {route === '/contact' && <Contact />}
        {route === '/oyinchi' && <PlayerPage />}
      </main>

      <Footer />

      {/* Hisob oynasi va jang chaqiruvi qaysi sahifada bo'lsangiz ham
          ko'rinadi, shuning uchun ular ramkaning o'zida turadi. */}
      <AccountDialog />
      <InviteOverlay />
      {/* Telefonda ochilgan har qanday sahifada — ilova taklifi. Oyna
          o'zi qaror qiladi: kompyuterda umuman chizilmaydi, telefonda
          esa kuniga bir marta va sahifa ochilgandan bir necha soniya
          keyin chiqadi. */}
      <AppPopup />
    </>
  );
}
