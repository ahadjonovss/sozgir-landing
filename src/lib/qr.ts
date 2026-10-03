/** QR kod — havolani ekrandan o'qitish uchun.
 *
 *  **Nega o'zimiz yozdik.** Tadbirda eng tez yo'l — ekranga QR chiqarib,
 *  o'ntacha odamni bitta kadrda turnirga kiritish. Tayyor paket esa
 *  bu bitta ish uchun qimmat: `qrcode` paketi bosh paketga kirib,
 *  umuman turnir ochmaydigan odamga ham yuklanardi. Bu yerda esa faqat
 *  kerakli qismi bor — **bayt rejimi, M darajadagi xatolik tuzatish,
 *  1–6 versiyalar** (106 baytgacha). Turnir havolasi 31 bayt, ya'ni
 *  3-versiyaga sig'adi; qolgan zaxira kelajakdagi uzunroq havolaga.
 *
 *  Yetmaydigani ataylab yo'q: raqam va alifbo rejimlari (havolada foyda
 *  bermaydi — kichik harf baribir bayt rejimini talab qiladi), 7 va undan
 *  yuqori versiyalar (ular hujjatga versiya raqamini ham yozishni
 *  talab qiladi). Sig'maydigan matnda `null` qaytadi — chaqiruvchi QR
 *  o'rniga havolani ko'rsatadi.
 *
 *  Qolgani standartning o'zi: ISO/IEC 18004 dagi tartib, nomlari ham
 *  o'sha (`finder`, `alignment`, `mask`, `penalty`). */

// ── GF(256) — Rid-Solomon maydoni ──────────────────────────────────────

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

for (let i = 0, x = 1; i < 255; i++) {
  EXP[i] = x;
  LOG[x] = i;
  // Standart ko'paytuvchi ko'phad: x⁸ + x⁴ + x³ + x² + 1.
  x = x << 1;
  if (x & 0x100) x ^= 0x11d;
}
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]!;

const mul = (a: number, b: number): number =>
  a === 0 || b === 0 ? 0 : EXP[LOG[a]! + LOG[b]!]!;

/** Xatolik tuzatish ko'phadi — (x + α⁰)(x + α¹)…(x + αⁿ⁻¹). */
function generator(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array<number>(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j]!;
      next[j + 1] ^= mul(poly[j]!, EXP[i]!);
    }
    poly = next;
  }
  return poly;
}

/** Ma'lumot baytlarining qoldig'i — xatolik tuzatish baytlari. */
function remainder(data: number[], count: number): number[] {
  const gen = generator(count);
  const work = [...data, ...new Array<number>(count).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const factor = work[i]!;
    if (factor === 0) continue;
    for (let j = 0; j < gen.length; j++) work[i + j] ^= mul(gen[j]!, factor);
  }
  return work.slice(data.length);
}

// ── Versiyalar ─────────────────────────────────────────────────────────

/** M darajasi uchun versiya o'lchamlari (1–6).
 *
 *  `data` — jami ma'lumot baytlari, `ec` — har blokdagi xatolik tuzatish
 *  baytlari, `blocks` — bloklar soni. Bu oltitasida bloklar teng
 *  o'lchamda, shuning uchun aralashtirish ham sodda. */
const SPECS = [
  { data: 16, ec: 10, blocks: 1 },
  { data: 28, ec: 16, blocks: 1 },
  { data: 44, ec: 26, blocks: 1 },
  { data: 64, ec: 18, blocks: 2 },
  { data: 86, ec: 24, blocks: 2 },
  { data: 108, ec: 16, blocks: 4 },
];

/** Tekislovchi belgilar markazlari — versiya bo'yicha. */
const ALIGN: number[][] = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34]];

// ── Matn → baytlar → bitlar ────────────────────────────────────────────

/** Ma'lumot baytlari: rejim, uzunlik, matn, to'ldirgich. */
function codewords(bytes: Uint8Array, data: number): number[] | null {
  // Rejim (4 bit) va uzunlik (1–9 versiyalarda 8 bit) — jami 12 bit,
  // ya'ni ikki bayt o'rni ketadi.
  if (bytes.length > data - 2) return null;

  const bits: number[] = [];
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >> i) & 1);
  };

  push(0b0100, 4);
  push(bytes.length, 8);
  for (const byte of bytes) push(byte, 8);

  const room = data * 8;
  push(0, Math.min(4, room - bits.length));
  while (bits.length % 8 !== 0) bits.push(0);
  // Standartdagi to'ldirgich juftligi — navbatma-navbat.
  for (let i = 0; bits.length < room; i++) push(i % 2 === 0 ? 0xec : 0x11, 8);

  const words: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j]!;
    words.push(byte);
  }
  return words;
}

/** Bloklarga bo'lib, xatolik tuzatish qo'shib, aralashtiradi. */
function interleave(words: number[], spec: (typeof SPECS)[number]): number[] {
  const size = spec.data / spec.blocks;
  const data: number[][] = [];
  const ec: number[][] = [];
  for (let b = 0; b < spec.blocks; b++) {
    const chunk = words.slice(b * size, (b + 1) * size);
    data.push(chunk);
    ec.push(remainder(chunk, spec.ec));
  }

  const out: number[] = [];
  for (let i = 0; i < size; i++) for (const block of data) out.push(block[i]!);
  for (let i = 0; i < spec.ec; i++) for (const block of ec) out.push(block[i]!);
  return out;
}

// ── To'rni chizish ─────────────────────────────────────────────────────

type Grid = { dark: boolean[][]; fixed: boolean[][]; size: number };

function blank(size: number): Grid {
  return {
    dark: Array.from({ length: size }, () => new Array<boolean>(size).fill(false)),
    fixed: Array.from({ length: size }, () => new Array<boolean>(size).fill(false)),
    size,
  };
}

/** O'zgarmas belgi — maska unga tegmaydi. */
function fix(grid: Grid, x: number, y: number, dark: boolean): void {
  if (x < 0 || y < 0 || x >= grid.size || y >= grid.size) return;
  grid.dark[y]![x] = dark;
  grid.fixed[y]![x] = true;
}

/** Burchakdagi uchta katta kvadrat va ular atrofidagi oq chiziq. */
function finder(grid: Grid, cx: number, cy: number): void {
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      const dist = Math.max(Math.abs(dx), Math.abs(dy));
      fix(grid, cx + dx, cy + dy, dist !== 2 && dist !== 4);
    }
  }
}

function alignment(grid: Grid, cx: number, cy: number): void {
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      fix(grid, cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }
}

function patterns(grid: Grid, version: number): void {
  const last = grid.size - 1;

  // Vaqt chizig'i — oltinchi qator va ustun; burchaklarni keyin
  // kvadratlar qoplaydi.
  for (let i = 0; i < grid.size; i++) {
    fix(grid, 6, i, i % 2 === 0);
    fix(grid, i, 6, i % 2 === 0);
  }

  finder(grid, 3, 3);
  finder(grid, last - 3, 3);
  finder(grid, 3, last - 3);

  const centers = ALIGN[version - 1]!;
  for (const cy of centers) {
    for (const cx of centers) {
      // Burchakdagi uchtasi kvadratlar ustiga tushadi — o'tkazib yuboriladi.
      const corner =
        (cx === centers[0] && cy === centers[0]) ||
        (cx === centers[0] && cy === centers[centers.length - 1]) ||
        (cx === centers[centers.length - 1] && cy === centers[0]);
      if (!corner) alignment(grid, cx, cy);
    }
  }

  // Shakl ma'lumoti uchun joy band qilinadi (qiymati maska bilan birga
  // yoziladi) va doim qora turadigan bitta belgi.
  for (let i = 0; i <= 8; i++) {
    // Oltinchi qator va ustun — vaqt chizig'i, u shakl ma'lumotiga
    // kirmaydi va o'z qiymatida qoladi.
    if (i === 6) continue;
    fix(grid, 8, i, false);
    fix(grid, i, 8, false);
  }
  // Nusxasi sakkiztadan: to'qqizinchisi ma'lumot belgisi bo'lib qoladi
  // va band qilinsa butun oqim bir belgiga siljib ketardi.
  for (let i = 0; i < 8; i++) {
    fix(grid, 8, last - i, false);
    fix(grid, last - i, 8, false);
  }
  fix(grid, 8, grid.size - 8, true);
}

/** Shakl ma'lumoti: daraja (M = 00) va maska raqami, BCH himoyasi bilan. */
function formatBits(mask: number): number {
  const data = mask; // M darajasining kodi — 00, ya'ni faqat maska qoladi.
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  return ((data << 10) | rem) ^ 0x5412;
}

function drawFormat(grid: Grid, mask: number): void {
  const bits = formatBits(mask);
  const bit = (i: number) => ((bits >>> i) & 1) === 1;
  const last = grid.size - 1;

  for (let i = 0; i <= 5; i++) fix(grid, 8, i, bit(i));
  fix(grid, 8, 7, bit(6));
  fix(grid, 8, 8, bit(7));
  fix(grid, 7, 8, bit(8));
  for (let i = 9; i < 15; i++) fix(grid, 14 - i, 8, bit(i));

  for (let i = 0; i < 8; i++) fix(grid, last - i, 8, bit(i));
  for (let i = 8; i < 15; i++) fix(grid, 8, grid.size - 15 + i, bit(i));
  fix(grid, 8, grid.size - 8, true);
}

/** Ma'lumot baytlarini pastki o'ng burchakdan ilon tartibida yozadi. */
function drawData(grid: Grid, bytes: number[]): void {
  let index = 0;
  for (let right = grid.size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // Vaqt chizig'i ustuni o'tkazib yuboriladi.
    for (let step = 0; step < grid.size; step++) {
      for (let side = 0; side < 2; side++) {
        const x = right - side;
        const up = ((right + 1) & 2) === 0;
        const y = up ? grid.size - 1 - step : step;
        if (grid.fixed[y]![x]) continue;
        if (index < bytes.length * 8) {
          grid.dark[y]![x] = ((bytes[index >>> 3]! >>> (7 - (index & 7))) & 1) === 1;
        }
        index++;
      }
    }
  }
}

const MASKS: ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

function applyMask(grid: Grid, mask: number): void {
  const fn = MASKS[mask]!;
  for (let y = 0; y < grid.size; y++) {
    for (let x = 0; x < grid.size; x++) {
      if (!grid.fixed[y]![x] && fn(x, y)) grid.dark[y]![x] = !grid.dark[y]![x];
    }
  }
}

/** Maska bahosi — kichigi yaxshi. Standartdagi to'rt qoida: uzun bir
 *  xil zanjir, 2×2 maydon, kvadratga o'xshab ketadigan naqsh va qora
 *  belgilar ulushining nomutanosibligi. */
function penalty(grid: Grid): number {
  const { size, dark } = grid;
  let score = 0;

  const line = (get: (i: number) => boolean) => {
    let run = 1;
    let bits = 0;
    for (let i = 0; i < size; i++) {
      if (i > 0 && get(i) === get(i - 1)) {
        run++;
        if (run === 5) score += 3;
        else if (run > 5) score += 1;
      } else run = 1;
      // «1011101» ikki tomonidagi to'rt oq — kvadratga o'xshaydi.
      bits = ((bits << 1) | (get(i) ? 1 : 0)) & 0x7ff;
      if (i >= 10 && (bits === 0x5d0 || bits === 0x05d)) score += 40;
    }
  };

  for (let i = 0; i < size; i++) {
    line((j) => dark[i]![j]!);
    line((j) => dark[j]![i]!);
  }

  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const first = dark[y]![x];
      if (
        first === dark[y]![x + 1] &&
        first === dark[y + 1]![x] &&
        first === dark[y + 1]![x + 1]
      ) {
        score += 3;
      }
    }
  }

  let darkCount = 0;
  for (const row of dark) for (const cell of row) if (cell) darkCount++;
  const total = size * size;
  score += Math.floor(Math.abs(darkCount * 20 - total * 10) / total) * 10;
  return score;
}

// ── Tashqi yuz ─────────────────────────────────────────────────────────

/** Matndan QR to'ri. Sig'masa `null` — chaqiruvchi havolani o'zi
 *  ko'rsatadi, QR o'rnini bo'sh qoldirib. */
export function qrMatrix(text: string): boolean[][] | null {
  const bytes = new TextEncoder().encode(text);

  for (let version = 1; version <= SPECS.length; version++) {
    const spec = SPECS[version - 1]!;
    const words = codewords(bytes, spec.data);
    if (!words) continue;

    const data = interleave(words, spec);
    let best: Grid | null = null;
    let bestScore = Infinity;

    // Maskani bahosi bo'yicha tanlaymiz: to'rtta qoida o'quvchini
    // chalg'itadigan naqshlarni jarimaga tortadi.
    for (let mask = 0; mask < 8; mask++) {
      const grid = blank(17 + 4 * version);
      patterns(grid, version);
      drawData(grid, data);
      applyMask(grid, mask);
      drawFormat(grid, mask);
      const score = penalty(grid);
      if (score < bestScore) {
        bestScore = score;
        best = grid;
      }
    }

    return best!.dark;
  }

  return null;
}

/** To'rni bitta SVG yo'liga aylantiradi — har belgiga alohida
 *  to'rtburchak chizilsa, 29×29 to'rda 400 ga yaqin tugun hosil
 *  bo'lardi. Yo'nalish `0 0 size size` koordinatasida. */
export function qrPath(matrix: boolean[][]): string {
  const parts: string[] = [];
  matrix.forEach((row, y) => {
    let start = -1;
    // Yonma-yon qora belgilar bitta to'rtburchakka qo'shiladi: yo'l
    // qisqaradi va belgilar orasida oq tirqish qolmaydi.
    for (let x = 0; x <= row.length; x++) {
      if (row[x]) {
        if (start < 0) start = x;
      } else if (start >= 0) {
        parts.push(`M${start} ${y}h${x - start}v1h-${x - start}z`);
        start = -1;
      }
    }
  });
  return parts.join('');
}
