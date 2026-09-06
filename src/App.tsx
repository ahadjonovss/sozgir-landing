/** Sayt ramkasi.
 *
 *  Ko'rinish ilovanikiga o'xshaydi: telefonda bitta ustun va sarlavhada
 *  orqaga tugmasi, kompyuterda chapda doimiy menyu. Sahifalarning o'zi
 *  o'zgarmagan — o'yin, So'zjang, qo'llab-quvvatlash va hujjatlar shu
 *  ramka ichida ochiladi.
 *
 *  Bosh sahifa ikki qismdan iborat: tepada ilovaning bosh ekrani
 *  (kunlik kartochka va modullar), ostida esa saytning tanishtiruv
 *  bloklari — birinchi marta kirgan odam uchun. */
import { useEffect } from 'react';
import Alphabet from './components/Alphabet';
import AppBar from './components/AppBar';
import Categories from './components/Categories';
import Contact from './components/Contact';
import Download from './components/Download';
import Faq from './components/Faq';
import Footer from './components/Footer';
import BattlePage from './components/BattlePage';
import GamePage from './components/GamePage';
import Hero from './components/Hero';
import HomeApp from './components/HomeApp';
import InviteOverlay from './components/InviteOverlay';
import Modules from './components/Modules';
import Privacy from './components/Privacy';
import Rules from './components/Rules';
import Sidebar from './components/Sidebar';
import Support from './components/Support';
import { AccountDialog } from './components/Account';
import { dailyNumber } from './lib/daily';
import { useReveal } from './lib/useReveal';
import { useRoute } from './lib/useRoute';

const titles = {
  '/': 'So‘zgir — o‘zbekcha so‘z o‘yinlari',
  '/oyin': 'So‘zgir — bugungi so‘zni toping',
  '/sozjang': 'So‘zjang — do‘st bilan so‘z jangi | So‘zgir',
  '/qollab': 'Qo‘llab-quvvatlash — So‘zgir',
  '/privacy': 'Maxfiylik siyosati — So‘zgir',
  '/contact': 'Aloqa — So‘zgir',
};

export default function App() {
  useReveal();
  const route = useRoute();

  useEffect(() => {
    document.title = titles[route];
  }, [route]);

  return (
    <div className="app">
      <Sidebar route={route} />

      <div className="screen">
        {route === '/' && (
          <>
            <HomeApp />
            <div className="about">
              <Hero compact />
              <Rules />
              <Alphabet />
              <Modules />
              <Categories />
              <Support />
              <Faq />
              <Download />
            </div>
          </>
        )}

        {route === '/oyin' && (
          <>
            <AppBar title="So‘ztop" subtitle={`№${dailyNumber()} · O‘zbekcha`} />
            <GamePage />
          </>
        )}

        {route === '/sozjang' && (
          <>
            <AppBar title="So‘zjang" subtitle="Do‘st bilan bellashing" />
            <BattlePage />
          </>
        )}

        {route === '/qollab' && (
          <>
            <AppBar title="Qo‘llab-quvvatlash" subtitle="Loyihaga hissa qo‘shish" />
            <Support page />
          </>
        )}

        {route === '/privacy' && (
          <>
            <AppBar />
            <Privacy />
          </>
        )}

        {route === '/contact' && (
          <>
            <AppBar />
            <Contact />
          </>
        )}

        <Footer />
      </div>

      {/* Hisob oynasi va jang chaqiruvi qaysi sahifada bo'lsangiz ham
          ko'rinadi, shuning uchun ular ramkaning o'zida turadi. */}
      <AccountDialog />
      <InviteOverlay />
    </div>
  );
}
