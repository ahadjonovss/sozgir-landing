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
| Yuklab olish | App Store va Google Play havolalari |

Alohida sahifalar: `/oynash` (nimani o‘ynashni tanlash — sarlavhadagi
«O‘ynash» tugmasi shu yerga olib keladi), `/oyin` (So‘ztop), `/sozjang`
(bellashuv), `/oyinchi/{uid}` (o‘yinchining ochiq profili), `/privacy`
(maxfiylik siyosati, o‘zbekcha + inglizcha) va `/contact` (aloqa
ma’lumotlari + so‘rov formasi).

React ilovadan tashqarida, `public/` ichida turadigan mustaqil sahifalar:
`/ol` — ulashish uchun yuklab olish havolasi (telefonda qurilmaning
do‘koniga o‘zi yo‘naltiradi, kompyuterda ikkala tugmani ko‘rsatadi;
`?stay=1` bilan yo‘naltirmaydi) va `/donat` — to‘lovdan qaytish sahifasi.
Ular serverdan to‘g‘ridan-to‘g‘ri keladi, shuning uchun `useRoute` bilmagan
manzilni ushlamaydi — bosilganda brauzerning o‘zi ochadi.

`/ol` ning har tarmoq uchun alohida manzili bor — pastdagi
«Ulashish havolalari» bo‘limiga qaraldi.

## O‘yin

O‘yin ikki joyda ko‘rinadi va ikkisi bitta `Play` komponentini ishlatadi:

* **hero** — yangi mehmonni ushlab qolish uchun, telefon ramkasi ichida;
* **`/oyin`** — qaytib keladiganlar uchun barqaror manzil: taxta,
  statistika va reyting bir joyda, tanishtiruv bloklarini aylanib
  o‘tirmasdan.

Holat brauzerda bir joyda saqlanadi, ya’ni hero’da boshlangan o‘yin `/oyin`
da davom etadi va aksincha. Rejim tanlovi `useGameChoice` da — taxta va
uning yonidagi statistika paneli bir xil rejimni ko‘rsatishi kerak.

Sarlavhadagi «O‘ynash» tugmasi har doim ko‘rinadi va `/oynash` ni ochadi —
u yerda odam So‘ztop yoki So‘zjangni tanlaydi (ilgari So‘zjang sarlavhada
alohida turardi, So‘ztopga esa yo‘l ko‘rinmasdi). Bo‘limlar ro‘yxati tor
ekranda (≤980px) menyu tugmasi ostiga yig‘iladi. Juda tor ekranda (≤520px) sarlavhadan hisob
tugmasi ham ketadi — u menyuning ichida bor.

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
xuddi shunday qiladi. Ikkala jadvalda ham faqat birinchi **10** o‘rin
ko‘rsatiladi. Statistika paneli esa brauzerdagi ma’lumotdan
tuziladi: g‘alaba foizi, ketma-ketlik va urinishlar taqsimoti.

## Yordam (maslahat)

Cheksiz rejimda ilovadagi qoida: o‘ylash cho‘zilganda yordam o‘zi paydo
bo‘ladi (`src/lib/useHint.ts`, ilovadagi `hintLevel` porti). So‘z
uzunligiga qarab 15·(n−1) soniyadan keyin **mavzu** (kategoriya), undan
ikki barobar keyin **ma’no** ochiladi; undan oldin taxta tepasida qancha
qolgani sanab turiladi. Mavzu nomi `categories/{id}` dan faqat `name` va
`emoji` maydonlari bilan olinadi (REST `mask.fieldPaths`) va brauzerda
keshlanadi. Kunlik o‘yinda yordam yo‘q.

So‘zjangda maslahatni server beradi (`battleGuess`): harflarning 60 % i
o‘z joyida topilgach bitta ochilmagan harf qaytariladi va u keyingi
qatorga qulflanib tushadi; raqib «maslahat oldi» degan belgini ko‘radi,
harfni esa bilmaydi.

## O‘yinchi profili

`/oyinchi/{uid}` — ilovadagi `PublicProfilePage` ning veb ko‘rinishi
(`src/components/PlayerPage.tsx`, `src/lib/publicProfile.ts`). Reyting
qatori, jang natijasidagi raqib ismi va donatchilar ro‘yxati shu sahifaga
olib boradi; hisob oynasida «Ochiq profilim» havolasi bor. Router uchun bu
yagona parametrli manzil: `useRoute` uni `/oyinchi` deb biladi,
identifikator `routeParam()` bilan olinadi.

Faqat **ochiq** ma’lumot yig‘iladi — qoidalar begona odam haqida shuni
beradi: `scores/{uid}` (umumiy ball, topilgan so‘zlar), `battle_ratings/
{uid}` (bellashuv reytingi; jang o‘ynamagan bo‘lsa 1000 ball
ko‘rsatilmaydi), bugungi `daily_results/{sana}_5/entries/{uid}` va
`donations` (`uid` bo‘yicha). Shaxsiy statistika (`users/{uid}`) o‘qilmaydi,
shu sabab ketma-ketlik va urinishlar taqsimoti yo‘q — sahifa buni
yozib qo‘yadi.

Hammasi SDK’siz, REST bilan: uch hujjat bitta `batchGet` da, jadvaldagi
o‘rin `runAggregationQuery` (`count`, `field > value` — ilovadagi `_rank`
bilan bir xil), donatlar `runQuery`. Manbalarning biri xato bersa qolgani
qaytadi — sahifa yarim ma’lumot bilan ham ochiladi. «So‘zjangga chaqirish»
sarlavhaning ostida (`profile` turi, pastdagi «Manzilli chaqiruvlar»).

## Homiylik darajalari

Donat qilgan o‘yinchi ajralib turadi (`src/lib/donor.ts`): avatar atrofida
daraja rangidagi halqa (hamma avatar `Avatar.tsx` orqali chiqadi, shuning
uchun reyting, arena, profil — hamma joyda), reyting kartochkasida daraja
chipi va kartochkaning o‘zi daraja ohangida (`rating--donor`), profil
sarlavhasida chip. Darajalar umumiy summadan: **5 000** — Homiy (bronza),
**25 000** — Oltin homiy, **100 000** — Platina (kartochka ustidan
yaltirash o‘tadi). Chegaralar `DONOR_TIERS` da, hozirgi donatlarga qarab
qo‘yilgan.

Manba — `donations` (ochiq kolleksiya): bitta REST so‘rovda 300 tagacha
yozuv olinib `uid` bo‘yicha yig‘iladi, xotirada va brauzer keshida
(`sozgir.donors`, bir soat) turadi; har avatar do‘kondan so‘raydi,
alohida so‘rov yubormaydi. Hisobsiz donat (`uid` yo‘q) sanalmaydi. Ilovada
hozircha bunday ko‘rinish yo‘q — ko‘chirilsa, yig‘indini serverda
(`onDonationWrite` → `scores/{uid}.donated`) yozib qo‘ygan ma’qul, shunda
ikkalasi bitta maydondan o‘qiydi.

## Telefon

O‘yin sahifalari telefonda o‘ynash uchun moslangan (`play.css` oxiridagi
«Telefon» bo‘limi): `/sozjang` lobbisida tanlov kartochkalari birinchi
turadi (ilgari «Raqib qidirish» sarlavha va namoyishdan keyin, ≈1100px
pastda edi), klaviatura kartochka chetigacha yoyilib tugmalar 48 px
balandlikda, tugmalarda `touch-action: manipulation` (ikki bosishda
kattalashtirish kutilmaydi). Taxta kataklari suyuq (`flex` +
`aspect-ratio`), shuning uchun tor ekranda o‘zi kichrayadi.

## So‘z haqida xabar berish

Natija ostidagi «So‘z haqida xabar berish» — ilovadagi `ReportWordSheet`
ning veb ko‘rinishi (`src/components/ReportWord.tsx`, `src/lib/report.ts`).
Murojaat `word_reports/{id}` ga ilova bilan bir xil maydonlar bilan
yoziladi (`word`, `length`, `reason`, `comment`, `mode`, `uid`,
`nickname`, `status: pending`, `createdAt`) va admin panelida
moderatsiyaga tushadi. Sabab kalitlari ilovadagi `WordReportReason.name`
bilan bir xil. Qoidalar `uid` talab qiladi — mehmonga avval kirish
taklif qilinadi. So‘ztop natijasida ham, So‘zjang natijasida ham bor.

## Hisob

Uch yo‘l: **mehmon** (anonim hisob), **yangi hisob** (email + parol) va
**kirish**. Mehmon sifatida o‘ynagan odam keyin email qo‘shsa, hisob
*bog‘lanadi* (`linkWithCredential`) — uid o‘zgarmaydi, ya’ni yig‘ilgan ball
va streak joyida qoladi.

Ilovadan bitta farqi bor va u ataylab: **sayt hech kimni avtomatik anonim
hisobga kirgizmaydi**. Aks holda har bir tashrif Firebase’da yangi
foydalanuvchi yasab, admin paneldagi statistikani buzardi. Kirmasdan ham
o‘ynash mumkin — natija shunda brauzerda qoladi va `sozgir.pending` navbatiga
tushadi; keyin kirilganda o‘zi cloud’ga yoziladi. Lekin chegara bor:
mehmon shu brauzerda **5** ta o‘yin o‘ynagach (`GUEST_GAME_LIMIT`,
barcha rejim va uzunliklar bo‘yicha `played` yig‘indisi) taxta yopiladi va
«Iltimos, kiring» oynasi chiqadi — kirilgunicha keyingi o‘yin boshlanmaydi.

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

`/sozjang` — ilovadagi bellashuv rejimi. Lobbi bitta asosiy tugma
(«Raqib qidirish»), ostida do‘st bilan o‘ynash qatori (kod yaratish yoki
kod bilan qo‘shilish), o‘z reytingi kartochkasi va yig‘ilgan «Qoidalar»;
yonida **So‘zjang reytingi** jadvali (`BattleBoard.tsx`, `battle_ratings`
bo‘yicha eng yaxshi o‘nlik, robotlar chiqarilgan, qatordan profil va
chaqiruv). Ilgari bu yerda katta sarlavha, ikki taxtali namoyish, ikkita
kartochka, «faktlar» va to‘rt «qadam» turardi — «O‘ynash» → «Jangga
kirish» deb kelgan odamga yana bir tanishtiruv emas, tugma kerak.
Kirmagan odamga bir jumla va ikki tugma, jadval yonida qolaveradi.

Ikki yo‘l:

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
so‘zlarini va javobni ochadi — natija ekranida yo‘llar solishtiriladi va
natijani ulashish mumkin (ranglar bilan, harflarsiz).

Taxta ilovadagidek ishlaydi: qabul qilingan qator kataklari navbat bilan
ag‘dariladi, oldingi taxminda joyi topilgan harflar keyingi qatorga o‘zi
tushadi va o‘chirilmaydi (`autoFill` — ilovadagi `_autoFilledInput`).
Yozilgan harf birinchi bo‘sh katakka tushadi, qulflanganlar o‘tkazib
yuboriladi.

O‘qish uchun `onSnapshot` kerak (raqibning qatori darhol ko‘rinishi kerak),
u esa `firestore/lite` da yo‘q — shuning uchun bu sahifa to‘liq Firestore
SDK sini alohida chunk sifatida yuklaydi. Qolgan sahifalar yengil variantda
qoladi.

Natijadagi «Yangi raqib qidirish» tezkor jangdan keyin darrov navbatga
qo‘yadi (lobbiga qaytilmaydi); do‘st bilan jangdan keyin «Yangi jang»
lobbini ochadi. Navbat yozuvi kuzatuvida keshdagi holat tashlab
yuboriladi (`watchDoc(..., { skipCache })`): SDK yangi tinglovchiga avval
xotiradagi eski nusxani beradi, unda esa o‘tgan jangning `matchId` si
turadi — aks holda «Raqib qidirish» bosilganda o‘tgan jang natijasi
qayta ochilardi.

Jang ketayotganda «Jangdan chiqish» avval tasdiq so‘raydi (ilovadagi
`ConfirmSheet` kabi: «Jang hali tugamagan. Chiqsangiz bu mag‘lubiyat
sifatida yoziladi» → «Mag‘lub bo‘lib chiqish» / «Qolish»). O‘zi tugatib
raqibni kutayotgan odam so‘roqsiz chiqadi — bu taslim emas.

Boshlangan jang brauzerda eslab qolinadi (`sozgir.battle`), o‘z
taxminlarim ham (`sozgir.battle.words.{id}`) — server ularni jang
tugamaguncha yashiradi, shuning uchun sahifa yangilanganda harflar
brauzerdan tiklanadi.

### Arena

Kutish va 3-2-1 ekranlari — ilovadagi `BattleArena` ning porti
(`src/components/Versus.tsx`): maydon diagonal ikki rangga bo‘lingan (siz
— yashil, raqib — ko‘k), o‘rtada romb «VS», raqib kirmaguncha uning
tomoni bo‘sh va avatar atrofida to‘lqin, pastda jang shartlari (harf va
urinish soni). Raqib kirganda o‘sha joy uning rasmi bilan to‘ladi — ekran
almashmaydi. Kutishda ostida ikki daqiqalik «pilik» (`JoinFuse`): muddat
jang hujjatidagi `expiresAt` dan olinadi, oxirgi 20 soniyada qizaradi.
Shu paytda butun sahifa arena pardasida (`.jang--arena`). Raqib kelmagan
jangda (`expired`) arena so‘lg‘un, o‘ng tomonda «Kelmadi».

### Manzilli chaqiruvlar

`battle_invites/{id}` — aniq odamga chaqiruv. Mijoz hujjat yaratmaydi:
`battleInvite` funksiyasi yaratadi, `battleInviteAccept` jangni ochadi,
`battleInviteDecline` rad etadi (chaqirganning o‘zi ham shu bilan bekor
qiladi). Uch turi bor va uchalasi bir oqim, farqi faqat manba:
`rematch` (natijadagi «Revansh»), `nearby` (faqat ilovada — yaqin
atrofdagilar) va `profile` (ilovada ochiq profildagi «So‘zjangga
chaqirish»; saytda profil sahifasi yo‘q, shuning uchun tugma reyting
jadvalining har qatorida — `Leaderboard.tsx`). Javobsiz chaqiruv 2
daqiqada eskiradi.

Yuborilgan chaqiruv `SendInvite.tsx` da kutiladi (ilovadagi
`SendInviteSheet`): hujjat kuzatiladi, `accepted` kelsa `battleId` bilan
jang ochiladi va sahifa `/sozjang` ga o‘tadi (`showBattle`), `declined`
va `expired` xabar bo‘lib qoladi. Muddat tugagach oyna o‘zi yakun yasaydi
— serverdagi `expired` belgisi daqiqada bir marta qo‘yiladi, undan
kutilsa oyna bir daqiqagacha osilib turardi; lekin 8 soniya imtiyoz bor:
raqib oxirgi soniyada qabul qilgan bo‘lishi mumkin.

Kelgan chaqiruv istalgan sahifada pastdan chiqadi (`InviteOverlay.tsx`),
manbasi yozuvda ko‘rinadi: «revansh», «yaqin atrofdan», «profil orqali».

Taxallus o‘zgarganda `battle_ratings/{uid}.nickname` ham yangilanadi
(`patchBattleNickname`, ilovadagi bilan bir xil): hujjatni server jang
yakunida yozadi va u paytdagi nomni qo‘yadi — aks holda odam kunlik
jadvalda o‘z ismi bilan, So‘zjangda esa eski nom (ko‘pincha «Mehmon»)
bilan turib qolardi.

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
  ol.ts         ulashish havolasi ochilganini qayd qiluvchi Edge Function
src/
  components/   bo‘limlar (Hero, Rules, Alphabet, Modules, …)
    Header.tsx    sarlavha: bo‘limlar, mavzu, hisob, «O‘ynash», telefon menyusi
    Footer.tsx    ko‘p ustunli footer
    GamePage.tsx  `/oyin` sahifasi: taxta + statistika + reyting
    PlayHub.tsx   `/oynash`: So‘ztop yoki So‘zjang tanlovi
    BattlePage.tsx  `/sozjang`: chaqiruv, tezkor jang va jangning o‘zi
    BattleStats.tsx  So‘zjang reytingi kartochkasi (ilovadagi RatingCard)
    BattleBoard.tsx  So‘zjang reytingi jadvali (battle_ratings, robotlarsiz)
    Versus.tsx    arena afishasi: kutish, 3-2-1 va «kelmadi» holatlari
    PlayerPage.tsx  `/oyinchi/{uid}`: o‘yinchining ochiq profili
    SendInvite.tsx  yuborilgan chaqiruv (revansh / jadvaldan) — javob kutish oynasi
    InviteOverlay.tsx  kelgan chaqiruv — istalgan sahifada pastdan chiqadi
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
    donor.ts    homiylik darajalari: donatlar yig‘indisi, halqa va chip uchun
    publicProfile.ts  ochiq profil: scores + battle_ratings + kunlik + donatlar
    useSozjang.ts  So‘zjang holati (chaqiruv, navbat, jang)
    auth.tsx    hisob holati va amallari
    useGameChoice.ts  rejim va uzunlik tanlovi
    useSozTop.ts  o‘yin holati (kunlik + cheksiz)
    useReveal.ts  scroll animatsiyasi va mavzu almashtirish
    useRoute.ts   kichik router (`/`, `/oynash`, `/oyin`, `/sozjang`, `/oyinchi/{uid}`, `/qollab`, `/privacy`, `/contact`)
    battleRating.ts  So‘zjang reytingi: darajalar va `battle_ratings/{uid}` kuzatuvi
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

Sayt — tanishtiruv sahifasi, ilovaning nusxasi emas. Bir vaqt u ilovadagidek
yon menyu, AppBar va bosh ekrandagi kartochkalar bilan qurilgan edi;
foydalanuvchilar buni admin panelga o‘xshatdi. Shuning uchun tuzilma oddiy
veb-saytniki: tepada sticky sarlavha (logotip, bo‘limlar, mavzu, hisob,
«O‘ynash»), bosh sahifada haqiqiy o‘yinli hero, kartochkali bo‘limlar,
gradientli «Yuklab olish» bloki va ko‘p ustunli footer. Telefonda bo‘limlar
menyu tugmasi ostidagi to‘liq ekranli ro‘yxatga yig‘iladi.

Ranglar ilovaning `app_palette.dart` faylidan olingan — sayt va ilova bir
palitrada, lekin sayt kengroq bo‘sh joy, kattaroq sarlavha va yumaloq
kartochkalar bilan ajralib turadi. Tungi rejim tanlovi `localStorage` da
`sozgir.theme` kalitida saqlanadi (admin panel bilan bir xil).

Avatar ilovadagi `BattleAvatar` + `AvatarPhoto` bilan bir xil
(`src/components/Avatar.tsx`): profil rasmi bo‘lsa — rasm, bo‘lmasa
taxallusning bosh harfi, rang taxallusdan hisoblanadi (kod birliklari
yig‘indisi mod 6, palitra ilovadagi bilan aynan).

### Profil rasmi

Ilova 1.1.5 sxemasi: rasm **Storage’da emas, Firestore’da** base64 JPEG —
`avatars/{uid}` (64 px `thumb`, ≤ 4000 belgi) va
`avatars/{uid}/sizes/full` (256 px `data`, ≤ 40 000 belgi); o‘qish
hammaga ochiq, yozish egasiga. Saytda rasm brauzerda tayyorlanadi
(`src/lib/avatarImage.ts`: kvadratga kesish, kichraytirish, chegaraga
sig‘guncha sifatni pasaytirish — ilovadagi `AvatarImage` bilan bir xil
sonlar) va SDK bilan ikki hujjatga bitta batch’da yoziladi.

O‘qish `src/lib/avatars.ts` orqali: bir ekrandagi avatarlar 60 ms ichida
yig‘ilib bitta REST `batchGet` so‘roviga tushadi (SDK kerak emas, hujjat
ochiq), natija brauzerda uch kun keshlanadi — «rasmi yo‘q» ham. Profil
oynasida (`AvatarEditor`) rasm qo‘yish, almashtirish va o‘chirish;
telefon brauzeri fayl tanlashda kamerani ham taklif qiladi.

Logotip `public/logo.svg` dan ko‘chirilgan, lekin `Logo.tsx` da `currentColor`
bilan qayta chizilgan — shunda u tungi rejimda ham to‘g‘ri ko‘rinadi.

## Ulashish havolalari

Yuklab olish sahifasi bitta, manzil esa har tarmoq uchun alohida — shunda
qaysi tarmoq qancha odam olib kelgani ko‘rinadi:

| Havola | Manba kaliti | Qayerda ishlatiladi |
| --- | --- | --- |
| `sozgir.uz/ol` | `web` | to‘g‘ridan-to‘g‘ri ulashish, QR, matbuot |
| `sozgir.uz/t/ol` | `telegram` | Telegram kanali va guruhlar |
| `sozgir.uz/x/ol` | `x` | X (Twitter) |
| `sozgir.uz/th/ol` | `threads` | Threads |
| `sozgir.uz/i/ol` | `instagram` | Instagram — profildagi havola |
| `sozgir.uz/tt/ol` | `tiktok` | TikTok |
| `sozgir.uz/y/ol` | `youtube` | YouTube |
| `sozgir.uz/f/ol` | `facebook` | Facebook |

Sahifa **nusxalanmaydi**: hammasi `vercel.json` dagi bitta rewrite bilan
`public/ol/index.html` ga yo‘naltiriladi (`/:channel(t|x|th|i|tt|y|f)/ol`).
Brauzerdagi manzil o‘zgarmaydi, shuning uchun manba `location.pathname`
dan olinadi. Ro‘yxatda yo‘q bo‘lak (`/zz/ol`) `other` bo‘lib qoladi.
`canonical` va `og:url` esa doim `/ol` — ya’ni izlash tizimlari uchun bu
bitta sahifa, tarmoq nusxalari indeksni bo‘lmaydi.

Yangi tarmoq qo‘shish uchun uch joy yangilanadi: `vercel.json` dagi
rewrite, sahifadagi `CHANNELS` xaritasi va `api/ol.ts` dagi `SOURCES`.
Firestore qoidalaridagi `linkSources()` ro‘yxati ham (`soztop/firestore.rules`)
— aks holda yozuv rad etiladi.

### Qayd va statistika

Sahifa ochilganda `/api/ol` ga bitta `sendBeacon` ketadi (javob kutilmaydi,
do‘konga o‘tish kechikmaydi), `api/ol.ts` esa ikki ish qiladi:

1. **Telegram** — alohida mavzuga xabar: manba, sahifa, joy (shahar va
   davlat), qurilma, OS, brauzer, ekran, til, vaqt mintaqasi va
   yo‘naltirgan sayt. Birinchi qator heshteglar: `#ol #telegram #ios #UZ`,
   ya’ni guruhda manba yoki platforma bo‘yicha filtrlash mumkin.
   Ilova ichidagi brauzerlar alohida ajratiladi («Instagram ichida»,
   «Telegram ichida») — bu manbani URL’dan mustaqil tasdiqlaydi.
2. **Firestore** — `link_hits/{manba}_{sana}` hujjatidagi hisoblagich
   bittaga oshadi (`hits` va shu platformaning hisoblagichi). Admin
   panelning **Statistika → Havolalar** bo‘limi shundan o‘qiydi.

Bir tashrifda bir marta sanaladi (`sessionStorage`), preview botlari esa
umuman hisobga olinmaydi. IP yozilmaydi — shahar va davlat yetadi.

Yozuv **hisobsiz** ketadi, shuning uchun himoya qoidalarda: `link_hits`
ga faqat «bitta bosish qo‘shildi» shaklidagi yozuv o‘tadi (maydonlar
ro‘yxati qat’iy, `hits` aynan bittaga oshadi, manba ro‘yxatdan). O‘qish
faqat moderatorda.

Kerakli muhit o‘zgaruvchisi — `TELEGRAM_OL_THREAD` (havolalar mavzusining
raqami). Berilmasa xabar guruhning asosiy oqimiga tushadi; token yoki chat
bo‘lmasa xabar yuborilmaydi, hisoblagich baribir yoziladi.

## Aloqa formasi va Telegram

`/contact` dagi forma `api/contact.ts` (Vercel Edge Function) ga yuboriladi, u
esa xabarni Telegram guruhiga tashlaydi. Xabar formati soztop ilovasidagi
`Reporter` bilan bir xil, shunda ikki oqim bitta guruhda bir ko‘rinishda bo‘ladi.
Saytdan kelgan har bir xabarning birinchi qatori `#web`, ostida yozgan
odamning ismi va emaili — guruhda manbani ajratish va qidirish uchun.

Vercel muhit o‘zgaruvchilari (Project → Settings → Environment Variables):

| Kalit | Nima |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | bot tokeni |
| `TELEGRAM_CHAT_ID` | guruh yoki kanal ID (masalan `-1001234567890`) |
| `TELEGRAM_CONTACT_THREAD` | mavzu (topic) raqami, ixtiyoriy |
| `TELEGRAM_OL_THREAD` | ulashish havolalari uchun mavzu raqami, ixtiyoriy |

Token yoki chat berilmasa funksiya `503` qaytaradi, forma esa foydalanuvchiga
pochta manzilini ko‘rsatadi. Lokalda `npm run dev` bilan faqat sahifalar
ishlaydi — funksiyani sinash uchun `vercel dev` kerak.

## Deploy

Vercel: `vercel.json` tayyor (framework `vite`, chiqish `dist`, SPA uchun
rewrite). Repo ulansa qo‘shimcha sozlash kerak emas.

## Stack

Vite · React 19 · TypeScript · Firebase (auth + firestore/lite, kechiktirib
yuklanadi) · oxlint. CSS freymvorki yo‘q — faqat CSS o‘zgaruvchilari.
