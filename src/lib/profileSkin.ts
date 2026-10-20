/** Ochiq profilning «premium» ko'rinishi — ilovadagi `ProfileSkin`,
 *  `DonorLook` va `DonorStyle` ning veb ko'chirmasi
 *  (`soztop/lib/features/public_profile/domain/profile_skin.dart`,
 *  `soztop/lib/features/donor/domain/donor_look.dart`).
 *
 *  Ikki toifa boshqalardan ajralib turadi: loyihani qo'llaganlar va
 *  tasdiqlangan hisoblar. Ilovada ular uchun butun ekran o'zgaradi —
 *  rangli sarlavha maydoni, sahifaga tushadigan ohang, kartochkalardagi
 *  hoshiya. Saytda ham xuddi shunday bo'lishi kerak: bitta odam ikki
 *  joyda ikki xil ko'rinmasin.
 *
 *  **Sonlar o'ylab topilmagan.** Rang, chegara va bezak kuchi
 *  ilovadagi ro'yxatning aynan o'zi; hisob formulalari ham o'sha
 *  (`weight`, `avatarSize`, `washAlpha`…). Ikkalasi bir manbadan
 *  oziqlansin desak, bu jadval serverga chiqishi kerak — hozir u
 *  yerda yo'q.
 *
 *  **Tanlov ham hisobga olinadi.** Homiy o'z ko'rinishini ilovada
 *  tanlaydi (`donors/{uid}.look`) va server uni ochiq profil javobida
 *  beradi. Shuning uchun sayt avval o'sha tanlovga qaraydi; tanlov
 *  yo'q bo'lsa (yoki noma'lum kalit kelsa) ko'rinish yig'indidan
 *  olinadi — ilovadagi sukut bo'yicha xulqning o'zi. */
import { donorTier, type DonorTier } from './donor';

/** Ko'rinish turi — bezak kuchi shundan ham kelib chiqadi. */
type LookKind = 'ladder' | 'unique';

/** Maydon bo'ylab yuradigan naqsh. Ilovadagi `ProfilePattern`. */
export type ProfilePattern =
  | 'none'
  | 'zarra'
  | 'halqa'
  | 'barg'
  | 'chiziq'
  | 'koshin'
  | 'ipak'
  | 'samo';

interface DonorLook {
  /** Hujjatdagi barqaror kalit (`donors/{uid}.look`). */
  id: string;
  label: string;
  /** Shu ko'rinish ochiladigan eng kam yig'indi (so'm). */
  min: number;
  kind: LookKind;
  pattern: ProfilePattern;
  /** Gradient: to'qdan ochga. */
  dark: string;
  light: string;
  /** Bezak rangi — nur, yulduz, halqa, ajratuvchi chiziq. */
  ornament: string;
  /** Kartochkalar ohangi. */
  accent: string;
  /** Maydon ichidagi matn rangi. */
  ink?: string;
  /** Shafaq dog'ining rangi. Yo'q bo'lsa shafaq umuman chizilmaydi. */
  aurora?: string;
  /** Ohang shu qadar och-ki, kartochka matni uning ustida o'qilmaydi. */
  pale?: boolean;
}

const ladder = (
  id: string,
  label: string,
  min: number,
  pattern: ProfilePattern,
  dark: string,
  light: string,
  ornament: string,
  accent: string,
  extra: Partial<DonorLook> = {},
): DonorLook => ({
  id,
  label,
  min,
  kind: 'ladder',
  pattern,
  dark,
  light,
  ornament,
  accent,
  ...extra,
});

/** Ro'yxat ilovadagi `DonorLook` enumining aynan o'zi (mavsumiylari
 *  yo'q: ular kunga bog'liq va saytda hali ishlatilmaydi). */
const LOOKS: DonorLook[] = [
  ladder('saxovatpesha', 'Mis', 2499, 'zarra', '#7A4A21', '#C0854A', '#FFD9A8', '#B8763A'),
  ladder('boyvachcha', 'Kumush', 8000, 'chiziq', '#4E5F76', '#97ADC6', '#EAF2FB', '#8FA6C2'),
  ladder('eski_boylardan', 'Oltin', 14500, 'halqa', '#8A6005', '#E6BC45', '#FFF0BC', '#D4A017'),
  ladder('zaytun', 'Zaytun', 21000, 'barg', '#2C4328', '#6E9A55', '#DCF0C0', '#5C8841'),
  ladder('feruza', 'Feruza', 27500, 'chiziq', '#0C5059', '#34A09C', '#CBF4EE', '#1F8A86'),
  ladder('shafaq', 'Shafaq', 34000, 'zarra', '#6E2342', '#E0784F', '#FFE3C8', '#CC5B4E'),
  ladder('yoqut', 'Yoqut', 40500, 'halqa', '#5E0F1E', '#B8334A', '#FFD2D9', '#A82B43'),
  ladder('zodagon', 'Binafsha', 47000, 'barg', '#3E2490', '#9370EE', '#E2D6FF', '#7C5CD6'),
  ladder('zumrad', 'Zumrad', 53500, 'chiziq', '#05362A', '#1C8E68', '#C7F2DF', '#17805E'),
  ladder('siyoh', 'Siyoh', 60000, 'halqa', '#0E2038', '#2F6C93', '#CFE7F7', '#2A6184'),
  ladder('lojuvard', 'Lojuvard', 66500, 'zarra', '#15236B', '#4258C9', '#D5DCFF', '#3A4CB8'),
  ladder('marjon', 'Marjon', 73000, 'barg', '#7A2415', '#D4654A', '#FFDCCB', '#C25238'),
  ladder('nilufar', 'Nilufar', 79500, 'chiziq', '#6B1B4E', '#C65A9A', '#FFD6EC', '#B44A88'),
  ladder('chinor', 'Chinor', 86000, 'barg', '#6B3410', '#D08A2E', '#FFE4B5', '#BE7A1E'),
  ladder('yalpiz', 'Yalpiz', 92500, 'halqa', '#0B4438', '#3EA383', '#CFF5E6', '#2C8F70'),
  ladder('shabnam', 'Shabnam', 99000, 'zarra', '#0D3F57', '#3A95B8', '#D2EEF8', '#2A7E9E'),
  ladder('tosh_komir', 'Tosh ko‘mir', 105500, 'chiziq', '#15181D', '#3C4756', '#DFE6EF', '#44505F'),
  ladder('zafaron', 'Zafaron', 112000, 'halqa', '#7A3B06', '#E0952A', '#FFE7BE', '#C67E18'),
  ladder('pista', 'Pista', 118500, 'barg', '#2F4A13', '#86A93F', '#E8F5C4', '#6E9130'),
  ladder('gulbahor', 'Gulbahor', 125000, 'zarra', '#6E1430', '#CC4F74', '#FFD8E3', '#B84063'),
  ladder('dengiz', 'Dengiz', 131500, 'chiziq', '#06303A', '#1E7E8C', '#CDF0F4', '#1A6E7C'),
  ladder('nilgun', 'Nilg‘un', 138000, 'halqa', '#1A1A4E', '#4A49A8', '#D8D8FF', '#3F3E96'),
  ladder('olov', 'Olov', 144500, 'zarra', '#611005', '#CE4A1C', '#FFD8C0', '#B8411A'),
  ladder('tok_bargi', 'Tok bargi', 151000, 'barg', '#14331C', '#4C8A46', '#D9F1D2', '#3E7A39'),
  ladder('oqshom', 'Oqshom', 157500, 'halqa', '#241A47', '#5E4F9E', '#DDD6F5', '#51438E'),
  ladder('oqsuyak', 'Marvarid', 164000, 'zarra', '#12141F', '#39406A', '#E8EEF7', '#C3D0E2', {
    ink: '#F6F9FD',
    aurora: '#7C5CD6',
    pale: true,
  }),
  // ── Alohida: naqshi bor, kam uchraydi ────────────────────────────
  {
    id: 'koshin',
    label: 'Koshin',
    min: 190000,
    kind: 'unique',
    pattern: 'koshin',
    dark: '#0B1B3A',
    light: '#1F4E7A',
    ornament: '#A8F0E6',
    accent: '#1F6F8F',
    aurora: '#1F8A86',
  },
  {
    id: 'ipak',
    label: 'Ipak',
    min: 220000,
    kind: 'unique',
    pattern: 'ipak',
    dark: '#3A0B2E',
    light: '#8E2E6B',
    ornament: '#F3D6A8',
    accent: '#8E2E6B',
    aurora: '#C9A227',
  },
  {
    id: 'samo',
    label: 'Samo',
    min: 250000,
    kind: 'unique',
    pattern: 'samo',
    dark: '#07070C',
    light: '#241B3F',
    ornament: '#EFE3B8',
    accent: '#5B4B94',
    ink: '#F7F4EC',
    aurora: '#6D4FD0',
  },
];

/** Bosqichlarning eng yuqori chegarasi — bezak shkalasining birligi. */
const TOP = 164000;

/** Nur, yorug'lik va yorqinlik qo'shiladigan qadam — 14 500 so'm. */
const RAYS = 0.28;

/** Yulduz va kartochka nuri qo'shiladigan qadam — 47 000 so'm. */
const STARS = 0.52;

/** Bezakning kuchi: 0 dan 1 gacha.
 *
 *  Kvadrat ildiz bilan: pul chiziqli o'sadi, ko'z esa emas. */
const weightOf = (look: DonorLook) =>
  look.kind === 'unique' ? 1 : Math.sqrt(Math.min(1, Math.max(0, look.min / TOP)));

export interface ProfileSkin {
  /** Hujjatdagi kalit — CSS da naqsh tanlash uchun ham shu. */
  id: string;
  /** Maydon tepasidagi yorliq: «Loyiha homiysi» yoki «Tasdiqlangan hisob». */
  eyebrow: string;
  /** Ism ostidagi yorliq: daraja nomi yoki «Premium». */
  ribbon: string;
  /** Ism ostidagi bir qatorlik ta'rif. */
  honorific: string;
  heroColors: [string, string];
  ink: string;
  ornament: string;
  accent: string;
  pageTone: string;
  pattern: ProfilePattern;
  aurora: string | null;
  /** Avatar diametri — 76 dan 104 gacha. */
  avatarSize: number;
  /** Avatar atrofidagi nurning kuchi. `0` — nur yo'q. */
  haloBlur: number;
  /** Sahifaning qolgan qismiga tushadigan ohangning kuchi. */
  washAlpha: number;
  /** Avatar ortidagi yumshoq yorug'lik. */
  glowAlpha: number;
  /** Yelpig'ich nur. `0` — nur yo'q. */
  rayAlpha: number;
  /** Fonda sochilgan yulduzlar. */
  stars: boolean;
  /** Kartochka ostida yengil nur. */
  cardGlow: boolean;
  /** Avatar chetidagi nishon — faqat tasdiqlangan hisobda. */
  medallion: boolean;
}

/** Tasdiqlangan hisobning ko'rinishi.
 *
 *  Homiylik darajalaridan **kamroq** bezak bilan ajraladi, ko'proq
 *  bilan emas: nur, yulduz va shafaq darajalarni bir-biridan farqlash
 *  uchun, tasdiq esa bitta va u o'zini isbotlamaydi. Shuning uchun
 *  maydon jim: grafit fon, bitta shampan rangidagi ingichka chiziq va
 *  nishonning o'zi. */
export const VERIFIED_SKIN: ProfileSkin = {
  id: 'verified',
  eyebrow: 'Tasdiqlangan hisob',
  ribbon: 'Premium',
  honorific: 'So‘zgir tasdiqlagan hisob',
  heroColors: ['#14161C', '#272B34'],
  ink: '#F2F1EE',
  ornament: '#CBB183',
  accent: '#8A7A56',
  pageTone: '#272B34',
  pattern: 'none',
  aurora: null,
  avatarSize: 104,
  haloBlur: 0,
  washAlpha: 0.05,
  glowAlpha: 0.05,
  rayAlpha: 0,
  stars: false,
  cardGlow: false,
  medallion: true,
};

/** Daraja ostidagi bir qatorlik ta'rif — ilovadagi `donorHonorific*`. */
const HONORIFIC: Record<DonorTier, string> = {
  saxovatpesha: 'Loyihaga yelka tutgan',
  boyvachcha: 'Loyihani qayta-qayta qo‘llagan',
  eskiBoylardan: 'Loyihaning tayanchlaridan',
  zodagon: 'Loyihani ko‘tarib turgan',
  oqsuyak: 'Loyihaning oliy homiysi',
};

/** Kaliti bo'yicha ko'rinish. Noma'lum kalit — `null`: jadval
 *  ilovadagiga qarab o'sadi va eski sayt yangi kalitni bilmasligi
 *  mumkin. Unda yig'indi bo'yicha tanlangani chiziladi, ya'ni ekran
 *  bo'sh qolmaydi. */
const lookById = (id: string | null) =>
  id ? (LOOKS.find((look) => look.id === id) ?? null) : null;

/** Shu yig'indi ochgan eng yuqori ko'rinish. */
function lookForAmount(amount: number): DonorLook | null {
  let best: DonorLook | null = null;
  for (const look of LOOKS) {
    if (amount >= look.min && (best === null || look.min >= best.min)) best = look;
  }
  return best;
}

/** Homiylik ko'rinishi — daraja yozuvlari bilan.
 *
 *  Ilovadagi `DonorStyle.skinAs` ning o'zi: bezak ko'rinishdan,
 *  yozuvlar esa darajadan olinadi. Mis fonni tanlagan Oqsuyak baribir
 *  Oqsuyak — ko'rinish darajani yashirmaydi. */
function donorSkin(look: DonorLook, tier: DonorTier, label: string): ProfileSkin {
  const weight = weightOf(look);
  return {
    id: look.id,
    eyebrow: 'Loyiha homiysi',
    ribbon: label,
    honorific: HONORIFIC[tier],
    heroColors: [look.dark, look.light],
    ink: look.ink ?? '#FFFFFF',
    ornament: look.ornament,
    accent: look.accent,
    // Marvarid shu qadar och-ki, oq sahifada umuman sezilmaydi:
    // u holda ohang gradientning ochidan olinadi.
    pageTone: look.pale ? look.light : look.accent,
    pattern: look.pattern,
    aurora: look.aurora ?? null,
    avatarSize: 76 + 28 * weight,
    haloBlur: weight < RAYS ? 0 : 8 + 26 * weight,
    washAlpha: 0.035 + 0.07 * weight,
    glowAlpha: 0.045 + 0.07 * weight,
    rayAlpha: weight < RAYS ? 0 : weight < STARS ? 0.07 : 0.1,
    stars: weight >= STARS,
    cardGlow: weight >= STARS,
    medallion: false,
  };
}

/** Shu o'yinchining profili qanday ko'rinishda ochiladi.
 *
 *  Tasdiq homiylikdan ustun: ikkalasi ham bo'lsa ilovada
 *  `ProfileSkin.verified` chiziladi.
 *
 *  `null` — oddiy profil. */
export function profileSkin(input: {
  verified: boolean;
  /** Loyihaga berilgan umumiy summa (so'mda). */
  donated: number;
  /** O'zi tanlagan ko'rinish kaliti — ochiq profil javobidan. */
  look?: string | null;
  /** Daraja nomi — `donorLabel` dan (matn bitta joyda tursin). */
  label: (tier: DonorTier) => string;
}): ProfileSkin | null {
  if (input.verified) return VERIFIED_SKIN;
  const tier = donorTier(input.donated);
  if (!tier) return null;
  /* Tanlagani ustun: ilovada ekran aynan shunday chiziladi. Tanlov
     yo'q bo'lsa yig'indi ochgan eng yuqorisi olinadi. */
  const look = lookById(input.look ?? null) ?? lookForAmount(input.donated) ?? LOOKS[0]!;
  return donorSkin(look, tier, input.label(tier));
}
