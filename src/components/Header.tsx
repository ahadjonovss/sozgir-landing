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

/** Menyu — saytning xaritasi.
 *
 *  Bo'limlar ko'paygani sari tekis ro'yxat o'qilmay qoldi: o'yin,
 *  qo'llanma va huquqiy sahifa bir xil ko'rinishda yonma-yon turardi.
 *  Endi ular guruhlangan va guruh nomi savolga javob beradi: «nima
 *  o'ynayman», «nimani o'qiyman», «o'zim haqimda nima bor».
 *
 *  Menyu endi kompyuterda ham ochiladi: sarlavhadagi uchta havola
 *  hamma bo'limni ko'rsatolmaydi va ko'rsatishi ham shart emas. */
const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'O‘yinlar',
    items: [
      { href: links.play, label: 'So‘ztop — kunlik so‘z', route: '/oyin' },
      { href: links.battle, label: 'So‘zjang', route: '/sozjang' },
      { href: links.guncha, label: 'G‘uncha', route: '/guncha' },
      { href: links.mardu, label: 'Mardu maydon', route: '/maydon' },
      { href: '/cheksiz/5-harf', label: 'Cheksiz rejim', route: '/cheksiz/5-harf' },
    ],
  },
  {
    title: 'Ko‘rib chiqish',
    items: [
      { href: links.answers, label: 'Javoblar arxivi', route: '/javoblar' },
      { href: links.guides, label: 'Qo‘llanma', route: '/qollanma' },
      { href: links.badges, label: 'Nishonlar', route: '/nishonlar' },
      { href: links.updates, label: 'Yangiliklar', route: '/yangiliklar', badge: true },
      { href: '/#qoida', label: 'Qoida' },
      { href: '/#alifbo', label: 'Alifbo' },
      { href: '/#savollar', label: 'Savollar' },
    ],
  },
  {
    title: 'Loyiha',
    items: [
      { href: links.donate, label: 'Qo‘llab-quvvatlash', route: '/qollab' },
      { href: '/#yuklab-olish', label: 'Ilovani yuklab olish' },
      { href: links.contact, label: 'Aloqa', route: '/contact' },
      { href: links.privacy, label: 'Maxfiylik siyosati', route: '/privacy' },
    ],
  },
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
          <nav className="wrap menu__inner" aria-label="Menyu" onClick={(e) => e.stopPropagation()}>
            <a className="menu__link menu__link--main" href={links.hub}>
              O‘ynash
            </a>
            {GROUPS.map((group) => (
              <div className="menu__group" key={group.title}>
                <p className="menu__title">{group.title}</p>
                {group.items.map((item) => (
                  <a
                    key={item.label}
                    className="menu__link menu__link--sub"
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
