import { useEffect, useState } from 'react';
import { links } from '../data/site';
import { toggleTheme } from '../lib/useReveal';
import type { Route } from '../lib/useRoute';
import Logo from './Logo';

const sections = [
  { hash: '#qoida', label: 'Qoida' },
  { hash: '#alifbo', label: 'Alifbo' },
  { hash: '#modullar', label: 'Modullar' },
  { hash: '#savollar', label: 'Savollar' },
];

export default function Header({ route }: { route: Route }) {
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark',
  );
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`header${stuck ? ' header--stuck' : ''}`}>
      <div className="wrap header__inner">
        {/* Langarlar `/` bilan boshlanadi — ichki sahifalardan ham ishlaydi. */}
        <a className="brand" href="/#top" aria-label="So‘zgir — bosh sahifa">
          <Logo height={30} />
        </a>

        <nav className="header__nav">
          {sections.map((item) => (
            <a key={item.hash} href={`/${item.hash}`}>
              {item.label}
            </a>
          ))}
          <a href={links.contact} aria-current={route === '/contact' ? 'page' : undefined}>
            Aloqa
          </a>
        </nav>

        <div className="header__actions">
          <button
            className="icon-btn"
            onClick={() => setDark(toggleTheme() === 'dark')}
            aria-label="Mavzuni almashtirish"
            title="Yorug‘ / tungi rejim"
          >
            {dark ? '☀' : '☾'}
          </button>
          <a className="btn btn--sm header__cta" href="/#yuklab-olish">
            Yuklab olish
          </a>
        </div>
      </div>
    </header>
  );
}
