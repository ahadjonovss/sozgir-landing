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
import { formatPlayers, useTodayPlayers } from '../lib/players';
import type { Route } from '../lib/useRoute';
import Account from './Account';
import Notifications from './Notifications';
import Logo from './Logo';
import Settings from './Settings';
import { Moon, Sun } from './Icons';

export default function Header({ route }: { route: Route }) {
  const players = useTodayPlayers();
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
          </div>
        </div>
      </div>

    </header>
  );
}
