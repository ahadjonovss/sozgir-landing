/** Ichki sahifaning sarlavhasi — ilovadagi `AppBar`.
 *
 *  Telefonda chapda orqaga tugmasi, o'rtada nom; kompyuterda esa u oddiy
 *  sahifa sarlavhasiga aylanadi (menyu chapda turadi, orqaga tugmasi
 *  kerak emas) — farq faqat CSS'da. */
import { useAuth } from '../lib/auth';
import { ChevronLeft, Person } from './Icons';

/** [title] berilmasa — faqat orqaga tugmasi bo'lgan ixcham qator.
 *  Bunday sahifada (hujjatlar, aloqa) o'z sarlavhasi bor, ikki marta
 *  yozilmasin; kompyuterda esa bunday qator umuman kerak emas. */
export default function AppBar({
  title,
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  const { account, openPrompt } = useAuth();

  return (
    <header className={`bar${title ? '' : ' bar--plain'}`}>
      <button
        className="icon-btn bar__back"
        onClick={() => (history.length > 1 ? history.back() : (location.href = '/'))}
        aria-label="Orqaga"
      >
        <ChevronLeft size={24} />
      </button>
      <div>
        {title && <div className="bar__title">{title}</div>}
        {subtitle && <span className="bar__subtitle">{subtitle}</span>}
      </div>
      <button
        className="icon-btn"
        onClick={() => openPrompt(account ? 'profile' : 'signIn')}
        aria-label={account ? 'Profil' : 'Kirish'}
      >
        {account ? (
          <span className="account__avatar">{account.initial}</span>
        ) : (
          <Person size={20} />
        )}
      </button>
    </header>
  );
}
