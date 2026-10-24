/** Ovoz effektlari — ilovadagi `SoundService` ning veb ulushi.
 *
 *  Fayllar ilovaning o'zidan ko'chirilgan (`soztop/assets/sounds`), ya'ni
 *  saytda va telefonda **aynan bir xil** eshitiladi: katak ochilishining
 *  uch notasi, klaviatura «tik»i, rad javobi, g'alaba va mag'lubiyat
 *  kuylari. Ro'yxat ataylab qisqa — saytda bor voqealarnigina oladi.
 *
 *  Nega Web Audio, `<audio>` emas: qator ochilganda kataklar 130 ms
 *  oralig'ida ketma-ket chaladi, klaviatura esa bundan ham zichroq.
 *  Bitta `<audio>` oldingi ovozni kesardi, har safar yangisini yasash
 *  esa kechikish beradi. Web Audio da bitta dekodlangan bufer necha
 *  marta kerak bo'lsa, shuncha marta chalinadi.
 *
 *  Brauzer odam sahifaga tegmaguncha ovozni *chalishga* ruxsat
 *  bermaydi — lekin yuklashga to'sqinlik qilmaydi. Shuning uchun ish
 *  ikkiga bo'lingan: taxta chiqishi bilan tez-tez kerak bo'ladiganlari
 *  bo'sh vaqtda yuklanadi (`warmSounds`), qolgani birinchi bosishda
 *  (`unlockSounds`). Shunda birinchi harfning o'zi ovozli bo'ladi va
 *  o'ynamaydigan odam ortiqcha fayl yuklamaydi.
 *
 *  Ovoz chiqmasligi o'yinga ta'sir qilmaydi — har bir xato jimgina
 *  yutiladi (ilovadagi `_play` dagidek). */
import { currentSettings } from './settings';

/** Fayllar ro'yxati — `public/sounds/<nom>.wav`. */
export type Cue =
  | 'key_tap'
  | 'backspace'
  | 'tile_correct'
  | 'tile_present'
  | 'tile_absent'
  | 'reject'
  | 'win'
  | 'lose'
  | 'hint'
  | 'coin'
  /* G'uncha: so'z qabul qilindi, pangramma, barglar aralashtirildi. */
  | 'word_found'
  | 'pangram'
  | 'shuffle'
  /* Jang: boshlanishi, durang va vaqt ogohlantirishi. */
  | 'battle_start'
  | 'draw'
  | 'tick'
  | 'time_warning';

/** Tez-tez va zich chalinadigan, kichkina fayllar — taxta ochilishi
 *  bilan oldindan yuklanadi (jami ~65 KB). Birinchi harfning o'zi
 *  ovozli bo'lishi shundan: fayl bosilgandan keyin yuklansa, birinchi
 *  so'z butunlay jim o'tib ketardi. */
const EAGER: Cue[] = [
  'key_tap',
  'backspace',
  'tile_correct',
  'tile_present',
  'tile_absent',
  'reject',
];

/** G'uncha taxtasining o'z ro'yxati: u yerda katak ham, qator ham
 *  yo'q — so'z butunligicha qabul qilinadi. Shuning uchun taxta
 *  ovozlari o'rniga shular oldindan yuklanadi. */
const GUNCHA: Cue[] = ['key_tap', 'backspace', 'reject', 'word_found', 'shuffle'];

/** Kam uchraydigan va og'irroqlari — ular birinchi bosishdan keyin
 *  yuklanadi: o'yin yakuniga hali vaqt bor. */
const LAZY: Cue[] = [
  'win',
  'lose',
  'hint',
  'coin',
  'draw',
  'pangram',
  'battle_start',
  'tick',
  'time_warning',
];

let context: AudioContext | null = null;
const buffers = new Map<Cue, AudioBuffer>();
const pending = new Set<Cue>();

/** Brauzer ruxsat bergan bo'lsa — kontekst. Bo'lmasa `null`. */
function audio(): AudioContext | null {
  if (context) return context;
  try {
    context = new AudioContext();
  } catch {
    // Eski brauzer yoki ovoz butunlay yopiq: sayt ovozsiz ishlayveradi.
    return null;
  }
  return context;
}

async function load(ctx: AudioContext, cue: Cue): Promise<void> {
  if (buffers.has(cue) || pending.has(cue)) return;
  pending.add(cue);
  try {
    const response = await fetch(`/sounds/${cue}.wav`);
    buffers.set(cue, await ctx.decodeAudioData(await response.arrayBuffer()));
  } catch {
    // Bitta fayl yuklanmasa qolganlari ishlayveradi.
  } finally {
    pending.delete(cue);
  }
}

function preload(ctx: AudioContext, cues: Cue[]): void {
  for (const cue of cues) void load(ctx, cue);
}

/** Taxta ekranga chiqqanda chaqiriladi: fayllar **bosishdan oldin**
 *  tayyor bo'lsin.
 *
 *  Yuklash uchun teginish shart emas — brauzer faqat *chalishni*
 *  to'sadi. Kontekst shu yerda yopiq (`suspended`) holda ochiladi va
 *  birinchi bosishda uyg'otiladi.
 *
 *  Bo'sh vaqtda: sahifa ochilishi va lug'at yuklanishi ovozdan
 *  muhimroq. */
export function warmSounds(board: 'soztop' | 'guncha' = 'soztop'): void {
  if (!currentSettings().sound) return;
  const ctx = audio();
  if (!ctx) return;
  const start = () => preload(ctx, board === 'guncha' ? GUNCHA : EAGER);
  // Safari `requestIdleCallback` ni yaqinda qo'shdi — eskisida taymer.
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(start, { timeout: 2000 });
  } else {
    window.setTimeout(start, 600);
  }
}

/** Birinchi bosishda chaqiriladi: brauzer shu paytdan ovozga ruxsat
 *  beradi. Qolgan fayllar ham shu yerda navbatga qo'yiladi. */
export function unlockSounds(): void {
  if (!currentSettings().sound) return;
  const ctx = audio();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();
  preload(ctx, EAGER);
  preload(ctx, GUNCHA);
  preload(ctx, LAZY);
}

/** Ovozni chaladi. Sozlama o'chiq, fayl yuklanmagan yoki brauzer rad
 *  etgan bo'lsa — jimgina qaytadi. */
export function play(cue: Cue): void {
  if (!currentSettings().sound) return;
  const ctx = audio();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();

  const buffer = buffers.get(cue);
  if (!buffer) {
    // Hali yuklanmagan: shu safar jim ketadi, lekin keyingisiga tayyor
    // bo'lsin. Kutib turib chalish kech bo'lardi — ovoz voqeadan
    // ajralib qolsa, bo'lmagani yaxshi.
    void load(ctx, cue);
    return;
  }

  try {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  } catch {
    // Ovoz chiqmasligi o'yinga ta'sir qilmasligi kerak.
  }
}

/** Qator ochilishi — kataklar ketma-ket, ilovadagidek kichik kuy.
 *
 *  Vaqt CSS bilan bog'langan (`.tile--flip`): har katak `i * 130 ms` da
 *  ag'darila boshlaydi va rangini **yarmida** ochadi. Ovoz ham o'shanda
 *  chalinadi, aks holda u rangdan oldin ketib, quloq bilan ko'z
 *  ajralib qolardi.
 *
 *  Qaytargan funksiyasi taymerlarni bekor qiladi: sahifa almashsa yoki
 *  yangi qator ochilsa, eskisining ovozi kelib qolmasin. */
export function playRow(verdicts: readonly string[]): () => void {
  if (!currentSettings().sound) return () => {};
  const timers = verdicts.map((verdict, index) =>
    window.setTimeout(
      () => play(`tile_${verdict}` as Cue),
      index * 130 + 250,
    ),
  );
  return () => timers.forEach((timer) => window.clearTimeout(timer));
}

/** O'yin tugashiga sanoq — oxirgi soniyalarda har soniyada bitta «tik».
 *
 *  Ilovadagi `EndingCountdown` ning aynan o'zi va bir xil qoida bilan:
 *  **faqat pasayganda** chalinadi.
 *
 *  Ikki narsadan qo'riqlaydi. Soat server bilan sinxronlanadi va qolgan
 *  vaqt bir lahzaga oshib ketishi mumkin; taymer esa aniq bir soniyada
 *  kelmaydi, ya'ni bitta soniya ikki marta ko'rinishi ham mumkin.
 *  Ikkalasida ham ovoz qaytarilmasligi kerak — bir xil soniyani ikki
 *  marta aytgandan ko'ra, bittasini o'tkazib yuborgan yaxshi.
 *
 *  Nol — «tugadi», sanoq emas: o'sha paytda o'yinning o'z ovozi
 *  (g'alaba yoki mag'lubiyat) chalinadi va tik uning ustiga
 *  tushmasligi kerak.
 *
 *  Ishlatish: komponentda bir marta yasaladi (`useRef(countdown())`)
 *  va taymerning har qadamida chaqiriladi. */
export function countdown(from = 10): (left: number) => void {
  let last = Infinity;
  return (left: number) => {
    if (left <= 0 || left > from) return;
    if (left >= last) return;
    last = left;
    play('tick');
  };
}
