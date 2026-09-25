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
import { useUnreadUpdates } from '../lib/updates';
import { formatPlayers, useTodayPlayers } from '../lib/players';
import type { Route } from '../lib/useRoute';
import Account from './Account';
import Notifications from './Notifications';
import Logo from './Logo';
import Settings from './Settings';
import { Close, Menu, Moon, Send, Sun } from './Icons';

interface Item {
  href: string;
  label: string;
  /** Shu manzilda bo'lganda ajratib ko'rsatiladi. */
  route?: Route;
  /** O'qilmagan yangiliklar soni shu qatorda chiqadi. */
  badge?: boolean;
}

/** Menyudagi o'yinlar — kataklar bo'lib turadi.
 *
 *  Ilgari menyu o'n yettita qatordan iborat uzun ro'yxat edi: o'yin,
 *  qo'llanma va huquqiy sahifa bir xil ko'rinishda yonma-yon turar,
 *  ro'yxat esa ekranga sig'masdi. Endi eng kerakli narsa — o'yinlar —
 *  yuzga chiqadi: emoji va nom, bosiladigan katak. Belgi saytning o'z
 *  tilidan (`data/site.ts` dagi modullar). */
const GAMES: (Item & { emoji: string })[] = [
  { href: links.play, label: 'So‘ztop', emoji: '🟩', route: '/oyin' },
  { href: links.battle, label: 'So‘zjang', emoji: '⚔️', route: '/sozjang' },
  { href: links.guncha, label: 'G‘uncha', emoji: '🌸', route: '/guncha' },
  { href: links.mardu, label: 'Mardu maydon', emoji: '👥', route: '/maydon' },
  { href: '/cheksiz/5-harf', label: 'Cheksiz', emoji: '♾️', route: '/cheksiz/5-harf' },
];

/** Ko'rib chiqiladigan sahifalar — bir qatorga yig'ilgan yorliqlar.
 *
 *  Bosh sahifaning o'z bo'limlariga (qoida, alifbo, savollar) havola
 *  yo'q: ular sahifani ochgan odamga baribir ko'rinadi va menyuni
 *  uzaytirishdan boshqa ish qilmasdi. */
const PAGES: Item[] = [
  { href: links.answers, label: 'Javoblar', route: '/javoblar' },
  { href: links.guides, label: 'Qo‘llanma', route: '/qollanma' },
  { href: links.badges, label: 'Nishonlar', route: '/nishonlar' },
  { href: links.updates, label: 'Yangiliklar', route: '/yangiliklar', badge: true },
];

/** Loyiha haqidagi qatorlar — eng pastda, kichik yozuvda. */
const ABOUT: Item[] = [
  { href: links.donate, label: 'Qo‘llab-quvvatlash', route: '/qollab' },
  { href: '/#yuklab-olish', label: 'Ilova' },
  { href: links.contact, label: 'Aloqa', route: '/contact' },
  { href: links.privacy, label: 'Maxfiylik', route: '/privacy' },
];

export default function Header({ route }: { route: Route }) {
  const unread = useUnreadUpdates();
  const players = useTodayPlayers();
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

          {/* Sarlavhaning o'rtasi: sayt nimaligi va bugungi holat. Ilgari
              bu yerda uchta havola turardi — ular endi menyuda, chunki
              menyu saytning xaritasi bo'ldi va uchta havola baribir
              bo'limlarning uchdan birini ham ko'rsatmasdi. */}
          <div className="header__title">
            <a href="/#top">So‘zgir — o‘zbekcha so‘z o‘yinlari</a>
            {players !== null && (
              <span className="header__live">
                Bugun {formatPlayers(players)} kishi o‘ynadi
              </span>
            )}
          </div>

          <div className="header__actions">
            <Settings />
            <button
              className="icon-btn"
              onClick={() => setDark(toggleTheme() === 'dark')}
              aria-label="Mavzuni almashtirish"
              title="Yorug‘ / tungi rejim"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {/* Qo'ng'iroq faqat kirgan odamda: do'stlik so'rovlari va
                jangga chaqiruvlar hisobga bog'langan. */}
            <Notifications />
            <span className="header__account">
              <Account />
            </span>
            <a
              className="btn btn--sm header__play"
              href={links.hub}
              aria-current={
                route === '/oynash' ||
                route === '/oyin' ||
                route === '/sozjang' ||
                route === '/guncha' ||
                route === '/gunchajang' ||
                route === '/maydon'
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
              {/* O'qilmagan yangiliklar — menyuning ichida, ya'ni
                  tashqarida faqat nuqta turadi. */}
              {!open && unread > 0 && <i className="header__dot" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="menu" id="menu" onClick={() => setOpen(false)}>
          {/* Menyu — sahifani to'liq egallagan ro'yxat emas, bitta
              kartochka: o'yinlar kataklarda, qolgani ikki qator
              yorliqda. Shunda u ekranga sig'adi va nimadan boshlash
              kerakligi bir qarashda ko'rinadi. */}
          <nav className="menu__card" aria-label="Menyu" onClick={(e) => e.stopPropagation()}>
            <a className="menu__link menu__link--main" href={links.hub}>
              O‘ynash
            </a>

            <div className="menu__games">
              {GAMES.map((game) => (
                <a
                  key={game.label}
                  className="menu__game"
                  href={game.href}
                  aria-current={current(game)}
                  onClick={() => setOpen(false)}
                >
                  <span aria-hidden="true">{game.emoji}</span>
                  {game.label}
                </a>
              ))}
            </div>

            <div className="menu__chips">
              {PAGES.map((item) => (
                <a
                  key={item.label}
                  className="menu__chip"
                  href={item.href}
                  aria-current={current(item)}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                  {item.badge && unread > 0 && (
                    <span className="menu__badge">{unread}</span>
                  )}
                </a>
              ))}
            </div>

            <div className="menu__about">
              {ABOUT.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  aria-current={current(item)}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <a href={links.telegram} target="_blank" rel="noreferrer">
                <Send size={13} /> Telegram
              </a>
            </div>

            <div className="menu__foot" onClick={() => setOpen(false)}>
              <Account />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
