import Alphabet from './components/Alphabet';
import Categories from './components/Categories';
import Download from './components/Download';
import Faq from './components/Faq';
import Footer from './components/Footer';
import Header from './components/Header';
import Hero from './components/Hero';
import Modules from './components/Modules';
import Rules from './components/Rules';
import { useReveal } from './lib/useReveal';

export default function App() {
  useReveal();

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Rules />
        <Alphabet />
        <Modules />
        <Categories />
        <Faq />
        <Download />
      </main>
      <Footer />
    </>
  );
}
