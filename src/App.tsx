/** Sayt ramkasi: tepada sarlavha, o'rtada sahifa, pastda footer.
 *
 *  Bosh sahifa — tanishtiruv: hero'da haqiqiy o'yin, so'ng qoida, alifbo,
 *  modullar va yuklab olish. Qolgan manzillar shu ramka ichida ochiladi. */
import { useEffect, useLayoutEffect } from 'react';
import Alphabet from './components/Alphabet';
import Categories from './components/Categories';
import Contact from './components/Contact';
import Download from './components/Download';
import Faq from './components/Faq';
import Footer from './components/Footer';
import BattlePage from './components/BattlePage';
import GamePage from './components/GamePage';
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
import { useRoute } from './lib/useRoute';

const titles = {
  '/': 'So‘zgir — o‘zbekcha so‘z o‘yinlari',
  '/oynash': 'O‘ynash — So‘zgir',
  '/oyin': 'So‘zgir — bugungi so‘zni toping',
  '/sozjang': 'So‘zjang — do‘st bilan so‘z jangi | So‘zgir',
  '/qollab': 'Qo‘llab-quvvatlash — So‘zgir',
  '/privacy': 'Maxfiylik siyosati — So‘zgir',
  '/contact': 'Aloqa — So‘zgir',
  '/oyinchi': 'O‘yinchi — So‘zgir',
};

export default function App() {
  useReveal();
  const route = useRoute();
  const script = useScript();

  /* Alifbo ko'chiruvchisi birinchi chizishdan oldin yoqiladi — matn bir
     lahza lotinda "yonib" ketmasin. Sahifa sarlavhasi `<head>` da, ya'ni
     ko'chiruvchi yetmaydigan joyda: u qo'lda o'giriladi. */
  useLayoutEffect(() => startScriptDom(document.body), []);

  useEffect(() => {
    document.title = prose(titles[route]);
  }, [route, script]);

  return (
    <>
      <Header route={route} />

      <main>
        {route === '/' && (
          <>
            <Hero />
            <Rules />
            <Alphabet />
            <Modules />
            <Categories />
            <Support />
            <Faq />
            <Download />
          </>
        )}
        {route === '/oynash' && <PlayHub />}
        {route === '/oyin' && <GamePage />}
        {route === '/sozjang' && <BattlePage />}
        {route === '/qollab' && <SupportPage />}
        {route === '/privacy' && <Privacy />}
        {route === '/contact' && <Contact />}
        {route === '/oyinchi' && <PlayerPage />}
      </main>

      <Footer />

      {/* Hisob oynasi va jang chaqiruvi qaysi sahifada bo'lsangiz ham
          ko'rinadi, shuning uchun ular ramkaning o'zida turadi. */}
      <AccountDialog />
      <InviteOverlay />
    </>
  );
}
