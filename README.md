# So‘zgir — landing

O‘zbek tilidagi so‘z o‘yinlari platformasi **So‘zgir** ning tanishtiruv sahifasi.
Maqsad ikkita: o‘yinni tushuntirish va foydalanuvchini ilovani yuklab olishga
yo‘naltirish.

Sahifaning o‘zagi — brauzerda haqiqatan o‘ynaladigan **So‘ztop**. Demo emas:
lug‘at ilovaning o‘zi ishlatadigan Firestore hujjatidan olinadi, kunlik so‘z
esa serverda belgilangan so‘z — ya’ni saytdagi bugungi so‘z telefondagisi
bilan aynan bir xil. Hisob ochilsa natija reytingga tushadi.

## Nima bor

| Bo‘lim | Nima qiladi |
| --- | --- |
| Hero | Haqiqiy So‘ztop: kunlik va cheksiz rejim, hisob, ball, statistika |
| So‘zjang | Do‘st bilan (kod orqali) va tezkor jang — `/sozjang` |
| Qoida | Ikki bosqichli avto-demo, rang legendasi ustiga kursor kelganda ajratiladi |
| Alifbo | Yozilgan so‘zni jonli ravishda harf-kataklarga ajratadi |
| Modullar | So‘ztop, So‘zjang, Yangso‘z, O‘rganish, Reyting, Qo‘llab-quvvatlash |
| Kategoriyalar | 10 mavzu + ilova afzalliklari |
| Savollar | Akkordeon FAQ |
| Yuklab olish | App Store havolasi (Google Play hozircha «Tez orada») |

Alohida sahifalar: `/oyin` (So‘ztop), `/sozjang` (bellashuv), `/privacy` (maxfiylik
siyosati, o‘zbekcha + inglizcha) va `/contact` (aloqa ma’lumotlari + so‘rov
formasi).

## O‘yin

O‘yin ikki joyda ko‘rinadi va ikkisi bitta `Play` komponentini ishlatadi:

* **hero** — yangi mehmonni ushlab qolish uchun, telefon ramkasi ichida;
* **`/oyin`** — qaytib keladiganlar uchun barqaror manzil: taxta,
  statistika va reyting bir joyda, tanishtiruv bloklarini aylanib
  o‘tirmasdan.

Holat brauzerda bir joyda saqlanadi, ya’ni hero’da boshlangan o‘yin `/oyin`
da davom etadi va aksincha. Rejim tanlovi `useGameChoice` da — taxta va
uning yonidagi statistika paneli bir xil rejimni ko‘rsatishi kerak.

Sarlavhadagi «O‘ynash» havolasi har doim ko‘rinadi: nav mobilda
yashiringan, o‘yin sahifasiga boshqa yo‘l qolmasligi kerak. Shu sabab tor
ekranda (≤440px) sarlavhadagi «Yuklab olish» tugmasi olib tashlanadi — u
hero’da, «Yuklab olish» bo‘limida va footerda ham bor.

Ikki rejim, ilovadagi qoidalar bilan:

| Rejim | Qoida |
| --- | --- |
| **Kunlik** | Kuniga bitta 5 harfli so‘z, hamma uchun bir xil. Bir kunda bir marta o‘ynaladi, natija kunlik reytingga yoziladi. |
| **Cheksiz** | 4–7 harf, xohlagancha. Ball so‘z uzunligiga bog‘liq, avval topilgan so‘z uchun 40 % kamayadi. |

Boshlangan o‘yin brauzerda saqlanadi (`sozgir.game.*`): sahifa yangilanganda
taxta o‘sha holatda qaytadi.

**Kunlik o‘yin kuniga bitta — qurilmadan qat‘i nazar.** Brauzerdagi yozuv
faqat shu brauzerni biladi, telefonda o‘ynalgan o‘yinni esa bilmaydi.
Shuning uchun kirilgan bo‘lsa `daily_results/{sana}_5/entries/{uid}`
tekshiriladi: yozuv bor bo‘lsa taxta yopiladi va natija ko‘rsatiladi
(taxminlar bizda yo‘q, shu sabab taxta emas, natija kartochkasi).

Bu shunchaki qoida emas, himoya ham: yozuv `merge` bilan bitta hujjatga
tushadi, ya‘ni saytdagi ikkinchi o‘yin ilovada olingan yaxshiroq natijani
bosib ketardi. Shu sababli navbatdagi (mehmon holatida o‘ynalgan) natija
ham yozilishidan oldin xuddi shu tekshiruvdan o‘tadi.

### Ma’lumot qayerdan keladi

Lug‘at va kunlik so‘z **ochiq hujjatlar** (`allow read: if true`), shuning
uchun ularni olishda Firebase SDK ishlatilmaydi — `src/firebase/rest.ts`
oddiy REST bilan o‘qiydi. Bu muhim: SDK ~100 KB, sahifaning asosiy vazifasi
esa tanishtirish. SDK faqat foydalanuvchi kirganda yoki natija cloud’ga
yozilganda `import()` bilan tortiladi.

`dictionaries/uz_5` siqilgan holda ~74 KB va `localStorage` da saqlanadi,
shuning uchun ikkinchi tashrifda o‘yin darhol boshlanadi. Versiya
`dictionaries/manifest` bilan fon rejimida tekshiriladi: yangisi bo‘lsa
keshga yoziladi va **keyingi** o‘yindan qo‘llanadi (so‘z o‘yin o‘rtasida
almashmasligi kerak).

Kunlik so‘z avval `daily/{sana}_5` dan olinadi; u bo‘lmasa ilovadagi
deterministik tanlov (`src/lib/daily.ts` — `DailyWordSelector` ning porti)
ishlaydi. Ikki yo‘l ham bir xil natija berishi shart, aks holda kunlik
reyting bo‘linib ketadi.

### Reyting va statistika

`/oyin` yonidagi ustunda ikki jadval bor va ikkisi ham **ochiq
hujjatlardan** o‘qiladi, ya’ni ularni ko‘rish uchun kirish shart emas va
SDK yuklanmaydi:

| Jadval | Manba |
| --- | --- |
| Kunlik | `daily_results/{sana}_5/entries`, `points desc` |
| Umumiy | `scores`, `totalScore desc` |

Saralash bitta maydon bo‘yicha — qo‘shimcha indeks kerak emas, ilova ham
xuddi shunday qiladi. Statistika paneli esa brauzerdagi ma’lumotdan
tuziladi: g‘alaba foizi, ketma-ketlik va urinishlar taqsimoti.

## Hisob

Uch yo‘l: **mehmon** (anonim hisob), **yangi hisob** (email + parol) va
**kirish**. Mehmon sifatida o‘ynagan odam keyin email qo‘shsa, hisob
*bog‘lanadi* (`linkWithCredential`) — uid o‘zgarmaydi, ya’ni yig‘ilgan ball
va streak joyida qoladi.

Ilovadan bitta farqi bor va u ataylab: **sayt hech kimni avtomatik anonim
hisobga kirgizmaydi**. Aks holda har bir tashrif Firebase’da yangi
foydalanuvchi yasab, admin paneldagi statistikani buzardi. Kirmasdan ham
o‘ynash mumkin — natija shunda brauzerda qoladi va `sozgir.pending` navbatiga
tushadi; keyin kirilganda o‘zi cloud’ga yoziladi.

Taxallus tekshiruvi (`src/lib/nickname.ts`) ilovaning `nickname_filter.dart`
ko‘chirmasi va Firestore qoidalaridagi ro‘yxat bilan bir xil — mos kelmasa
yozuv **serverda** rad etiladi.

### Nima yoziladi

Yo‘llar ilova bilan bir xil (`src/firebase/paths.ts`):

```
users/{uid}                                  profil (nickname, email, platform: web)
users/{uid}/stats/{mode}_{length}            statistika nusxasi
users/{uid}/found_words/{so'z}               topilgan so'zlar
scores/{uid}                                 umumiy ball — umumiy reyting shundan
daily_results/{sana}_{n}/entries/{uid}       kunlik reyting
```

Muhim tartib: natija yozilishidan **oldin** cloud’dagi statistika brauzerga
tiklanadi (`ensureRestored`) va faqat cloud oldinda bo‘lganda qabul qilinadi.
Aks holda telefonda 40 kun yig‘ilgan streak sayt yozgan «1» bilan almashib
ketardi.

## So‘zjang

`/sozjang` — ilovadagi bellashuv rejimi. Ikki yo‘l:

| Rejim | Qanday ishlaydi |
| --- | --- |
| **Do‘st bilan** | Chaqiruv yaratiladi, 6 belgili kod va havola chiqadi. Do‘st kod bilan qo‘shiladi (yoki havolani bosadi — `?kod=` o‘zi qo‘shadi). |
| **Tezkor jang** | Navbatga turiladi, server reytingi yaqin raqibni topadi. Navbatda turganda so‘rov har 10 soniyada takrorlanadi — ikki odam bir vaqtda qidirsa, bir-birini ko‘rmay qolmasin. |

Ikkalasi ham **hisob talab qiladi**: raqib taxallusni ko‘radi va natija
reytingga yoziladi.

Butun mantiq **Cloud Functions**da (`europe-west1`), ilova ishlatadigan
funksiyalarning aynan o‘zi: `battleCreate`, `battleJoin`, `battleQuick`,
`battleGuess`, `battleForfeit`. Javob so‘zi mijozga hech qachon
yuborilmaydi — taxminni server tekshiradi va faqat ranglar qatorini
(`srryy`) qaytaradi. Shu sabab saytda yaratilgan chaqiruvga telefondan
qo‘shilish mumkin va aksincha.

Raqibning kataklarida harflar yo‘q: rang naqshi u qancha yaqinlashganini
bildiradi, javobni esa oshkor qilmaydi. Jang tugagach server ikki tomonning
so‘zlarini va javobni ochadi — natija ekranida yo‘llar solishtiriladi.

O‘qish uchun `onSnapshot` kerak (raqibning qatori darhol ko‘rinishi kerak),
u esa `firestore/lite` da yo‘q — shuning uchun bu sahifa to‘liq Firestore
SDK sini alohida chunk sifatida yuklaydi. Qolgan sahifalar yengil variantda
qoladi.

Boshlangan jang brauzerda eslab qolinadi (`sozgir.battle`), o‘z
taxminlarim ham (`sozgir.battle.words.{id}`) — server ularni jang
tugamaguncha yashiradi, shuning uchun sahifa yangilanganda harflar
brauzerdan tiklanadi.

### Lokal sinash

Funksiyalar faqat prodga joylashtirilgan, ya‘ni jangni sinash uchun
prodda hisob ochib real yozuv qoldirish kerak bo‘lardi. Emulyator shu
ehtiyojni yopadi:

```bash
cd ../soztop/functions && npm ci && npm run build
cd ../soztop && firebase emulators:start --only auth,functions,firestore \
  --project soztop-dev
```

Emulyator Firestore‘iga `dictionaries/uz_5` ni yozib qo‘yish kerak
(funksiya so‘zni shundan oladi), so‘ng:

```bash
VITE_EMULATOR=1 npm run dev
```

`src/firebase/config.ts` dagi `projectId` emulyator loyihasi bilan mos
bo‘lishi shart. Ishlab chiqarish paketida emulyator shoxi butunlay yo‘q —
`import.meta.env.DEV` uni olib tashlaydi.

## Firebase sozlamalari

`src/firebase/config.ts` — prod muhitining ochiq web konfiguratsiyasi
(mijozda ochiq bo‘lishi normal). Firebase konsolida ikki narsa yoqilgan
bo‘lishi kerak:

* **Authentication → Sign-in method**: Anonymous va Email/Password;
* **Authentication → Settings → Authorized domains**: `sozgir.uz`
  (parolni tiklash havolasi shu domenga ishlaydi).

Hozir `appId` admin panel bilan bir xil web ilova. Landing uchun alohida
ilova ochilsa, faqat shu fayl yangilanadi.

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
    GamePage.tsx  `/oyin` sahifasi: taxta + statistika + reyting
    BattlePage.tsx  `/sozjang`: chaqiruv, tezkor jang va jangning o‘zi
    OpponentBoard.tsx  raqib yo‘li — faqat ranglar
    Play.tsx      o‘yin bo‘limi: rejim, natija, qisqa statistika
    Board.tsx     taxta va o‘zbek klaviaturasi
    StatsPanel.tsx  statistika va urinishlar taqsimoti
    Leaderboard.tsx kunlik va umumiy reyting
    Account.tsx   hisob tugmasi va kirish oynasi
  data/
    site.ts     barcha matn va havolalar — dizaynga tegmasdan tahrirlash uchun
    privacy.ts  maxfiylik siyosati matni (uz + en)
  firebase/
    config.ts   prod muhitining web konfiguratsiyasi
    paths.ts    Firestore yo‘llari — ilova bilan bir xil
    rest.ts     ochiq hujjatlarni SDK’siz o‘qish
    client.ts   SDK’ni kechiktirib yuklash (app + auth + firestore/lite)
    profile.ts  `users/{uid}` hujjati
    errors.ts   auth xato kodlari → o‘zbekcha matn
  lib/
    uz.ts       alifbo, normalize/split, Wordle baholash
    modes.ts    rejim, uzunliklar, urinishlar soni
    daily.ts    kunlik raqam, sana kaliti va deterministik so‘z tanlovi
    dictionary.ts  lug‘at (REST + localStorage kesh + versiya tekshiruvi)
    score.ts    ball formulasi (ScoreCalculator porti)
    progress.ts statistika, topilgan so‘zlar, cloud yozuv va tiklash
    nickname.ts taxallus filtri (nickname_filter.dart porti)
    leaderboard.ts  kunlik va umumiy reyting jadvallari
    battle.ts   So‘zjang chaqiruvlari va turlari
    useSozjang.ts  So‘zjang holati (chaqiruv, navbat, jang)
    auth.tsx    hisob holati va amallari
    useGameChoice.ts  rejim va uzunlik tanlovi
    useSozTop.ts  o‘yin holati (kunlik + cheksiz)
    useReveal.ts  scroll animatsiyasi va mavzu almashtirish
    useRoute.ts   kichik router (`/`, `/oyin`, `/sozjang`, `/privacy`, `/contact`)
  styles/
    theme.css   dizayn tokenlari (yorug‘ + tungi)
    landing.css bo‘lim uslublari
    play.css    hisob oynasi, o‘yin bo‘limlari va `/oyin`, `/sozjang`
```

### Brauzerda saqlanadigan kalitlar

| Kalit | Nima |
| --- | --- |
| `sozgir.theme` | mavzu tanlovi (admin panel bilan bir xil) |
| `sozgir.session` | oldingi tashrifda kirilganmi (SDK’ni darhol yuklash uchun) |
| `sozgir.nickname` | ko‘rinadigan nom |
| `sozgir.dict.{4..7}` | lug‘at keshi |
| `sozgir.game.{mode}.{length}` | boshlangan o‘yin |
| `sozgir.stats.{mode}.{length}` | statistika |
| `sozgir.found` | topilgan so‘zlar va ballari |
| `sozgir.endless.{length}` | cheksiz rejim o‘yin raqami |
| `sozgir.pending` | kirilmagan holda o‘ynalgan, hali yozilmagan natijalar |
| `sozgir.length` | cheksiz rejimdagi so‘z uzunligi |
| `sozgir.battle` | boshlangan jang |
| `sozgir.battle.words.{id}` | o‘sha jangdagi taxminlarim |
| `sozgir.battle.length` | So‘zjangdagi so‘z uzunligi |

Store havolalari `src/data/site.ts` dagi `links.appStore` va
`links.playStore` da — to‘ldirilgani tugma bo‘lib chiqadi, bo‘shi «Tez
orada» holatida qoladi. App Store havolasi joy (storefront) ko‘rsatilmasdan
beriladi (`apps.apple.com/app/id…`): Apple uni foydalanuvchining hisobiga
qarab o‘zi tanlaydi, `/us/` bilan esa o‘zbek foydalanuvchi Amerika
do‘koniga tushib qolardi.

Natija ulashilganda havola `links.share` — ya‘ni `/oyin`. Ulashilgan
natijani bosgan odam tanishtiruv sahifasiga emas, o‘yinning o‘ziga
tushishi kerak.

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

Vite · React 19 · TypeScript · Firebase (auth + firestore/lite, kechiktirib
yuklanadi) · oxlint. CSS freymvorki yo‘q — faqat CSS o‘zgaruvchilari.
