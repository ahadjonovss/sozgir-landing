import { useEffect, useState } from 'react';
import { toggleTheme } from '../lib/useReveal';
import Logo from './Logo';

const nav = [
  { href: '#qoida', label: 'Qoida' },
  { href: '#alifbo', label: 'Alifbo' },
  { href: '#modullar', label: 'Modullar' },
  { href: '#savollar', label: 'Savollar' },
];

export default function Header() {
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
        <a className="brand" href="#top" aria-label="So‘zgir — bosh sahifa">
          <Logo height={30} />
        </a>

        <nav className="header__nav">
          {nav.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
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
          <a className="btn btn--sm header__cta" href="#yuklab-olish">
            Yuklab olish
          </a>
        </div>
      </div>
    </header>
  );
}
