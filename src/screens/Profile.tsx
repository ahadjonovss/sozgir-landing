import { useState } from 'react';
import { links } from '../data/site';
import { loadNickname, saveNickname } from '../lib/storage';
import { toggleTheme } from '../lib/theme';
import { TileCard } from '../components/Cards';
import Screen from '../components/Screen';
import {
  Chart,
  Download,
  Heart,
  Help,
  Moon,
  Send,
  Shield,
  Sun,
  Trophy,
} from '../components/Icons';

/** Profil — ilovadagi `ProfilePage` tartibida: natijalar, yordam,
 *  ilova va hisob. Saytda hisob yo'q, shuning uchun uning o'rnida
 *  brauzerdagi taxallus va mavzu turadi. */
export default function Profile() {
  const [name, setName] = useState(() => loadNickname());
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark',
  );

  return (
    <Screen title="Profil" back="/">
      <div className="stack" style={{ paddingTop: 20 }}>
        <div className="card">
          <div className="card__title">Taxallus</div>
          <p className="prose" style={{ marginBottom: 10 }}>
            Bosh ekranda ko‘rinadi. Reytingda chiqishi uchun ilovada hisob
            ochish kerak.
          </p>
          <input
            className="tile-card"
            value={name}
            placeholder="Mehmon"
            maxLength={20}
            onChange={(event) => {
              setName(event.target.value);
              saveNickname(event.target.value);
            }}
            aria-label="Taxallus"
          />
        </div>

        <div className="section-label">Natijalar</div>
        <TileCard to="/statistika" icon={<Chart size={18} />} title="Statistika" />
        <TileCard to="/reyting" icon={<Trophy size={18} />} title="Reyting" />

        <div className="section-label">Yordam</div>
        <TileCard to="/qanday-oynaladi" icon={<Help size={18} />} title="Qanday o‘ynaladi?" />
        <TileCard to="/savollar" icon={<Help size={18} />} title="Savollar va javoblar" />

        <div className="section-label">Ilova</div>
        <TileCard
          onClick={() => setDark(toggleTheme() === 'dark')}
          icon={dark ? <Moon size={18} /> : <Sun size={18} />}
          title="Mavzu"
          subtitle={dark ? 'Tungi' : 'Yorug‘'}
        />
        <TileCard to="/yuklab-olish" icon={<Download size={18} />} title="Ilovani yuklab olish" />
        <a className="tile-card" href="/donat/">
          <span className="tile-card__icon" style={{ color: 'var(--danger)' }}>
            <Heart size={18} />
          </span>
          <span className="tile-card__text">
            <span className="tile-card__title">Qo‘llab-quvvatlash</span>
          </span>
        </a>
        <a className="tile-card" href={links.telegram} target="_blank" rel="noreferrer">
          <span className="tile-card__icon" style={{ color: 'var(--accent)' }}>
            <Send size={18} />
          </span>
          <span className="tile-card__text">
            <span className="tile-card__title">Telegram kanal</span>
          </span>
        </a>

        <div className="section-label">Hujjatlar</div>
        <a className="tile-card" href="/shartlar/">
          <span className="tile-card__icon">
            <Shield size={18} />
          </span>
          <span className="tile-card__text">
            <span className="tile-card__title">Foydalanish shartlari</span>
          </span>
        </a>
        <a className="tile-card" href="/privacy/">
          <span className="tile-card__icon">
            <Shield size={18} />
          </span>
          <span className="tile-card__text">
            <span className="tile-card__title">Maxfiylik siyosati</span>
          </span>
        </a>

        <p className="prose" style={{ fontSize: 12, textAlign: 'center', marginTop: 10 }}>
          So‘zgir · veb versiya · lug‘at v8
        </p>
      </div>
    </Screen>
  );
}
