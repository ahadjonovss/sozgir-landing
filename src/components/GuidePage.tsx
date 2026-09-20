/** Qo'llanmalar — `/qollanma` ro'yxati va maqolaning o'zi.
 *
 *  Matn `data/guides.ts` da: uni sahifa ham, build paytida yasaladigan
 *  statik HTML ham o'qiydi, ya'ni qidiruv roboti ko'radigan matn odam
 *  ko'radigani bilan aynan bir xil bo'ladi.
 *
 *  Maqolada qalin joylar `**shunday**` yozilgan — matn ma'lumot
 *  faylida turadi, ya'ni unda JSX bo'lishi mumkin emas. Shu sabab
 *  bitta oddiy ajratuvchi: yulduzchalar orasidagi bo'lak qalin
 *  chiqadi, qolgani o'z holicha qoladi. */
import { GUIDES, type Guide } from '../data/guides';
import { links } from '../data/site';
import { pretty } from '../lib/uz';
import AdBanner from './AdBanner';
import { ChevronLeft } from './Icons';

/** `**qalin**` bo'laklarini ajratadi. */
function Rich({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? <strong key={index}>{pretty(part)}</strong> : pretty(part),
      )}
    </>
  );
}

/** Ro'yxat — `/qollanma`. */
export function GuidesPage() {
  return (
    <section className="oyin qollanma">
      <div className="wrap qollanma__wrap">
        <header className="qollanma__head">
          <h1>So‘ztop qo‘llanmasi</h1>
          <p className="section__lead">
            Qanday boshlash, urinishni qanday tejash va o‘zbek alifbosining
            qaysi joyi chalg‘itadi — hammasi o‘yinning o‘z lug‘atidan olingan
            sonlar bilan.
          </p>
        </header>

        <ul className="qollanma__list">
          {GUIDES.map((guide) => (
            <li key={guide.path}>
              <a href={guide.path}>
                <strong>{pretty(guide.h1)}</strong>
                <span>{pretty(guide.tagline)}</span>
              </a>
            </li>
          ))}
        </ul>

        <div className="qollanma__cta">
          <a className="btn btn--lg" href={links.play}>
            O‘ynab ko‘rish
          </a>
          <a className="btn btn--lg btn--outline" href={links.answers}>
            Javoblar arxivi
          </a>
        </div>

        <AdBanner placement="profile" />
      </div>
    </section>
  );
}

/** Bitta maqola. */
export default function GuidePage({ guide }: { guide: Guide }) {
  const others = GUIDES.filter((item) => item.path !== guide.path);

  return (
    <section className="oyin qollanma">
      <article className="wrap qollanma__wrap">
        <a className="player__back" href={links.guides}>
          <ChevronLeft size={18} />
          Qo‘llanma
        </a>

        <header className="qollanma__head">
          <h1>{pretty(guide.h1)}</h1>
          <p className="section__lead">{pretty(guide.lead)}</p>
        </header>

        <div className="qollanma__text">
          {guide.sections.map((section) => (
            <section key={section.h2}>
              <h2>{pretty(section.h2)}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph}>
                  <Rich text={paragraph} />
                </p>
              ))}
              {section.list && (
                <ul>
                  {section.list.map((item) => (
                    <li key={item}>
                      <Rich text={item} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="qollanma__cta">
          <a className="btn btn--lg" href={links.play}>
            Bugungi so‘zni o‘ynash
          </a>
        </div>

        <h2 className="qollanma__title">Yana o‘qing</h2>
        <ul className="qollanma__list">
          {others.map((item) => (
            <li key={item.path}>
              <a href={item.path}>
                <strong>{pretty(item.h1)}</strong>
                <span>{pretty(item.tagline)}</span>
              </a>
            </li>
          ))}
        </ul>

        <AdBanner placement="profile" />
      </article>
    </section>
  );
}
