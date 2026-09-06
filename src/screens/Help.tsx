import Screen, { Link } from '../components/Screen';
import { RulesSection } from '../components/Sections';

/** «Qanday o'ynaladi?» — ilovadagi o'quv (`TutorialPage`) ning qisqa
 *  ko'rinishi. Qoida bloki bosh sahifadagi bilan bitta komponent. */
export default function HelpScreen() {
  return (
    <Screen title="Qanday o‘ynaladi?" back="/">
      <RulesSection />

      <div className="card" style={{ marginTop: 8, maxWidth: 640 }}>
        <div className="card__title">Kunlik o‘yin</div>
        <p className="prose">
          Bir kunga bitta so‘z va u <strong>barcha qurilmalarda bir
          xil</strong> — saytda ham, ilovada ham. Shu sababli kunlik
          reyting adolatli bo‘ladi.
        </p>
        <Link to="/kunlik" className="btn btn--block" style={{ marginTop: 12 }}>
          Bugungi so‘zni o‘ynash
        </Link>
      </div>
    </Screen>
  );
}
