/** Qattiq rejim qoidasi — ilovadagi `HardModeValidator` ning ko'chirmasi.
 *
 *  Bir marta ochilgan ma'lumot keyingi taxminlarda ishlatilishi shart:
 *
 *   * yashil (joyida turgan) harf o'sha katakda qolishi kerak;
 *   * sariq (so'zda bor) harf taxminda albatta bo'lishi kerak.
 *
 *  Sof funksiya: xato bo'lsa sababini qaytaradi, hammasi joyida bo'lsa
 *  `null`. Xabar matni ham ilovadagidek — «2-harf SH bo'lishi kerak». */
import { display, type Verdict } from './uz';

export interface PastRow {
  units: string[];
  verdicts: ReadonlyArray<Verdict | 'lock' | null> | null;
}

/** Oldingi taxminlardan joyi aniq bo'lgan harflar: katak → harf.
 *
 *  Avto to'ldirish ham, qattiq rejim ham shu ro'yxatga tayanadi —
 *  ilovada ham bitta `_knownLetters` ikkisiga xizmat qiladi. */
export function knownLetters(rows: PastRow[]): Map<number, string> {
  const known = new Map<number, string>();
  for (const row of rows) {
    row.verdicts?.forEach((verdict, index) => {
      if (verdict === 'correct' && row.units[index]) {
        known.set(index, row.units[index]);
      }
    });
  }
  return known;
}

/** Taxmin qattiq rejim qoidasiga mos kelmasa — sabab, mos kelsa `null`. */
export function hardModeError(rows: PastRow[], guess: string[]): string | null {
  const required = new Set<string>();
  for (const row of rows) {
    row.verdicts?.forEach((verdict, index) => {
      if (verdict === 'present' && row.units[index]) required.add(row.units[index]);
    });
  }

  // Avval joyi ma'lum harflar: xatosi ko'zga tashlanadigan qoida.
  for (const [index, unit] of knownLetters(rows)) {
    if (index >= guess.length) continue;
    if (guess[index] !== unit) return `${index + 1}-harf ${display(unit)} bo‘lishi kerak`;
  }

  for (const unit of required) {
    if (!guess.includes(unit)) return `Taxminda ${display(unit)} harfi bo‘lishi kerak`;
  }

  return null;
}
