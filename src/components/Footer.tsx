import { email, links } from '../data/site';
import Logo from './Logo';

const COLUMNS = [
  {
    title: 'O‘yin',
    items: [
      { href: links.play, label: 'Bugungi so‘z' },
      { href: links.battle, label: 'So‘zjang' },
      { href: links.guncha, label: 'G‘uncha' },
      { href: '/#qoida', label: 'Qoida' },
      { href: '/#alifbo', label: 'Alifbo' },
    ],
  },
  {
    title: 'Ilova',
    items: [
      { href: '/#modullar', label: 'Modullar' },
      { href: '/#yuklab-olish', label: 'Yuklab olish' },
      { href: links.donate, label: 'Qo‘llab-quvvatlash' },
      { href: '/#savollar', label: 'Savollar' },
    ],
  },
  {
    title: 'Loyiha',
    items: [
      { href: links.contact, label: 'Aloqa' },
      { href: links.privacy, label: 'Maxfiylik siyosati' },
      { href: links.support, label: email },
      { href: links.telegram, label: 'Telegram kanal', external: true },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer__grid">
        <div className="footer__brand">
          <a className="brand" href="/#top" aria-label="So‘zgir — bosh sahifa">
            <Logo height={34} />
          </a>
          <p>
            O‘zbek tilidagi so‘z o‘yinlari platformasi. Kuniga bitta so‘z —
            hamma uchun bir xil.
          </p>
          <a className="btn btn--sm" href={links.hub}>
            Hoziroq o‘ynash
          </a>
        </div>

        {COLUMNS.map((column) => (
          <nav className="footer__col" key={column.title} aria-label={column.title}>
            <h4>{column.title}</h4>
            {column.items.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noreferrer' : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>
        ))}
      </div>

      <div className="wrap footer__bottom">
        <span>© {new Date().getFullYear()} So‘zgir</span>
        <span>Toshkentda mehr bilan qilingan</span>
      </div>
    </footer>
  );
}
