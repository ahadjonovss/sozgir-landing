/** «Hisob qanday yuritiladi» — har o'yin ichidagi qisqa tushuntirish.
 *
 *  Matn **formuladan chiqadi** (`score.ts`, `gunchaProgress.ts`): kunlik
 *  zinapoya ham, cheksiz rejimning eng katta mukofoti ham qo'lda
 *  yozilmagan. Aks holda muvozanat bir kun o'zgarganda qoida bilan
 *  hisob ajralib qolardi — odam esa qoidaga ishonadi.
 *
 *  Ikki ko'rinishi bor: `bare` — tayyor ro'yxat ichiga tushadigan `li`
 *  qatorlar (o'yin sahifalarida qoidalar ro'yxati allaqachon bor),
 *  boshqa joyda esa o'zining yig'ilgan `details` i. */
import { aqcha } from '../lib/aqcha';
import { attemptsFor, DAILY_LENGTH, LENGTHS } from '../lib/modes';
import { scoreFor } from '../lib/score';

export type ScoredGame = 'soztop' | 'guncha' | 'sozjang' | 'gunchajang' | 'mardu';

/** Kunlik so'zning zinapoyasi: «20 · 17 · 13 · 10 · 7 · 3». */
function dailyLadder(): string {
  const maxAttempts = attemptsFor(DAILY_LENGTH);
  return Array.from({ length: maxAttempts }, (_, index) =>
    aqcha(scoreFor({ mode: 'daily', attempts: index + 1, maxAttempts })),
  ).join(' · ');
}

/** Cheksiz rejimda eng katta mukofot — eng qisqa va eng uzun so'z uchun. */
function endlessRange(): { short: number; long: number } {
  const best = (length: number) =>
    aqcha(scoreFor({ mode: 'endless', attempts: 1, maxAttempts: attemptsFor(length) }));
  return { short: best(LENGTHS[0]), long: best(LENGTHS[LENGTHS.length - 1]) };
}

function linesOf(game: ScoredGame): string[] {
  const { short, long } = endlessRange();

  switch (game) {
    case 'soztop':
      return [
        `Kunlik so‘z urinishlar bo‘yicha beradi: ${dailyLadder()} aqcha. Topa olmasangiz — 0.`,
        `Cheksiz rejimda qancha urinish qolsa — shuncha aqcha: ${LENGTHS[0]} harfda eng ko‘pi ${short}, ${LENGTHS[LENGTHS.length - 1]} harfda ${long}.`,
        'Avval topilgan so‘z 60 % beradi — lekin hech qachon 1 aqchadan kam emas.',
        'Yordam olsangiz shift tushadi: mavzu ochilsa 6, ma’nosi ham ochilsa 4 aqcha. Kunlik o‘yinda yordam yo‘q.',
        'Yig‘ilgan aqcha kunlik va umumiy reytingga tushadi.',
      ];
    case 'guncha':
      return [
        'O‘yin ichidagi hisob: 4 harfli so‘z — 1, undan uzuni harflari soniga teng. Daraja shu hisob bo‘yicha o‘sadi.',
        'Hamyonga esa raundning ulushi tushadi: g‘unchani to‘liq yechsangiz 20 aqcha, yarmini yechsangiz 10.',
        'Shuning uchun mukofot o‘sha kungi harflarga bog‘liq emas — og‘ir g‘uncha ham, yengili ham bir xil turadi.',
      ];
    case 'sozjang':
      return [
        'Jang aqcha emas, o‘lja beradi: odatdagi jangda eng ko‘pi ±7, birinchi janglarda ±10.',
        'O‘lja yo‘qdan paydo bo‘lmaydi — u raqibdan olinadi: siz olganingizni u yo‘qotadi.',
        'Taslim bo‘lingan jang o‘ljaga kirmaydi.',
        'Darajalar: Chopar, Cherik, Navkar, O‘nboshi, Yuzboshi, Mingboshi, Botir, Bahodir, Tarxon, Alp.',
      ];
    case 'gunchajang':
      return [
        'Jangdagi hisob g‘unchadagidek: 4 harfli so‘z — 1, uzuni harflari soniga teng, pangramma — qo‘shimcha 7.',
        'Jang aqcha emas, o‘lja beradi: eng ko‘pi ±5, birinchi janglarda ±7.',
        'Jangda yig‘ilgan hisob umumiy aqchaga qo‘shilmaydi — u shu jangning o‘lchovi.',
      ];
    case 'mardu':
      return [
        'Hisob o‘yinning o‘z qoidasi bo‘yicha yuritiladi — maydon uni o‘zgartirmaydi.',
        'Oxirida jadval tuziladi va o‘lja o‘rin bo‘yicha taqsimlanadi: yuqoridagi oladi, quyidagi beradi.',
      ];
  }
}

export default function ScoreRules({
  game,
  bare = false,
}: {
  game: ScoredGame;
  /** Tayyor ro'yxat ichiga qo'yiladigan qatorlar. */
  bare?: boolean;
}) {
  const lines = linesOf(game);
  if (bare) {
    return (
      <>
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </>
    );
  }

  return (
    <details className="lobby__rules">
      <summary>Hisob qanday yuritiladi</summary>
      <ul>
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </details>
  );
}
