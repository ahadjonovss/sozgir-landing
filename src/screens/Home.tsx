import { useEffect, useState } from 'react';
import { DAILY_LENGTH, dailyNumberFor } from '../lib/game';
import { dailyStatus, foundCount, loadNickname, totalScore } from '../lib/storage';
import AppMark from '../components/AppMark';
import { DailyCard, ModuleCard } from '../components/Cards';
import Foot from '../components/Foot';
import { Book, Bulb, ChevronRight, Download, Heart, Person, Swords } from '../components/Icons';
import { Link } from '../components/Screen';
import {
  CategoriesSection,
  DownloadSection,
  FaqSection,
  ModulesSection,
  RulesSection,
  Section,
  StatsRow,
} from '../components/Sections';

/** Bosh ekran — ilovadagi `HomePage` ning tartibi: sarlavha, kunlik
 *  o'yin, modullar to'ri va qo'llab-quvvatlash.
 *
 *  Telefonda bloklar ketma-ket tushadi (ilovadagidek), kattaroq ekranda
 *  esa `grid-template-areas` ularni ikki ustunga yoyadi — mazmun bir xil,
 *  faqat joylashuvi boshqacha. */
export default function Home() {
  const number = dailyNumberFor();
  const [status, setStatus] = useState(() => dailyStatus(number, DAILY_LENGTH));
  const [score, setScore] = useState(() => totalScore());
  const [found, setFound] = useState(() => foundCount());
  const name = loadNickname() || 'Mehmon';

  useEffect(() => {
    document.title = 'So‘zgir — o‘zbekcha so‘z o‘yinlari';
    // Boshqa ekrandan qaytilganda kunlik natija yangilanadi.
    const refresh = () => {
      setStatus(dailyStatus(number, DAILY_LENGTH));
      setScore(totalScore());
      setFound(foundCount());
    };
    refresh();
    addEventListener('focus', refresh);
    return () => removeEventListener('focus', refresh);
  }, [number]);

  return (
    <div className="home">
      <div className="home-head fade-in">
        <div style={{ flex: 1 }}>
          <div className="home-head__name">
            <AppMark size={26} ink="var(--text)" />
            {name}
          </div>
          <Link to="/reyting" className="home-head__metrics">
            <span style={{ color: 'var(--yellow)' }}>★</span>
            <b>{score}</b> ball · <b>{found}</b> so‘z
            <ChevronRight size={14} />
          </Link>
        </div>
        <Link to="/profil" className="avatar" aria-label="Profil">
          <Person size={22} />
        </Link>
      </div>

      <div className="home-daily fade-in" style={{ ['--delay' as string]: '0.07s' }}>
        <DailyCard number={number} length={DAILY_LENGTH} status={status} to="/kunlik" />
      </div>

      <div className="home-modules fade-in" style={{ ['--delay' as string]: '0.11s' }}>
        <div className="grid">
          <ModuleCard
            to="/soztop"
            tone="var(--green)"
            icon={<AppMark size={22} ink="var(--green)" accent="var(--green)" />}
            title="So‘ztop"
            subtitle="Yashirin so‘zni toping"
          />
          <ModuleCard
            to="/jang"
            tone="var(--accent)"
            icon={<Swords size={22} />}
            title="So‘zjang"
            subtitle="Do‘st bilan bellashing"
            badge="Jonli"
          />
          <ModuleCard
            to="/yangsoz"
            tone="var(--yellow)"
            icon={<Bulb size={22} />}
            title="Yangso‘z"
            subtitle="Yangi so‘z o‘ylab toping"
            badge="Haftalik"
          />
          <ModuleCard
            to="/organish"
            tone="var(--violet)"
            icon={<Book size={22} />}
            title="O‘rganish"
            subtitle="So‘z boyligingizni oshiring"
          />
        </div>
      </div>

      <div className="home-aside fade-in" style={{ ['--delay' as string]: '0.19s' }}>
        <a className="tile-card" href="/donat/">
          <span className="tile-card__icon" style={{ color: 'var(--danger)' }}>
            <Heart size={18} />
          </span>
          <span className="tile-card__text">
            <span className="tile-card__title">Qo‘llab-quvvatlash</span>
            <span className="tile-card__sub">Reklama yo‘q, xarid yo‘q</span>
          </span>
          <span className="tile-card__badge">Hissa</span>
        </a>

        <Link to="/yuklab-olish" className="tile-card">
          <span className="tile-card__icon" style={{ color: 'var(--accent)' }}>
            <Download size={18} />
          </span>
          <span className="tile-card__text">
            <span className="tile-card__title">Ilovani yuklab olish</span>
            <span className="tile-card__sub">Jang, reyting va bildirishnomalar</span>
          </span>
        </Link>
      </div>

      {/* Saytning tanishtiruv qismi — ilova kartochkalaridan keyin.
          Birinchi marta kirgan odam nima ekanini shu yerdan biladi. */}
      <div className="about">
        <Section
          title="So‘zgir nima?"
          lead="O‘zbek tilidagi so‘z o‘yinlari platformasi. Bugungi so‘z hamma uchun bir xil — saytda ham, ilovada ham."
        >
          <StatsRow />
        </Section>
        <ModulesSection />
        <RulesSection />
        <CategoriesSection />
        <FaqSection limit={4} />
        <DownloadSection />
      </div>

      <Foot />
    </div>
  );
}
