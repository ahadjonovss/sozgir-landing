/** Sayt sarlavhasi.
 *
 *  Oddiy veb-sayt sarlavhasi: chapda logotip, o'rtada bo'limlar, o'ngda
 *  mavzu, hisob va «O'ynash». Ilgari bu yerda ilovadagidek yon menyu va
 *  AppBar turardi — foydalanuvchilar uni admin panelga o'xshatdi.
 *
 *  Telefonda bo'limlar yashirinadi va menyu tugmasi ostida to'liq
 *  ekranli ro'yxatga yig'iladi. «O'ynash» esa har doim ko'rinadi — o'yin
 *  sahifasi bir bosishda bo'lishi kerak. */
import { useEffect, useState } from 'react';
import { links } from '../data/site';
import { toggleTheme } from '../lib/useReveal';
import type { Route } from '../lib/useRoute';
import Account from './Account';
import Logo from './Logo';
import { Close, Menu, Moon, Send, Sun } from './Icons';

interface Item {
  href: string;
  label: string;
  /** Shu manzilda bo'lganda ajratib ko'rsatiladi. */
  route?: Route;
}

/* Tepada faqat asosiylari: qoida, qo'llab-quvvatlash va yuklab olish.
   O'yinlarga yo'l bitta — «O'ynash» tugmasi: u nimani o'ynashni tanlash
   sahifasini ochadi (So'ztop yoki So'zjang). Qolgan bo'limlar telefon
   menyusida va footerda. */
const NAV: Item[] = [
  { href: '/#qoida', label: 'Qoida' },
  { href: links.donate, label: 'Qo‘llab-quvvatlash', route: '/qollab' },
  { href: '/#yuklab-olish', label: 'Yuklab olish' },
];

const MORE: Item[] = [
  { href: links.play, label: 'So‘ztop', route: '/oyin' },
  { href: links.battle, label: 'So‘zjang', route: '/sozjang' },
  { href: '/#alifbo', label: 'Alifbo' },
  { href: '/#modullar', label: 'Modullar' },
  { href: '/#savollar', label: 'Savollar' },
  { href: links.contact, label: 'Aloqa', route: '/contact' },
  { href: links.privacy, label: 'Maxfiylik siyosati', route: '/privacy' },
];

export default function Header({ route }: { route: Route }) {
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark',
  );
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Menyu ochiq turganda orqadagi sahifa surilmasin; Escape yopadi.
  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = (item: Item) => (item.route && item.route === route ? 'page' : undefined);

  return (
    <header className={`header${stuck ? ' header--stuck' : ''}${open ? ' header--open' : ''}`}>
      <div className="wrap">
        <div className="header__bar">
          {/* Langarlar `/` bilan boshlanadi — ichki sahifalardan ham ishlaydi. */}
          <a className="brand" href="/#top" aria-label="So‘zgir — bosh sahifa">
            <Logo height={26} />
          </a>

          <nav className="header__nav" aria-label="Bo‘limlar">
            {NAV.map((item) => (
              <a key={item.label} href={item.href} aria-current={current(item)}>
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
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <span className="header__account">
              <Account />
            </span>
            <a
              className="btn btn--sm header__play"
              href={links.hub}
              aria-current={
                route === '/oynash' || route === '/oyin' || route === '/sozjang'
                  ? 'page'
                  : undefined
              }
            >
              O‘ynash
            </a>
            <button
              className="icon-btn header__burger"
              onClick={() => setOpen((value) => !value)}
              aria-label={open ? 'Menyuni yopish' : 'Menyu'}
              aria-expanded={open}
              aria-controls="menu"
            >
              {open ? <Close size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="menu" id="menu" onClick={() => setOpen(false)}>
          <nav className="wrap menu__inner" aria-label="Menyu" onClick={(e) => e.stopPropagation()}>
            <a className="menu__link menu__link--main" href={links.hub}>
              O‘ynash
            </a>
            {NAV.map((item) => (
              <a
                key={item.label}
                className="menu__link"
                href={item.href}
                aria-current={current(item)}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="menu__sep" />
            {MORE.map((item) => (
              <a
                key={item.label}
                className="menu__link menu__link--sub"
                href={item.href}
                aria-current={current(item)}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a
              className="menu__link menu__link--sub"
              href={links.telegram}
              target="_blank"
              rel="noreferrer"
            >
              <Send size={16} /> Telegram kanal
            </a>

            <div className="menu__foot" onClick={() => setOpen(false)}>
              <Account />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
