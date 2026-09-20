/** Yangiliklar — `/yangiliklar`.
 *
 *  Sayt tez o'zgaradi, lekin bu o'zgarish odamga ko'rinmaydi: u kecha
 *  ham o'sha taxtani ochadi, bugun ham. Ro'yxat shuni aytadi.
 *
 *  Sahifa ochilishi bilan hammasi «o'qilgan» deb belgilanadi va
 *  sarlavhadagi sanoq o'chadi. */
import { useEffect } from 'react';
import { UPDATES } from '../data/updates';
import { links } from '../data/site';
import { formatDate } from '../lib/answers';
import { markUpdatesSeen } from '../lib/updates';
import { pretty } from '../lib/uz';
import AdBanner from './AdBanner';

const WHERE: Record<string, string> = {
  sayt: 'Sayt',
  ilova: 'Ilova',
  ikkisi: 'Sayt va ilova',
};

export default function UpdatesPage() {
  useEffect(markUpdatesSeen, []);

  return (
    <section className="oyin yangilik">
      <div className="wrap yangilik__wrap">
        <header className="yangilik__head">
          <h1>Yangiliklar</h1>
          <p className="section__lead">
            So‘zgirda nima o‘zgardi — eng yangisidan boshlab. Faqat odam
            sezadigan o‘zgarishlar.
          </p>
        </header>

        <ol className="yangilik__list">
          {UPDATES.map((update) => (
            <li key={`${update.date}-${update.title}`} className="yangilik__item">
              <div className="yangilik__meta">
                <time dateTime={update.date}>{formatDate(update.date)}</time>
                <span className="yangilik__where">{WHERE[update.where]}</span>
              </div>
              <h2>{pretty(update.title)}</h2>
              <p>{pretty(update.body)}</p>
              {update.items && (
                <ul className="yangilik__items">
                  {update.items.map((item) => (
                    <li key={item}>{pretty(item)}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>

        <p className="panel__note yangilik__note">
          Taklif yoki xatolik haqida{' '}
          <a className="link" href={links.contact}>
            aloqa sahifasi
          </a>{' '}
          orqali yozing — ro‘yxatdagi ko‘p narsa shu xabarlardan chiqqan.
        </p>

        <AdBanner placement="profile" />
      </div>
    </section>
  );
}
