import { links } from '../data/site';
import { Link } from './Screen';

/** Sahifa pastidagi havolalar — ilovadagi profil bo'limining qisqartmasi. */
export default function Foot() {
  return (
    <footer className="foot">
      <span>© {new Date().getFullYear()} So‘zgir</span>
      <a href="/shartlar/">Foydalanish shartlari</a>
      <a href="/privacy/">Maxfiylik siyosati</a>
      <a href={links.telegram} target="_blank" rel="noreferrer">
        Telegram
      </a>
      <Link to="/savollar">Savollar</Link>
    </footer>
  );
}
