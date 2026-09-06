import OpenInApp from '../components/OpenInApp';
import Screen from '../components/Screen';
import { Person } from '../components/Icons';

/** O'yinchining ochiq profili (`/u/<uid>`).
 *
 *  Ma'lumot hisobga bog'langan va Firestore'da turadi, shuning uchun
 *  sayt uni ko'rsatmaydi — havolani ilovaga uzatadi. Manzil ilovadagi
 *  deep link bilan bir xil, ya'ni telefonda o'zi ilovada ochiladi. */
export default function PublicProfile({ uid }: { uid: string }) {
  return (
    <Screen title="O‘yinchi" subtitle="Ochiq profil" back="/" documentTitle="O‘yinchi profili">
      <div className="stack" style={{ paddingTop: 20 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <span className="avatar" style={{ margin: '0 auto 12px' }}>
            <Person size={22} />
          </span>
          <div className="card__title">Profil ilovada ochiladi</div>
          <p className="prose">
            Taxallus, ball, seriya va bellashuv reytingi hisobga
            bog‘langan — ularni So‘zgir ilovasi ko‘rsatadi.
          </p>
          <p className="prose" style={{ marginTop: 8, fontSize: 12, wordBreak: 'break-all' }}>
            ID: {uid}
          </p>
        </div>
        <OpenInApp path={`/u/${uid}`} label="Profilni ilovada ochish" />
      </div>
    </Screen>
  );
}
