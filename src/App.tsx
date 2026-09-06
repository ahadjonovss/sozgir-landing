import { useEffect } from 'react';
import { segmentsOf, useRoute } from './lib/router';
import { useMediaQuery } from './lib/useMediaQuery';
import { isBattleCode, isUid } from './lib/deeplink';
import { DAILY_LENGTH } from './lib/game';
import Sidebar from './components/Sidebar';
import Home from './screens/Home';
import Landing from './screens/Landing';
import Soztop from './screens/Soztop';
import GameScreen from './screens/GameScreen';
import Categories, { CategoryGame } from './screens/Categories';
import Battle from './screens/Battle';
import Coinage from './screens/Coinage';
import Learning from './screens/Learning';
import Rating from './screens/Rating';
import Stats from './screens/Stats';
import Profile from './screens/Profile';
import PublicProfile from './screens/PublicProfile';
import HelpScreen from './screens/Help';
import Faq from './screens/Faq';
import DownloadScreen from './screens/DownloadScreen';
import NotFound from './screens/NotFound';

/** Uzunlik manzildan olinadi; noto'g'ri qiymat kunlik uzunlikka tushadi. */
const lengthOf = (raw?: string) => {
  const value = Number(raw);
  return value >= 4 && value <= 7 ? value : DAILY_LENGTH;
};

/** Bosh sahifa ikki xil: telefonda ilovaning bosh ekrani, kompyuterda
 *  tanishtiruv sahifasi. Qolgan ekranlar ikkalasida bir xil (faqat
 *  joylashuvi CSS bilan o'zgaradi). */
function HomeView() {
  const wide = useMediaQuery('(min-width: 900px)');
  return wide ? <Landing /> : <Home />;
}

/** Manzil → ekran. Ro'yxat ilovadagi `DeepLink` va `_routeForLink` bilan
 *  bir xil qoidaga tayanadi: `/kunlik`, `/jang/<KOD>`, `/u/<uid>`. */
function screenFor(path: string) {
  const [head, second, third] = segmentsOf(path);

  switch (head) {
    case undefined:
      return <HomeView />;
    case 'kunlik':
      return <GameScreen mode="daily" length={DAILY_LENGTH} />;
    case 'soztop':
      return <Soztop />;
    case 'cheksiz':
      return <GameScreen mode="endless" length={lengthOf(second)} />;
    case 'kategoriya':
      return third ? (
        <CategoryGame length={lengthOf(second)} id={third} />
      ) : (
        <Categories length={lengthOf(second)} />
      );
    case 'jang':
      return second ? (
        isBattleCode(second) ? <Battle code={second.toUpperCase()} /> : <NotFound />
      ) : (
        <Battle />
      );
    case 'u':
      return second && isUid(second) ? <PublicProfile uid={second} /> : <NotFound />;
    case 'yangsoz':
      return <Coinage />;
    case 'organish':
      return <Learning />;
    case 'reyting':
      return <Rating />;
    case 'statistika':
      return <Stats />;
    case 'profil':
      return <Profile />;
    case 'qanday-oynaladi':
      return <HelpScreen />;
    case 'savollar':
      return <Faq />;
    case 'yuklab-olish':
      return <DownloadScreen />;
    // Ilovani ochadigan havola (`/ilova`). Telefonda ilova bo'lsa tizim
    // uni o'zi ochadi va bu yergacha yetmaydi; bo'lmasa — yuklab olish.
    case 'ilova':
      return <DownloadScreen />;
    default:
      return <NotFound />;
  }
}

export default function App() {
  const path = useRoute();

  // Yangi ekran har doim boshidan ko'rinadi.
  useEffect(() => {
    scrollTo({ top: 0 });
  }, [path]);

  return (
    <div className="app">
      <Sidebar />
      <main className="screen">{screenFor(path)}</main>
    </div>
  );
}
