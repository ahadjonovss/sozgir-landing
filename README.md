# So‘zgir — landing

O‘zbek tilidagi so‘z o‘yinlari platformasi **So‘zgir** ning tanishtiruv sahifasi.
Maqsad ikkita: o‘yinni tushuntirish va foydalanuvchini ilovani yuklab olishga
yo‘naltirish.

Sahifaning o‘zagi — brauzerda haqiqatan o‘ynaladigan **So‘ztop** taxtasi.
Kunlik so‘z sana asosida hisoblanadi, ya’ni ilovadagidek hamma bir xil so‘zni
ko‘radi.

## Nima bor

| Bo‘lim | Nima qiladi |
| --- | --- |
| Hero | To‘liq ishlaydigan So‘ztop demosi (klaviatura + fizik klaviatura) |
| Qoida | Ikki bosqichli avto-demo, rang legendasi ustiga kursor kelganda ajratiladi |
| Alifbo | Yozilgan so‘zni jonli ravishda harf-kataklarga ajratadi |
| Modullar | So‘ztop, So‘zjang, Yangso‘z, O‘rganish, Reyting, Qo‘llab-quvvatlash |
| Kategoriyalar | 10 mavzu + ilova afzalliklari |
| Savollar | Akkordeon FAQ |
| Yuklab olish | Store havolalari (hozircha «Tez orada») |

Alohida sahifalar: `/privacy` (maxfiylik siyosati, o‘zbekcha + inglizcha) va
`/contact` (aloqa ma’lumotlari + so‘rov formasi).

## O‘zbek alifbosi

`src/lib/uz.ts` — ilovadagi `lib/core/utils/uz_alphabet.dart` ning aniq porti.
`sh`, `ch`, `oʻ`, `gʻ` **bitta harf** hisoblanadi: bitta katak, bitta tugma.

```ts
split('boshqa'); // ['b', 'o', 'sh', 'q', 'a'] — 6 emas, 5
```

Apostroflar ikki xil: `ʻ` (U+02BB, `oʻ`/`gʻ` ichida) va `ʼ` (U+02BC, tutuq —
`maʼno`). `normalize()` istalgan apostrof turini shu kanonik shaklga keltiradi.

Ekranga chiqarishda `pretty()` ishlatiladi — Nunito shriftida U+02BB va U+02BC
glifi yo‘q, fallback shrift chaqirilib matnda bo‘shliq paydo bo‘lardi. Shuning
uchun ko‘rsatishda ular `‘` va `’` ga almashtiriladi, ma’lumot fayllari esa
kanonik holatda qoladi.

## Ishga tushirish

```bash
npm ci
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build → dist/
npm run lint     # oxlint
```

Node 22+ kerak.

## Tuzilma

```
api/
  contact.ts    aloqa formasini Telegramga uzatuvchi Edge Function
src/
  components/   bo‘limlar (Hero, Rules, Alphabet, Modules, …)
  data/
    site.ts     barcha matn va havolalar — dizaynga tegmasdan tahrirlash uchun
    words.ts    demo so‘zlar (ta’rif va kategoriya bilan)
    privacy.ts  maxfiylik siyosati matni (uz + en)
  lib/
    uz.ts       alifbo, normalize/split, Wordle baholash
    useWordGame.ts  o‘yin holati
    useReveal.ts    scroll animatsiyasi va mavzu almashtirish
    useRoute.ts     kichik router (`/`, `/privacy`, `/contact`)
  styles/
    theme.css   dizayn tokenlari (yorug‘ + tungi)
    landing.css bo‘lim uslublari
```

Store havolalari chiqqanda faqat `src/data/site.ts` dagi `links.appStore` va
`links.playStore` to‘ldiriladi — tugmalar o‘zi «Tez orada» holatidan chiqadi.

## Dizayn

Ranglar ilovaning `app_palette.dart` faylidan va admin paneldagi `theme.css`
dan olingan — sayt, ilova va admin panel bir ko‘rinishda. Tungi rejim tanlovi
`localStorage` da `sozgir.theme` kalitida saqlanadi (admin panel bilan bir xil).

Logotip `public/logo.svg` dan ko‘chirilgan, lekin `Logo.tsx` da `currentColor`
bilan qayta chizilgan — shunda u tungi rejimda ham to‘g‘ri ko‘rinadi.

## Aloqa formasi va Telegram

`/contact` dagi forma `api/contact.ts` (Vercel Edge Function) ga yuboriladi, u
esa xabarni Telegram guruhiga tashlaydi. Xabar formati soztop ilovasidagi
`Reporter` bilan bir xil, shunda ikki oqim bitta guruhda bir ko‘rinishda bo‘ladi.

Vercel muhit o‘zgaruvchilari (Project → Settings → Environment Variables):

| Kalit | Nima |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | bot tokeni |
| `TELEGRAM_CHAT_ID` | guruh yoki kanal ID (masalan `-1001234567890`) |
| `TELEGRAM_CONTACT_THREAD` | mavzu (topic) raqami, ixtiyoriy |

Token yoki chat berilmasa funksiya `503` qaytaradi, forma esa foydalanuvchiga
pochta manzilini ko‘rsatadi. Lokalda `npm run dev` bilan faqat sahifalar
ishlaydi — funksiyani sinash uchun `vercel dev` kerak.

## Deploy

Vercel: `vercel.json` tayyor (framework `vite`, chiqish `dist`, SPA uchun
rewrite). Repo ulansa qo‘shimcha sozlash kerak emas.

## Stack

Vite · React 19 · TypeScript · oxlint. CSS freymvorki yo‘q — faqat CSS
o‘zgaruvchilari.
