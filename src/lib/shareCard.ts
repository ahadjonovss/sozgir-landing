/** Ulashiladigan jang kartochkasi — ilovadagi `BattleShareCard` ning veb
 *  ko'chirmasi.
 *
 *  Ilgari sayt natijani faqat **matn** bilan ulashardi: emoji to'r va
 *  havola. Chatda u boshqa xabarlar orasida ko'zga tashlanmasdi, ilova
 *  esa allaqachon rasm yuboradi — bitta natija ikki joyda ikki xil
 *  ko'rinardi.
 *
 *  Kartochka ekranda hech qachon turmaydi: u xotiradagi `canvas` ga
 *  chiziladi va PNG bo'lib chiqadi. Shu sababdan ranglar sahifaning
 *  yorug'/tungi rejimiga bog'liq emas — karta hamma qurilmada bir xil,
 *  ilovadagi bilan ham bir xil.
 *
 *  Ulashish yo'li ikkita: brauzer fayl ulashishni bilsa (telefonlar)
 *  tizim oynasi ochiladi, bilmasa rasm yuklab olinadi va matn nusxaga
 *  tushadi — ikkinchi holatda ham odam qo'lida rasm qoladi. */
import { pretty } from './uz';

export type ShareTone = 'win' | 'draw' | 'loss' | 'field';

/** Kartochkadagi bitta tomon: taxallus, katta raqam va izoh. */
export interface ShareSide {
  nickname: string;
  /** Jangning yakuniy raqami: So'zjangda «4/6», g'unchada ball. */
  value: string;
  /** Raqam ostidagi kichik izoh: vaqt yoki topilgan so'zlar soni. */
  caption?: string;
  /** Shu tomon yutganmi — nomi yonida nishon turadi. */
  winner?: boolean;
}

export interface ShareCard {
  /** Yuqori yorliq: «So'zjang», «G'uncha jangi». */
  game: string;
  tone: ShareTone;
  /** Katta yozuv: «G'alaba», «Durang», «3-o'rin». */
  verdict: string;
  /** Maqtov gapi — kartaning ovozi. */
  punchline: string;
  me: ShareSide;
  /** Raqib. Maydonda yo'q: sakkiz kishini ikki ustunga bo'lib bo'lmaydi
   *  va o'rin baribir hammasini almashtiradi. */
  rival?: ShareSide;
  /** Maydondagi o'rin — raqib bo'lmaganda ko'rsatiladi. */
  rank?: { rank: number; players: number };
  /** Qo'shimcha raqamlar: uzunlik, o'lja va hokazo. */
  chips?: string[];
  tilesLabel?: string;
  /** Javob (yoki g'uncha) harflari. `strong` — urg'udagi katak:
   *  So'zjangda hammasi, g'unchada faqat yurak harf. */
  tiles?: { text: string; strong?: boolean }[];
}

/** Kartochkaning mantiqiy o'lchami; rasm ikki barobar chiqadi. */
const W = 540;
const H = 640;
const SCALE = 2;

const INK = '#f4f6f8';
const INK_SOFT = '#98a0ad';
const TONE: Record<ShareTone, string> = {
  win: '#63a967',
  draw: '#d3af4e',
  loss: '#d1544f',
  field: '#6c97f5',
};

const FONT = 'Nunito, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const font = (size: number, weight = 800) => `${weight} ${size}px ${FONT}`;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Doira shaklidagi yorug'lik — kartaning foni yassi qolmasin. */
function glow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  alpha: number,
): void {
  const shade = ctx.createRadialGradient(x, y, 0, x, y, radius);
  shade.addColorStop(0, color);
  shade.addColorStop(1, 'transparent');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** Bitta tomon: ism, katta raqam va izoh. */
function side(
  ctx: CanvasRenderingContext2D,
  value: ShareSide,
  x: number,
  y: number,
  accent: string,
): void {
  ctx.textAlign = 'center';
  ctx.fillStyle = value.winner ? accent : INK_SOFT;
  ctx.font = font(17, 800);
  const name = pretty(value.nickname).slice(0, 16);
  ctx.fillText(value.winner ? `★ ${name}` : name, x, y);

  ctx.fillStyle = INK;
  ctx.font = font(46, 900);
  ctx.fillText(value.value, x, y + 52);

  if (value.caption) {
    ctx.fillStyle = INK_SOFT;
    ctx.font = font(15, 700);
    ctx.fillText(value.caption, x, y + 78);
  }
}

/** Kartochkani chizadi va PNG qaytaradi. */
export async function drawShareCard(card: ShareCard): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(SCALE, SCALE);

  // Shrift hali yuklanmagan bo'lsa kartada tizim shrifti chiqib qolardi.
  try {
    await document.fonts?.load(font(46, 900));
    await document.fonts?.ready;
  } catch {
    // Shriftlar API'si yo'q — karta baribir chiziladi.
  }

  const accent = TONE[card.tone];

  const back = ctx.createLinearGradient(0, 0, W, H);
  back.addColorStop(0, '#1c212a');
  back.addColorStop(1, '#0c0e12');
  ctx.fillStyle = back;
  ctx.fillRect(0, 0, W, H);

  // Ikki yorug'lik: tepada natija rangi, pastda sovuq aks-sado — jang
  // ikki tomonli, fon ham shuni takrorlaydi.
  glow(ctx, W - 40, -40, 240, accent, 0.32);
  glow(ctx, -40, H - 20, 220, '#6c97f5', 0.16);

  // Fondagi ulkan yozuv: karta yassi qog'oz emas, afisha bo'lib
  // ko'rinsin. Faqat konturi — ustidagi matnni bosib ketmaydi.
  ctx.save();
  ctx.translate(-16, H - 150);
  ctx.rotate(-0.14);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1.6;
  ctx.font = font(86, 900);
  ctx.textAlign = 'left';
  ctx.strokeText(card.verdict.toUpperCase(), 0, 0);
  ctx.restore();

  // Sarlavha: o'yin nomi va sayt.
  ctx.textAlign = 'left';
  ctx.fillStyle = INK;
  ctx.font = font(20, 900);
  ctx.fillText('So‘zgir', 36, 52);
  ctx.fillStyle = INK_SOFT;
  ctx.font = font(15, 700);
  ctx.textAlign = 'right';
  ctx.fillText(card.game, W - 36, 52);

  // Natija yorlig'i — rangli quticha.
  ctx.textAlign = 'center';
  ctx.font = font(15, 900);
  const verdict = card.verdict.toUpperCase();
  const pillW = ctx.measureText(verdict).width + 44;
  ctx.fillStyle = `${accent}2e`;
  roundRect(ctx, (W - pillW) / 2, 92, pillW, 38, 19);
  ctx.fill();
  ctx.strokeStyle = `${accent}80`;
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.fillText(verdict, W / 2, 117);

  // Maqtov gapi — ikki qatorgacha.
  ctx.fillStyle = INK;
  ctx.font = font(30, 900);
  const words = pretty(card.punchline).split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > W - 80 && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  lines.slice(0, 2).forEach((text, index) => {
    ctx.fillText(text, W / 2, 182 + index * 38);
  });

  const top = 182 + Math.min(2, lines.length) * 38 + 26;

  // Hisob: ikki tomon yonma-yon, orada ajratgich. Maydonda o'rin.
  roundRect(ctx, 36, top, W - 72, 132, 22);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
  ctx.lineWidth = 1;
  ctx.stroke();

  if (card.rival) {
    side(ctx, card.me, W / 2 - 110, top + 40, accent);
    side(ctx, card.rival, W / 2 + 110, top + 40, accent);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.moveTo(W / 2, top + 24);
    ctx.lineTo(W / 2, top + 108);
    ctx.stroke();
  } else {
    side(ctx, card.me, W / 2, top + 40, accent);
    if (card.rank) {
      ctx.fillStyle = INK_SOFT;
      ctx.font = font(15, 700);
      ctx.fillText(
        `${card.rank.players} kishilik maydonda ${card.rank.rank}-o‘rin`,
        W / 2,
        top + 106,
      );
    }
  }

  // Kataklar: javob harflari yoki g'unchaning harflari.
  let y = top + 170;
  if (card.tiles?.length) {
    if (card.tilesLabel) {
      ctx.fillStyle = INK_SOFT;
      ctx.font = font(14, 700);
      ctx.fillText(card.tilesLabel, W / 2, y - 16);
    }
    const size = 46;
    const gap = 8;
    const total = card.tiles.length * size + (card.tiles.length - 1) * gap;
    let x = (W - total) / 2;
    for (const tile of card.tiles) {
      roundRect(ctx, x, y, size, size, 12);
      ctx.fillStyle = tile.strong === false ? 'rgba(255,255,255,0.08)' : `${accent}33`;
      ctx.fill();
      ctx.strokeStyle = tile.strong === false ? 'rgba(255,255,255,0.14)' : `${accent}88`;
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.font = font(24, 900);
      ctx.fillText(pretty(tile.text).toUpperCase(), x + size / 2, y + size / 2 + 9);
      x += size + gap;
    }
    y += size + 30;
  }

  // Qo'shimcha raqamlar — pastki qator.
  if (card.chips?.length) {
    ctx.font = font(14, 800);
    const widths = card.chips.map((text) => ctx.measureText(text).width + 26);
    const total = widths.reduce((sum, w) => sum + w, 0) + (widths.length - 1) * 8;
    let x = (W - total) / 2;
    card.chips.forEach((text, index) => {
      const width = widths[index]!;
      roundRect(ctx, x, y, width, 30, 15);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.fill();
      ctx.fillStyle = INK_SOFT;
      ctx.fillText(text, x + width / 2, y + 20);
      x += width + 8;
    });
  }

  ctx.fillStyle = INK_SOFT;
  ctx.font = font(15, 800);
  ctx.fillText('sozgir.uz', W / 2, H - 34);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
}

/** Kartochkani ulashadi. Rasm chiqmasa `false` qaytadi — chaqiruvchi
 *  eski matnli yo'lga tushadi. */
export async function shareCardImage(card: ShareCard, text: string): Promise<boolean> {
  let blob: Blob | null = null;
  try {
    blob = await drawShareCard(card);
  } catch {
    return false;
  }
  if (!blob) return false;

  const file = new File([blob], 'sozgir-jang.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text });
      return true;
    } catch {
      // Bekor qilindi yoki ruxsat berilmadi — yuklab olishga o'tmaymiz:
      // odam ataylab yopgan bo'lishi mumkin.
      return true;
    }
  }

  // Fayl ulashilmaydigan brauzerda (ko'pincha kompyuter) rasm yuklab
  // olinadi: odam qo'lida baribir kartochka qoladi.
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sozgir-jang.png';
  link.click();
  URL.revokeObjectURL(url);
  return true;
}
