import Screen, { Link } from '../components/Screen';

/** Noma'lum manzil. Ilovada bunday havola e'tiborsiz qoladi va bosh
 *  ekran ochiladi — saytda ham xuddi shunday yo'l taklif qilinadi. */
export default function NotFound() {
  return (
    <Screen title="Topilmadi" back="/">
      <div className="card" style={{ marginTop: 20, textAlign: 'center' }}>
        <div className="card__title">Bunday sahifa yo‘q</div>
        <p className="prose">Havola eskirgan yoki xato yozilgan bo‘lishi mumkin.</p>
        <Link to="/" className="btn btn--block" style={{ marginTop: 14 }}>
          Bosh sahifaga
        </Link>
      </div>
    </Screen>
  );
}
