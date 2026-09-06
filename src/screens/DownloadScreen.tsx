import Screen from '../components/Screen';
import { DownloadSection } from '../components/Sections';

/** Yuklab olish. Saytda o'yin bor, lekin jang, reyting va
 *  bildirishnomalar ilovaga bog'liq — shu farq bo'lim ichida aytiladi. */
export default function DownloadScreen() {
  return (
    <Screen title="Ilovani yuklab olish" back="/" documentTitle="Yuklab olish">
      <DownloadSection />
    </Screen>
  );
}
