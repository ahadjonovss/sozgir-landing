/** Lug'atni ilova repozitoriysidan ko'chiradi.
 *
 *  Saytdagi so'zlar ilovadagining aynan nusxasi bo'lishi shart: kunlik
 *  so'z ham, tan olinadigan so'zlar ro'yxati ham shu fayllardan olinadi.
 *  Ilovada lug'at yangilanganda (`GameConstants.bundledDictionaryVersion`
 *  oshganda) shu buyruqni qayta ishga tushiring:
 *
 *      npm run words:sync
 *
 *  Ilova papkasi boshqa joyda bo'lsa: `SOZTOP=../boshqa npm run words:sync`.
 */

import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const source = join(process.env.SOZTOP ?? '../soztop', 'assets/words');
const target = 'public/words';

if (!existsSync(source)) {
  console.error(`Lug'at topilmadi: ${source}`);
  console.error('Ilova papkasini SOZTOP muhit o‘zgaruvchisi bilan ko‘rsating.');
  process.exit(1);
}

const files = ['categories.json', 'uz_4.json', 'uz_5.json', 'uz_6.json', 'uz_7.json'];

for (const file of files) {
  copyFileSync(join(source, file), join(target, file));
  const data = JSON.parse(readFileSync(join(target, file), 'utf8'));
  const size = data.answers?.length ?? data.categories?.length ?? 0;
  console.log(`${file} ← v${data.version} · ${size} ta yozuv`);
}

const totals = files
  .filter((file) => file.startsWith('uz_'))
  .map((file) => JSON.parse(readFileSync(join(target, file), 'utf8')))
  .reduce(
    (sum, data) => ({
      answers: sum.answers + data.answers.length,
      valid: sum.valid + data.valid.length,
    }),
    { answers: 0, valid: 0 },
  );

console.log(
  `\nJami: ${totals.answers} yashirin so‘z, ${totals.valid} tan olinadigan so‘z.`,
);
console.log('Raqamlar o‘zgargan bo‘lsa `src/data/site.ts` dagi `stats` ni yangilang.');
