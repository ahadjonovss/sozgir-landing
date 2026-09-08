/** Sayt ramkasi: tepada sarlavha, o'rtada sahifa, pastda footer.
 *
 *  Bosh sahifa — tanishtiruv: hero'da haqiqiy o'yin, so'ng qoida, alifbo,
 *  modullar va yuklab olish. Qolgan manzillar shu ramka ichida ochiladi. */
import { useEffect } from 'react';
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
import Privacy from './components/Privacy';
import Rules from './components/Rules';
import Support from './components/Support';
import { AccountDialog } from './components/Account';
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
};

export default function App() {
  useReveal();
  const route = useRoute();

  useEffect(() => {
    document.title = titles[route];
  }, [route]);

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
        {route === '/qollab' && <Support page />}
        {route === '/privacy' && <Privacy />}
        {route === '/contact' && <Contact />}
      </main>

      <Footer />

      {/* Hisob oynasi va jang chaqiruvi qaysi sahifada bo'lsangiz ham
          ko'rinadi, shuning uchun ular ramkaning o'zida turadi. */}
      <AccountDialog />
      <InviteOverlay />
    </>
  );
}
