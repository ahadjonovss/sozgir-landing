import { useState } from 'react';
import { useRoute } from '../lib/router';
import { toggleTheme } from '../lib/theme';
import { links } from '../data/site';
import Logo from './Logo';
import { Link } from './Screen';
import {
  Book,
  Bulb,
  Chart,
  Download,
  Heart,
  Help,
  Home as HomeIcon,
  Moon,
  Person,
  Sun,
  Swords,
  Trophy,
} from './Icons';
import AppMark from './AppMark';

/** Kompyuterdagi doimiy menyu.
 *
 *  Telefonda ilovadagi kabi «bosh ekran → ichkariga» yo'li ishlaydi
 *  (sarlavhada orqaga tugmasi). Kattaroq ekranda esa bunday yo'l noqulay:
 *  sichqoncha bilan ishlaydigan odam bo'limlarni yonma-yon ko'rishni
 *  kutadi — shuning uchun bu yerda oddiy veb menyusi turadi. */

const SECTIONS: { title?: string; items: { to: string; label: string; icon: React.ReactNode }[] }[] = [
  {
    items: [
      { to: '/', label: 'Bosh sahifa', icon: <HomeIcon size={18} /> },
      { to: '/kunlik', label: 'Kunlik o‘yin', icon: <AppMark size={18} ink="currentColor" accent="var(--green)" /> },
    ],
  },
  {
    title: 'Modullar',
    items: [
      { to: '/soztop', label: 'So‘ztop', icon: <Chart size={18} /> },
      { to: '/jang', label: 'So‘zjang', icon: <Swords size={18} /> },
      { to: '/yangsoz', label: 'Yangso‘z', icon: <Bulb size={18} /> },
      { to: '/organish', label: 'O‘rganish', icon: <Book size={18} /> },
    ],
  },
  {
    title: 'Natijalar',
    items: [
      { to: '/reyting', label: 'Reyting', icon: <Trophy size={18} /> },
      { to: '/statistika', label: 'Statistika', icon: <Chart size={18} /> },
      { to: '/profil', label: 'Profil', icon: <Person size={18} /> },
    ],
  },
  {
    title: 'Ma’lumot',
    items: [
      { to: '/qanday-oynaladi', label: 'Qanday o‘ynaladi?', icon: <Help size={18} /> },
      { to: '/savollar', label: 'Savollar', icon: <Help size={18} /> },
      { to: '/yuklab-olish', label: 'Ilovani yuklab olish', icon: <Download size={18} /> },
    ],
  },
];

export default function Sidebar() {
  const path = useRoute();
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark',
  );

  return (
    <aside className="side">
      <div className="side__top">
        <Link to="/" aria-label="So‘zgir — bosh sahifa" className="side__brand">
          <Logo height={26} />
        </Link>
        <button
          className="icon-btn"
          onClick={() => setDark(toggleTheme() === 'dark')}
          aria-label="Mavzuni almashtirish"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <nav className="side__nav">
        {SECTIONS.map((section, index) => (
          <div key={section.title ?? index} className="side__group">
            {section.title && <div className="side__label">{section.title}</div>}
            {section.items.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`side__item${path === item.to ? ' side__item--on' : ''}`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <a className="side__item" href="/donat/">
        <Heart size={18} />
        Qo‘llab-quvvatlash
      </a>

      <div className="side__foot">
        <a href="/shartlar/">Shartlar</a>
        <a href="/privacy/">Maxfiylik</a>
        <a href={links.telegram} target="_blank" rel="noreferrer">
          Telegram
        </a>
      </div>
    </aside>
  );
}
