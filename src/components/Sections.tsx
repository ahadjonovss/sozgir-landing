import { useEffect, useState, type ReactNode } from 'react';
import { appFeatures, faq, links, modules, stats } from '../data/site';
import { loadCategories, type Category } from '../lib/dictionary';
import { display, split } from '../lib/uz';
import { Link } from './Screen';
import AppMark from './AppMark';

/** Saytning tanishtiruv bo'limlari.
 *
 *  Bir xil bo'limlar ikki joyda ishlatiladi: kompyuterdagi bosh sahifada
 *  (uzun tanishtiruv sahifasi) va telefondagi bosh ekranning pastida
 *  (ilova kartochkalaridan keyin). Shuning uchun ular alohida — ikki
 *  marta yozilmasin. */

export function SectionHead({
  title,
  lead,
  id,
}: {
  title: string;
  lead?: string;
  id?: string;
}) {
  return (
    <div className="sec__head" id={id}>
      <h2 className="sec__title">{title}</h2>
      {lead && <p className="sec__lead">{lead}</p>}
    </div>
  );
}

export function Section({
  title,
  lead,
  id,
  children,
}: {
  title: string;
  lead?: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section className="sec">
      <SectionHead title={title} lead={lead} id={id} />
      {children}
    </section>
  );
}

/** Lug'at raqamlari — saytning «nima bor» degan savolga qisqa javobi. */
export function StatsRow() {
  return (
    <ul className="stats">
      {stats.map((item) => (
        <li key={item.label}>
          <strong>{item.value}</strong>
          <span>{item.label}</span>
          <small>{item.hint}</small>
        </li>
      ))}
    </ul>
  );
}

/** Modullar: har biri nima qilishi bilan. Saytda o'ynaladiganlari
 *  ochiladi, qolganlari ilovaga olib boradi — bu ochiq yozilgan. */
export function ModulesSection() {
  return (
    <Section
      id="modullar"
      title="Modullar"
      lead="So‘zgir — bitta o‘yin emas, so‘z ustida ishlaydigan bir nechta bo‘lim."
    >
      <div className="mods">
        {modules.map((module) => {
          const external = module.to.startsWith('/donat');
          const inner = (
            <>
              <div className="mods__top">
                <span className="mods__name">{module.name}</span>
                {module.badge && <span className="module__badge">{module.badge}</span>}
                <span className="mods__where">
                  {module.onWeb ? 'Saytda ham' : 'Ilovada'}
                </span>
              </div>
              <p className="mods__tagline">{module.tagline}</p>
              <ul className="bullets">
                {module.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </>
          );

          return external ? (
            <a
              key={module.id}
              className="card card--tone mods__card"
              style={{ ['--tone' as string]: module.tone }}
              href={module.to}
            >
              {inner}
            </a>
          ) : (
            <Link
              key={module.id}
              className="card card--tone mods__card"
              style={{ ['--tone' as string]: module.tone }}
              to={module.to}
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </Section>
  );
}

/** Kategoriyalar — sanoqlar lug'at faylidan olinadi, ya'ni har doim rost. */
export function CategoriesSection({ length = 5 }: { length?: number }) {
  const [items, setItems] = useState<Category[]>([]);

  useEffect(() => {
    loadCategories().then(setItems).catch(() => setItems([]));
  }, []);

  if (items.length === 0) return null;

  return (
    <Section
      id="kategoriyalar"
      title="Kategoriyalar"
      lead="Mavzu tanlab o‘ynash mumkin — yoki yordam so‘rasangiz, yashirin so‘zning mavzusi ochiladi."
    >
      <div className="chips">
        {items.map((category) => (
          <Link
            key={category.id}
            to={`/kategoriya/${length}/${category.id}`}
            className="chip"
          >
            <span aria-hidden="true">{category.emoji}</span>
            {category.name}
            <b>{category.counts[String(length)] ?? 0}</b>
          </Link>
        ))}
      </div>
    </Section>
  );
}

const LEGEND = [
  { tone: 'var(--green)', title: 'Yashil', text: 'Harf bor va o‘z joyida' },
  { tone: 'var(--yellow)', title: 'Sariq', text: 'Harf bor, lekin boshqa joyda' },
  { tone: 'var(--grey)', title: 'Kulrang', text: 'Bu harf so‘zda yo‘q' },
];

const EXAMPLE: { unit: string; state: 'correct' | 'present' | 'absent' }[] = [
  { unit: 'b', state: 'absent' },
  { unit: 'o', state: 'present' },
  { unit: 'sh', state: 'correct' },
  { unit: 'q', state: 'absent' },
  { unit: 'a', state: 'present' },
];

/** Qoida va alifbo — saytning eng ko'p tushuntiradigan joyi. */
export function RulesSection() {
  const [word, setWord] = useState('boshqa');
  const units = split(word || 'boshqa');

  return (
    <Section
      id="qoida"
      title="Qanday o‘ynaladi?"
      lead="So‘z uzunligi 4 dan 7 harfgacha, urinishlar soni uzunlikdan bitta ko‘p."
    >
      <div className="two-col">
        <div className="card">
          <div className="card__title">Ranglar nima deydi</div>
          <div className="board" style={{ padding: '14px 0' }}>
            <div className="board__row" style={{ ['--cols' as string]: 5 }}>
              {EXAMPLE.map((cell, i) => (
                <div key={i} className={`tile tile--${cell.state}`}>
                  {display(cell.unit)}
                </div>
              ))}
            </div>
          </div>
          <ul className="bullets">
            {LEGEND.map((item) => (
              <li key={item.title} style={{ ['--tone' as string]: item.tone }}>
                <span>
                  <strong>{item.title}</strong> — {item.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card card--tone" style={{ ['--tone' as string]: 'var(--green)' }}>
          <div className="card__title">SH, CH, O‘ va G‘ — bitta harf</div>
          <p className="prose">
            Bular o‘zbek tilida bitta tovush, shuning uchun o‘yinda ham
            bitta katakcha va klaviaturada bitta tugma. So‘z yozib
            ko‘ring — qanday bo‘linishini ko‘rasiz.
          </p>
          <input
            className="tile-card"
            style={{ marginTop: 12 }}
            value={word}
            maxLength={14}
            onChange={(event) => setWord(event.target.value)}
            aria-label="So‘z"
            placeholder="boshqa"
          />
          <div className="board" style={{ padding: '14px 0 4px' }}>
            <div
              className="board__row"
              style={{ ['--cols' as string]: Math.max(units.length, 1) }}
            >
              {units.map((unit, i) => (
                <div key={i} className="tile tile--filled">
                  {display(unit)}
                </div>
              ))}
            </div>
          </div>
          <p className="prose" style={{ fontSize: 13 }}>
            {units.length} ta harf — {word.length} ta belgi emas.
          </p>
        </div>
      </div>
    </Section>
  );
}

export function FaqSection({ limit }: { limit?: number }) {
  const items = limit ? faq.slice(0, limit) : faq;

  return (
    <Section id="savollar" title="Savollar">
      <div className="faq">
        {items.map((item) => (
          <details key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
      {limit && limit < faq.length && (
        <Link to="/savollar" className="btn btn--soft" style={{ marginTop: 14 }}>
          Barcha savollar
        </Link>
      )}
    </Section>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
      <path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.9-3-.8c-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.9 2.2 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.2.9-1.2 1.3-2.5 1.3-2.5s-2.5-1-2.5-3.6zM14.2 5.8c.6-.8 1.1-1.9 1-3-1 0-2.1.6-2.8 1.5-.6.7-1.1 1.9-1 3 1.1.1 2.2-.6 2.8-1.5z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
      <path d="M3.6 2.3c-.3.3-.5.8-.5 1.4v16.6c0 .6.2 1.1.5 1.4l.1.1 9.3-9.3v-.2L3.6 2.3zM16.3 15.6l-3.1-3.1v-.2l3.1-3.1.1.1 3.7 2.1c1 .6 1 1.6 0 2.2l-3.8 2zM15.9 16l-3.2-3.2-9.1 9.1c.3.4.9.4 1.6.1l10.7-6M15.9 8l-10.7-6c-.7-.4-1.3-.3-1.6.1l9.1 9.1L15.9 8z" />
    </svg>
  );
}

export function StoreButtons() {
  const items = [
    { href: links.appStore, icon: <AppleIcon />, small: 'App Store‘dan', big: 'Yuklab olish' },
    { href: links.playStore, icon: <PlayIcon />, small: 'Google Play‘dan', big: 'O‘rnatish' },
  ];

  return (
    <div className="stores">
      {items.map((item) => (
        <a
          key={item.big}
          className={`store${item.href ? '' : ' store--soon'}`}
          href={item.href || undefined}
          target={item.href ? '_blank' : undefined}
          rel="noreferrer"
          aria-disabled={!item.href}
        >
          {item.icon}
          <span>
            <small>{item.href ? item.small : 'Tez orada'}</small>
            <b>{item.big}</b>
          </span>
        </a>
      ))}
    </div>
  );
}

/** Yuklab olish — saytning asosiy maqsadlaridan biri. */
export function DownloadSection() {
  return (
    <Section
      id="yuklab-olish"
      title="Ilovani yuklab olish"
      lead="Bepul, reklamasiz, internetsiz ham ishlaydi. iOS 15+ va Android 6.0+ qurilmalarda."
    >
      <div className="two-col">
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <AppMark size={44} ink="var(--text)" />
          <div>
            <div className="card__title">So‘zgir — o‘zbekcha so‘z o‘yinlari</div>
            <p className="prose">
              Sayt bugungi so‘zni beradi; ilova esa qolgan hamma narsani:
              jang, reyting, eslatma va hisob.
            </p>
          </div>
          <StoreButtons />
        </div>

        <div className="card">
          <div className="card__title">Ilovada qo‘shimcha nima bor</div>
          <ul className="bullets">
            {appFeatures.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
          <p className="prose" style={{ marginTop: 12, fontSize: 13 }}>
            Chiqish haqida birinchi bo‘lib bilmoqchimisiz?{' '}
            <a href={links.telegram} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>
              Telegram kanalimizga obuna bo‘ling
            </a>
            .
          </p>
        </div>
      </div>
    </Section>
  );
}
