import { useEffect } from 'react';
import Alphabet from './components/Alphabet';
import Categories from './components/Categories';
import Contact from './components/Contact';
import Download from './components/Download';
import Faq from './components/Faq';
import Footer from './components/Footer';
import Header from './components/Header';
import Hero from './components/Hero';
import Modules from './components/Modules';
import Privacy from './components/Privacy';
import Rules from './components/Rules';
import { useReveal } from './lib/useReveal';
import { useRoute } from './lib/useRoute';

const titles = {
  '/': 'So‘zgir — o‘zbekcha so‘z o‘yinlari',
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
            <Faq />
            <Download />
          </>
        )}
        {route === '/privacy' && <Privacy />}
        {route === '/contact' && <Contact />}
      </main>
      <Footer />
    </>
  );
}
