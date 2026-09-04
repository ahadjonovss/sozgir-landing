/** Kunlik o'yin: sana → raqam va so'z.
 *
 *  Hisob ilovadagi `GameConstants` va `DailyWordSelector` bilan **aynan**
 *  bir xil bo'lishi shart: bir kunda ilovadagi va saytdagi so'z boshqa
 *  chiqsa, kunlik reyting ikkiga bo'linib ketadi. */

/** №1 kunlik o'yin sanasi (mahalliy vaqt bo'yicha). */
const EPOCH = Date.UTC(2026, 7, 3);

const two = (value: number) => String(value).padStart(2, '0');

/** Kunlik o'yin kaliti: `2026-09-04`. */
export function dailyKey(date = new Date()): string {
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`;
}

/** Kunlik o'yin tartib raqami (№33 kabi). */
export function dailyNumber(date = new Date()): number {
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.round((today - EPOCH) / 86_400_000) + 1;
}

/** Keyingi so'zgacha qolgan vaqt (soat:daqiqa:soniya). */
export function untilNextWord(now = new Date()): number {
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );
  return midnight.getTime() - now.getTime();
}

/** Lehmer (Park–Miller) generatori — kichik sonlar bilan ishlaydi, shuning
 *  uchun Dart va JS'da natija bir xil. */
class Lehmer {
  private state: number;

  constructor(seed: number) {
    const modulus = 2147483647;
    const value = Math.abs(seed) % modulus;
    this.state = Math.min(Math.max(value, 1), modulus - 1);
  }

  nextInt(max: number): number {
    this.state = (this.state * 48271) % 2147483647;
    return this.state % max;
  }
}

function shuffled(source: string[], seed: number): string[] {
  const items = [...source];
  const random = new Lehmer(seed);
  for (let i = items.length - 1; i > 0; i--) {
    const j = random.nextInt(i + 1);
    [items[i], items[j]] = [items[j]!, items[i]!];
  }
  return items;
}

/** Kunlik so'z: ro'yxat urug'langan Fisher–Yates bilan aralashtiriladi,
 *  so'ngra kun raqami bo'yicha aylanma indeks olinadi — ya'ni lug'at
 *  tugamaguncha so'z takrorlanmaydi. */
export function selectDailyWord({
  answers,
  number,
  length,
}: {
  answers: string[];
  number: number;
  length: number;
}): string {
  if (answers.length === 0) throw new Error('Bo‘sh lug‘atdan so‘z tanlab bo‘lmaydi');
  const ordered = shuffled(answers, length * 7919 + 13);
  const index = (number - 1) % ordered.length;
  return ordered[index < 0 ? index + ordered.length : index]!;
}
