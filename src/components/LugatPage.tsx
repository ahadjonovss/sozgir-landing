/** Lug'at — `/lugat` ro'yxati va `/lugat/{harf}` sahifasi.
 *
 *  Matn `data/lugat.ts` da, so'zlar esa lug'atning o'zidan
 *  (`lib/lugat.ts`). Build paytida shu ikkisidan statik HTML yoziladi
 *  (`vite/prerender.ts`), brauzerda esa o'sha ro'yxat qaytadan
 *  yig'iladi — ikkalasi bir manbadan, ya'ni robot ko'rgan matn odam
 *  ko'rgani bilan bir xil.
 *
 *  **Kutish paytida sahifa bo'shamaydi.** React o'rnashayotganda
 *  statik matnni o'chiradi, lug'at esa bir lahza keyin keladi. Shu
 *  oraliqda kirish matni va harflar ro'yxati o'z joyida turadi —
 *  faqat so'zlar ro'yxatining o'rnida «yuklanmoqda» satri bo'ladi.
 *  Lug'at o'yin uchun baribir keshda turadi, ya'ni ko'pchilikda bu
 *  oraliq ko'rinmaydi ham. */
import { useEffect, useState } from 'react';
import { LUGAT_INDEX, LUGAT_PAGES, type LugatLetterPage } from '../data/lugat';
import { links } from '../data/site';
import { loadDictionary } from '../lib/dictionary';
import { groupByLetter, LUGAT_LENGTHS, type LugatLetter } from '../lib/lugat';
import { pretty } from '../lib/uz';
import AdBanner from './AdBanner';
import { ChevronLeft } from './Icons';

/** To'rt uzunlikdagi lug'atni birga oladi va harflarga taqsimlaydi.
 *
 *  Yuklash aynan shu yerda, `lib/lugat.ts` da emas: u fayldan build
 *  paytida `vite/prerender.ts` ham foydalanadi va u yerda Node ichida
 *  ishlaydi. `dictionary` moduli esa o'zi bilan API mijozi va
 *  `localStorage` keshini olib keladi — ya'ni brauzerdan boshqa joyda
 *  yuklanmasligi kerak. Umumiy fayl shu sabab sof qoldirilgan:
 *  guruhlash mantig'i ikkalasiniki, yuklash esa faqat brauzerniki.
 *
 *  Yiqilgan uzunlik jim tashlab ketiladi: uchtasi kelgan bo'lsa
 *  sahifa uchtasi bilan chiziladi. Butun sahifani bitta so'rov
 *  tufayli xato ekraniga almashtirish — robot ko'rgan matnni odamdan
 *  yashirish degani. */
async function loadLugat(): Promise<LugatLetter[]> {
  const loaded = await Promise.all(
    LUGAT_LENGTHS.map((length) => loadDictionary(length).catch(() => null)),
  );
  return groupByLetter(
    loaded
      .filter((dictionary) => dictionary !== null)
      .map((dictionary) => ({ length: dictionary.length, words: dictionary.words })),
  );
}

/** Lug'at bir marta yuklanadi va ikkala sahifa ham shu natijani oladi:
 *  harfdan harfga o'tganda qayta yig'ish kerak emas. */
let cached: Promise<LugatLetter[]> | null = null;

function useLugat(): LugatLetter[] | null {
  const [letters, setLetters] = useState<LugatLetter[] | null>(null);

  useEffect(() => {
    let alive = true;
    void (cached ??= loadLugat())
      .then((list) => {
        if (alive) setLetters(list);
      })
      // Lug'at kelmasa sahifa kirish matni bilan qoladi: bo'sh ro'yxat
      // «so'z yo'q» degan yolg'ondan ko'ra tushunarliroq.
      .catch(() => {
        if (alive) setLetters([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  return letters;
}

/** Alifbo — har harf o'z sahifasiga.
 *
 *  Ro'yxat lug'at kelishini **kutmaydi**: harflar oldindan ma'lum va
 *  ularni kutib turish sahifani sababsiz bo'sh qoldirardi. */
function Alphabet({ current }: { current?: string }) {
  return (
    <ul className="lugat__abc">
      {LUGAT_PAGES.map((item) => (
        <li key={item.path}>
          <a
            href={item.path}
            className={item.letter === current ? 'is-on' : undefined}
            aria-current={item.letter === current ? 'page' : undefined}
          >
            {item.letter.toUpperCase()}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Ro'yxat — `/lugat`. */
export function LugatIndex() {
  const letters = useLugat();
  const total = letters?.reduce((sum, item) => sum + item.total, 0) ?? 0;

  return (
    <section className="oyin qollanma lugat">
      <div className="wrap qollanma__wrap">
        <header className="qollanma__head">
          <h1>{pretty(LUGAT_INDEX.h1)}</h1>
          <p className="section__lead">{pretty(LUGAT_INDEX.lead)}</p>
        </header>

        <div className="qollanma__text">
          {LUGAT_INDEX.body.map((paragraph) => (
            <p key={paragraph}>{pretty(paragraph)}</p>
          ))}
          {total > 0 && (
            <p>
              Hozir lug‘atda {total.toLocaleString('ru-RU').replace(/ /g, ' ')} ta
              so‘z ma’nosi bilan turibdi.
            </p>
          )}
        </div>

        <h2 className="qollanma__title">Harf bo‘yicha</h2>
        <Alphabet />

        <div className="qollanma__cta">
          <a className="btn btn--lg" href={links.play}>
            Bugungi so‘zni o‘ynash
          </a>
          <a className="btn btn--lg btn--outline" href={links.guides}>
            Qo‘llanma
          </a>
        </div>

        <AdBanner placement="profile" />
      </div>
    </section>
  );
}

/** Bitta harf — `/lugat/sh`. */
export default function LugatPage({ page }: { page: LugatLetterPage }) {
  const letters = useLugat();
  const found = letters?.find((item) => item.letter === page.letter);

  return (
    <section className="oyin qollanma lugat">
      <article className="wrap qollanma__wrap">
        <a className="player__back" href={links.lugat}>
          <ChevronLeft size={18} />
          Lug‘at
        </a>

        <header className="qollanma__head">
          <h1>{pretty(page.h1)}</h1>
          <p className="section__lead">{pretty(page.lead)}</p>
        </header>

        <div className="qollanma__text">
          {page.body.map((paragraph) => (
            <p key={paragraph}>{pretty(paragraph)}</p>
          ))}
        </div>

        {letters === null && <p className="lugat__wait">Lug‘at yuklanmoqda…</p>}

        {found?.groups.map((group) => (
          <section key={group.length} className="lugat__group">
            <h2 className="qollanma__title">{group.length} harfli so‘zlar</h2>
            <dl className="lugat__list">
              {group.words.map((item) => (
                <div key={item.word}>
                  <dt>{pretty(item.word)}</dt>
                  <dd>{pretty(item.meaning)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}

        {letters !== null && !found && (
          <p className="lugat__wait">
            Bu harf bilan boshlanadigan so‘z hozircha lug‘atda yo‘q.
          </p>
        )}

        <h2 className="qollanma__title">Boshqa harflar</h2>
        <Alphabet current={page.letter} />

        <div className="qollanma__cta">
          <a className="btn btn--lg" href={links.play}>
            Bugungi so‘zni o‘ynash
          </a>
        </div>

        <AdBanner placement="profile" />
      </article>
    </section>
  );
}
