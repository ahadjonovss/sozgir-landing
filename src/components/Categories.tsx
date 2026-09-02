import { categories } from '../data/site';

const perks = [
  {
    icon: '📡',
    title: 'Internetsiz ishlaydi',
    text: 'Lug‘at ilova bilan birga keladi. O‘yin hech qachon tarmoqni kutmaydi — aloqa qaytganda yangi so‘zlar o‘zi yuklanadi.',
  },
  {
    icon: '🚫',
    title: 'Reklama yo‘q',
    text: 'Banner ham, oraliq reklama ham, ilova ichi xaridlari ham yo‘q. Hech kim sizga hech narsa sotmaydi.',
  },
  {
    icon: '👤',
    title: 'Ro‘yxatsiz o‘ynaladi',
    text: 'Mehmon sifatida darhol boshlang. Hisob faqat natijalarni boshqa qurilmada saqlash uchun kerak.',
  },
  {
    icon: '🌙',
    title: 'Tungi rejim',
    text: 'Ko‘zni qiynamaydigan tungi palitra, tebranishni sozlash va spoylersiz ulashish.',
  },
];

export default function Categories() {
  return (
    <section className="section section--alt">
      <div className="wrap">
        <div className="cats">
          <div className="cats__left reveal">
            <span className="section__kicker">Kategoriyalar</span>
            <h2>Mavzu tanlab o‘ynang</h2>
            <p className="section__lead">
              Kayfiyatga qarab tanlang: bugun hayvonlar, ertaga taomlar. Har
              kategoriyaning o‘z saqlangan sessiyasi bor — yarimda tashlab
              ketsangiz ham joyidan davom etadi.
            </p>
            <div className="cats__grid">
              {categories.map((c) => (
                <span key={c.name} className="cat">
                  <i aria-hidden="true">{c.emoji}</i>
                  {c.name}
                </span>
              ))}
            </div>
          </div>

          <ul className="perks">
            {perks.map((p, i) => (
              <li key={p.title} className="perk reveal" style={{ transitionDelay: `${i * 70}ms` }}>
                <span className="perk__icon" aria-hidden="true">
                  {p.icon}
                </span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
