/** «Hisob kerak» kartochkasi — hisobsiz o'ynalmaydigan sahifalar uchun.
 *
 *  Muhimi shu: kartochka hisob holati **aniqlanmaguncha** chizilmaydi.
 *  `account` sahifa ochilganda har doim `null` bo'ladi (Firebase SDK
 *  yuklanib, sessiyani IndexedDB'dan o'qib chiqishi kerak), ya'ni
 *  tekshiruv `ready` ni kutmasa, kirgan odam ham har tashrifda bir
 *  lahza «Kirish» taklifini ko'rardi va u hisob tanilishi bilan
 *  yo'qolardi. Bo'sh joy — yaxshiroq: u yolg'on gapirmaydi. */
import { useAuth } from '../lib/auth';

export default function AccountCall({ title, note }: { title: string; note: string }) {
  const { ready, openPrompt } = useAuth();

  if (!ready) {
    return <section className="oyin" aria-busy="true" />;
  }

  return (
    <section className="oyin">
      <div className="wrap">
        <div className="panel panel--call">
          <h3>{title}</h3>
          <p className="panel__note">{note}</p>
          <button className="btn btn--sm" onClick={() => openPrompt('signIn')}>
            Kirish
          </button>
        </div>
      </div>
    </section>
  );
}
