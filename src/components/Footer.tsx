import { links } from '../data/site';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer__inner">
        <div className="footer__brand">
          <a className="brand" href="/#top" aria-label="So‘zgir — bosh sahifa">
            <Logo height={36} />
          </a>
          <p>O‘zbek tilidagi so‘z o‘yinlari platformasi.</p>
        </div>

        <nav className="footer__links">
          <a href={links.play}>O‘ynash</a>
          <a href={links.battle}>So‘zjang</a>
          <a href="/#qoida">Qoida</a>
          <a href="/#modullar">Modullar</a>
          <a href="/#savollar">Savollar</a>
          <a href={links.privacy}>Maxfiylik siyosati</a>
          <a href={links.contact}>Aloqa</a>
          <a href={links.support}>Yordam</a>
          <a href={links.telegram} target="_blank" rel="noreferrer">
            Telegram
          </a>
        </nav>
      </div>

      <div className="wrap footer__bottom">
        <span>© {new Date().getFullYear()} So‘zgir</span>
        <span>Toshkentda mehr bilan qilingan</span>
      </div>
    </footer>
  );
}
