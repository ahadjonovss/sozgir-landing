import Screen from '../components/Screen';
import { FaqSection } from '../components/Sections';

/** Savollar — matnlar `data/site.ts` da, akkordeon bosh sahifadagi
 *  bilan bitta komponent. */
export default function Faq() {
  return (
    <Screen title="Savollar" back="/profil">
      <FaqSection />
    </Screen>
  );
}
