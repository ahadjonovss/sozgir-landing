/** O'yin sahifasi — `/oyin`.
 *
 *  Bosh sahifadagi taxta yangi mehmonni ushlab qolish uchun; bu sahifa
 *  esa qaytib keladiganlar uchun barqaror manzil: taxta, statistika va
 *  reyting bir joyda, tanishtiruv bloklarini aylanib o'tirmasdan.
 *
 *  Ikkisi bir xil `Play` komponentini ishlatadi va holat brauzerda bir
 *  joyda saqlanadi — hero'da boshlangan o'yin shu yerda davom etadi. */
import { useAuth } from '../lib/auth';
import { dailyNumber } from '../lib/daily';
import { useGameChoice } from '../lib/useGameChoice';
import { useSozTop } from '../lib/useSozTop';
import Leaderboard from './Leaderboard';
import Play from './Play';
import StatsPanel from './StatsPanel';

export default function GamePage() {
  const { account, openPrompt } = useAuth();
  const choice = useGameChoice();
  const game = useSozTop(choice);

  return (
    <section className="oyin">
      <div className="wrap oyin__head">
        <div>
          <span className="section__kicker">So‘ztop №{dailyNumber()}</span>
          <h1>Bugungi so‘zni toping</h1>
          <p className="section__lead">
            Kunlik so‘z butun O‘zbekistonda bir xil va ilovadagi bilan aynan
            bitta. Cheksiz rejimda esa 4 dan 7 harfgacha xohlagancha mashq
            qilasiz.
          </p>
        </div>
      </div>

      <div className="wrap oyin__grid">
        <div className="oyin__board">
          <Play choice={choice} game={game} />
        </div>

        <aside className="oyin__side">
          {!account && (
            <div className="panel panel--call">
              <h3>Natijangiz saqlanmayapti</h3>
              <p className="panel__note">
                Hozir hisobsiz o‘ynayapsiz — natija faqat shu brauzerda
                qoladi. Kirsangiz ball reytingga tushadi va boshqa
                qurilmadan ham ko‘rinadi.
              </p>
              <button className="btn btn--sm" onClick={() => openPrompt('guest')}>
                Kirish
              </button>
            </div>
          )}

          <StatsPanel choice={choice} stats={game.stats} total={game.total} />
          <Leaderboard />

          <div className="panel panel--call">
            <h3>Ilovada ko‘proq</h3>
            <p className="panel__note">
              So‘zjang, Yangso‘z, kategoriyalar va bildirishnomalar — bularning
              hammasi ilovada. Internetsiz ham ishlaydi.
            </p>
            <a className="btn btn--sm btn--ghost" href="/#yuklab-olish">
              Ilovani yuklab olish
            </a>
          </div>
        </aside>
      </div>
    </section>
  );
}
