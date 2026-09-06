/** Kompyuterdagi doimiy menyu.
 *
 *  Telefonda ilovadagi yo'l ishlaydi — bosh ekrandan ichkariga, sarlavhada
 *  orqaga tugmasi. Sichqoncha bilan ishlaydigan odam esa bo'limlarni
 *  yonma-yon ko'rishni kutadi, shuning uchun bu yerda oddiy veb menyusi
 *  turadi. Ro'yxatdagi manzillar `useRoute` biladigan sahifalar va bosh
 *  sahifadagi langarlar. */
import { useState } from 'react';
import { links } from '../data/site';
import { toggleTheme } from '../lib/useReveal';
import type { Route } from '../lib/useRoute';
import Account from './Account';
import AppMark from './AppMark';
import Logo from './Logo';
import {
  Book,
  Bulb,
  Chart,
  Download,
  Heart,
  Help,
  Home,
  Moon,
  Send,
  Sun,
  Swords,
  Trophy,
} from './Icons';

interface Item {
  href: string;
  label: string;
  icon: React.ReactNode;
  /** Shu manzilda bo'lganda ajratib ko'rsatiladi. */
  route?: Route;
}

const GROUPS: { title?: string; items: Item[] }[] = [
  {
    items: [
      { href: '/', label: 'Bosh sahifa', icon: <Home size={18} />, route: '/' },
      {
        href: links.play,
        label: 'Kunlik o‘yin',
        icon: <AppMark size={18} ink="currentColor" accent="var(--green)" />,
        route: '/oyin',
      },
      { href: links.battle, label: 'So‘zjang', icon: <Swords size={18} />, route: '/sozjang' },
    ],
  },
  {
    title: 'Ilovada',
    items: [
      { href: '/#modullar', label: 'Yangso‘z', icon: <Bulb size={18} /> },
      { href: '/#modullar', label: 'O‘rganish', icon: <Book size={18} /> },
      { href: '/#modullar', label: 'Reyting', icon: <Trophy size={18} /> },
    ],
  },
  {
    title: 'Sayt',
    items: [
      { href: '/#qoida', label: 'Qanday o‘ynaladi?', icon: <Help size={18} /> },
      { href: '/#kategoriyalar', label: 'Kategoriyalar', icon: <Chart size={18} /> },
      { href: '/#savollar', label: 'Savollar', icon: <Help size={18} /> },
      {
        href: links.donate,
        label: 'Qo‘llab-quvvatlash',
        icon: <Heart size={18} />,
        route: '/qollab',
      },
      { href: '/#yuklab-olish', label: 'Ilovani yuklab olish', icon: <Download size={18} /> },
    ],
  },
];

export default function Sidebar({ route }: { route: Route }) {
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark',
  );

  return (
    <aside className="side">
      <div className="side__top">
        <a className="side__brand" href="/#top" aria-label="So‘zgir — bosh sahifa">
          <Logo height={26} />
        </a>
        <button
          className="icon-btn"
          onClick={() => setDark(toggleTheme() === 'dark')}
          aria-label="Mavzuni almashtirish"
          title="Yorug‘ / tungi rejim"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div style={{ padding: '0 10px' }}>
        <Account />
      </div>

      <nav className="side__nav">
        {GROUPS.map((group, index) => (
          <div className="side__group" key={group.title ?? index}>
            {group.title && <div className="side__label">{group.title}</div>}
            {group.items.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`side__item${item.route && item.route === route ? ' side__item--on' : ''}`}
                aria-current={item.route === route ? 'page' : undefined}
              >
                {item.icon}
                {item.label}
              </a>
            ))}
          </div>
        ))}
      </nav>

      <a className="side__item" href={links.telegram} target="_blank" rel="noreferrer">
        <Send size={18} />
        Telegram kanal
      </a>

      <div className="side__foot">
        <a href={links.privacy}>Maxfiylik</a>
        <a href={links.contact}>Aloqa</a>
        <span>© {new Date().getFullYear()} So‘zgir</span>
      </div>
    </aside>
  );
}
