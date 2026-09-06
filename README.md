# So‘zgir — veb ilova

**So‘zgir** mobil ilovasining veb versiyasi. Bu tanishtiruv sahifasi emas:
brauzerda ilovaning o‘z ekranlari ochiladi va bugungi so‘z **ilovadagining
aynan o‘zi** bo‘ladi.

Ilova repozitoriysi: `../soztop`. Dizayn, matn va qoidalar o‘sha yerdan
olingan — bu yerda ular takrorlanmaydi, **ko‘chiriladi**.

## Sayt ikki vazifani bajaradi

1. **Tanishtiruv sahifasi** — o‘yinni tushuntirish va ilovaga yo‘naltirish:
   modullar, kategoriyalar, qoida, savollar, do‘kon havolalari, hujjatlar.
2. **Ilovaning veb versiyasi** — bugungi so‘z shu yerda o‘ynaladi.

Ikkisi bir sahifada urishmasligi uchun bosh sahifa ekranga qarab
o‘zgaradi:

| | Telefon (<900px) | Kompyuter (≥900px) |
| --- | --- | --- |
| Bosh sahifa | ilovaning bosh ekrani (kunlik kartochka + modul to‘ri), **pastida** tanishtiruv bo‘limlari | tanishtiruv sahifasi: hero, kunlik kartochka, modullar, qoida, kategoriyalar, savollar, yuklab olish |
| Navigatsiya | sarlavhadagi orqaga tugmasi (ilovadagidek) | chapda doimiy menyu (`Sidebar`) |
| O‘yin | butun ekran o‘yinga | maydon + yon panel (ranglar, klaviatura maslahati, natija) |
| Ro‘yxatlar | bitta ustun | o‘qish kengligi yoki ikki ustun |

Tanishtiruv bo‘limlari — bitta komponentlar to‘plami
(`src/components/Sections.tsx`): ular ham telefondagi bosh ekranda, ham
kompyuterdagi bosh sahifada, ham alohida sahifalarda (`/savollar`,
`/qanday-oynaladi`, `/yuklab-olish`) ishlatiladi. Matnlar
`src/data/site.ts` da — dizaynga tegmasdan tahrirlanadi.

Qolgan farq faqat CSS'da: `src/styles/app.css` dagi
`@media (min-width: 900px)`.

## Manzillar ilovaning deep link'lari bilan bir xil

Bitta havola ikki joyda ishlaydi: telefonda ilova ochiladi (Universal
Links / App Links), ilova yo‘q bo‘lsa shu sayt ochiladi.

| Manzil | Saytda | Ilovada (`deep_link.dart`) |
| --- | --- | --- |
| `/kunlik` | bugungi so‘z, o‘ynaladi | kunlik o‘yin |
| `/jang/<KOD>` | kod va «ilovada ochish» | So‘zjang, kod bilan qo‘shilish |
| `/u/<uid>` | «ilovada ochish» | o‘yinchining ochiq profili |
| `/` | bosh ekran | bosh ekran |

Qolgan manzillar faqat saytda: `/soztop`, `/cheksiz/<uzunlik>`,
`/kategoriya/<uzunlik>[/<id>]`, `/statistika`, `/reyting`, `/organish`,
`/yangsoz`, `/profil`, `/qanday-oynaladi`, `/savollar`, `/yuklab-olish`.
Statik sahifalar `public/` da: `/privacy/`, `/shartlar/`, `/donat/`.

Tasdiq fayllari — `public/.well-known/apple-app-site-association` va
`assetlinks.json`. `vercel.json` ularni SPA qayta yozuvidan chiqarib
tashlaydi va `application/json` sarlavhasini qo‘yadi. Batafsil:
`../soztop/docs/deeplinks.md`.

## Kunlik so‘z ilovadagi bilan bir xil

Ikki qadam — ilovadagi tartibning o‘zi:

1. `daily/{sana}_5` hujjati Firestore'dan REST orqali o‘qiladi
   (`src/lib/daily.ts`, SDK kerak emas, 2.5 s timeout);
2. javob kelmasa so‘z **deterministik** tanlanadi — urug‘langan
   Fisher–Yates va Lehmer generatori (`src/lib/game.ts`), ya‘ni
   `DailyWordSelector` ning aynan ko‘chirmasi.

Ikkalasi bir xil natija beradi; tekshirilgan: Dart va JS 4–7 harf uchun
30–40 kun oralig‘ida bir xil so‘zlarni chiqaradi.

## Lug‘at

`public/words/uz_{4,5,6,7}.json` va `categories.json` — ilovaning
`assets/words/` fayllarining nusxasi (2 898 yashirin so‘z, 64 049 tan
olinadigan so‘z, har javobning ta’rifi va mavzusi bilan). Ilovada lug‘at
yangilanganda:

```bash
npm run words:sync
```

Fayllar bandlanmaydi (bundle'ga kirmaydi) — kerak bo‘lganda `fetch`
bilan olinadi va brauzer keshida qoladi.

## O‘zbek alifbosi

`src/lib/uz.ts` — ilovadagi `lib/core/utils/uz_alphabet.dart` ning aniq
porti. `sh`, `ch`, `oʻ`, `gʻ` **bitta harf** hisoblanadi: bitta katak,
bitta tugma.

```ts
split('boshqa'); // ['b', 'o', 'sh', 'q', 'a'] — 6 emas, 5
```

Apostroflar ikki xil: `ʻ` (U+02BB, `oʻ`/`gʻ` ichida) va `ʼ` (U+02BC,
tutuq — `maʼno`). `normalize()` istalgan apostrof turini kanonik shaklga
keltiradi, `pretty()` esa ekranga chiqarish uchun `‘` va `’` ga
almashtiradi (Nunito'da U+02BB va U+02BC glifi yo‘q).

## Nima bor

| Ekran | Nima qiladi |
| --- | --- |
| Bosh | Kunlik kartochka, modul to‘ri — ilovadagi `HomePage` tartibi |
| So‘ztop | Kunlik, uzunlik tanlash, cheksiz, kategoriyalar |
| O‘yin | To‘liq o‘yin: haqiqiy lug‘at, yordam, natija, ulashish |
| So‘zjang | Chaqiruv kodi va ilovaga o‘tish |
| Yangso‘z | Haftalik turnir tanishtiruvi |
| O‘rganish | Tasodifiy so‘z va uning ma’nosi, bilim darajasi |
| Reyting / Statistika | Brauzerdagi natija va ball qoidalari |
| Profil | Taxallus, mavzu, hujjatlar, yordam |
| Tanishtiruv | Modullar, kategoriyalar, qoida, savollar, yuklab olish |

O‘yin imkoniyatlari ilovadagidek: topilgan harflar keyingi qatorga
o‘zi yoziladi, tugallanmagan o‘yin saqlanadi, 60 soniyadan keyin mavzu,
120 soniyadan keyin ta’rif taklif qilinadi, ball
`ScoreCalculator` formulasi bo‘yicha hisoblanadi
(`asos × samaradorlik × takror`).

Natijalar `localStorage` da (`sozgir.*`). Hisob, jang, reyting va
bildirishnomalar — ilovada.

## Ishga tushirish

```bash
npm ci
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build → dist/
npm run lint     # oxlint
```

Node 22+ kerak.

## Fayl tuzilishi

```
src/
  lib/        uz.ts (alifbo), game.ts (qoidalar+ball), daily.ts (server),
              dictionary.ts, storage.ts, useGame.ts, router.ts, deeplink.ts
  components/ Screen (AppBar/Sheet), Sidebar (kompyuter menyusi), Cards,
              Board, Keyboard, ResultSheet, GameAside…
  screens/    Home, Soztop, GameScreen, Categories, Battle, Coinage,
              Learning, Rating, Stats, Profile, PublicProfile, Help…
  styles/     theme.css (ranglar — app_palette.dart), app.css (ramka)
public/
  words/            lug'at nusxasi
  .well-known/      App Links / Universal Links tasdig'i
  privacy|shartlar|donat/  statik sahifalar
```
