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
| Hero | Haqiqiy So‘ztop **birinchi ekranda**: kunlik va cheksiz rejim, hisob, aqcha |
| So‘zjang | Do‘st bilan (kod orqali) va tezkor jang, reaksiyalar — `/sozjang` |
| G‘uncha | Yettita harfdan so‘z yig‘ish: kunlik va mashq — `/guncha` |
| G‘uncha jangi | Bir xil g‘uncha, uch daqiqa, kim ko‘p to‘plasa — `/gunchajang` |
| Qoida | Ikki bosqichli avto-demo, rang legendasi ustiga kursor kelganda ajratiladi |
| Alifbo | Yozilgan so‘zni jonli ravishda harf-kataklarga ajratadi |
| Yozuv | Butun sayt lotin, yangi lotin yoki kirillda — sarlavhadagi `O‘` tugmasi |
| Modullar | So‘ztop, So‘zjang, Yangso‘z, G‘uncha, Reyting, Qo‘llab-quvvatlash |
| Kategoriyalar | 10 mavzu + ilova afzalliklari |
| Savollar | Akkordeon FAQ |
| Yuklab olish | App Store va Google Play havolalari |
| Nishonlar | Yigirmata yutuq belgisi — `/nishonlar` |
| Javoblar | Bugungi so‘z va o‘tgan kunlar arxivi — `/javoblar` |
| Qo‘llanma | Uchta maqola: birinchi so‘z, taktika, qiyin joylar — `/qollanma` |
| Yangiliklar | Saytda va ilovada nima o‘zgardi — `/yangiliklar` |
| Cheksiz | Har uzunlik uchun o‘z sahifasi — `/cheksiz/4-harf` … `/cheksiz/7-harf` |

Alohida sahifalar: `/oynash` (nimani o‘ynashni tanlash — sarlavhadagi
«O‘ynash» tugmasi shu yerga olib keladi), `/oyin` (So‘ztop), `/sozjang`
(bellashuv), `/guncha` (g‘uncha), `/gunchajang` (g‘uncha jangi),
`/cheksiz/{4..7}-harf` (uzunlik bo‘yicha cheksiz rejim), `/javoblar`
(bugungi javob va arxiv), `/qollanma` (+ uchta maqola), `/nishonlar`,
`/yangiliklar`, `/oyinchi/{uid}` (o‘yinchining ochiq profili),
`/privacy` (maxfiylik siyosati, o‘zbekcha + inglizcha) va `/contact`
(aloqa ma’lumotlari + so‘rov formasi).

Bo‘limlarning to‘liq ro‘yxati sarlavhadagi **menyu** tugmasida —
u endi kompyuterda ham ochiladi va saytning xaritasi bo‘lib xizmat
qiladi: o‘yinlar, ko‘rib chiqish (javoblar, qo‘llanma, nishonlar,
yangiliklar) va loyiha.

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
| Bugun | `daily_scores/{sana}/entries`, `points desc` |
| Umumiy | `scores`, `wealth desc` |

«Umumiy» jadvaldagi son — **boylik**: o‘yinlarda yig‘ilgan ball va
o‘lja ustamasi (1 o‘lja = 1,5 aqcha). Maydonni server yozadi
(`onScoreWealth` triggeri), sayt uni faqat o‘qiydi — formula ikki
joyda hisoblansa ertami-kech ajralib ketardi. Eski hujjatda maydon
bo‘lmasa yalang `totalScore` olinadi. Nomi o‘zgarmadi: saytda jamlangan
hisob har doim **aqcha** deb ataladi, «boylik» so‘zi ekranga
chiqmaydi (`docs/aqcha.md`).

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
beradi: `scores/{uid}` (yig‘ilgan aqcha, topilgan so‘zlar), `battle_ratings/
{uid}` (o‘lja; jang o‘ynamagan bo‘lsa 1000
ko‘rsatilmaydi), bugungi `daily_results/{sana}_5/entries/{uid}` va
`donations` (`uid` bo‘yicha). Shaxsiy statistika (`users/{uid}`) o‘qilmaydi,
shu sabab ketma-ketlik va urinishlar taqsimoti yo‘q — sahifa buni
yozib qo‘yadi.

Sahifadagi katta son — boylik (`scores/{uid}.wealth`), o‘rin ham shu
maydon bo‘yicha sanaladi: jadval boshqa, profil boshqa maydonni
saralasa, o‘rinlar bir-biriga to‘g‘ri kelmasdi.

Tasdiqlangan hisobning profili **premium** ko‘rinishda ochiladi
(«Tasdiqlangan hisoblar» bo‘limi) va unda «So‘zjangga chaqirish» tugmasi
umuman chizilmaydi.

Hammasi SDK’siz, REST bilan: uch hujjat bitta `batchGet` da, jadvaldagi
o‘rin `runAggregationQuery` (`count`, `field > value` — ilovadagi `_rank`
bilan bir xil), donatlar `runQuery`. Manbalarning biri xato bersa qolgani
qaytadi — sahifa yarim ma’lumot bilan ham ochiladi. «So‘zjangga chaqirish»
sarlavhaning ostida (`profile` turi, pastdagi «Manzilli chaqiruvlar»).

## Qo‘llab-quvvatlash sahifasi

`/qollab` — `SupportPage.tsx`: bosh sahifadagi qisqa bo‘limdan (`Support.tsx`,
hisob + tugma + oxirgilari) farqli to‘liq sahifa. Chapda **hissa qo‘shish
shakli** sahifaning o‘zida (oyna emas — sahifaga shuning uchun kelingan):
tayyor summalar homiylik darajalarining chegaralari, tanlanganda «shu
hissa bilan qaysi daraja bo‘lasiz» ko‘rinadi (kirgan odamda joriy
yig‘indi bilan); ostida darajalar ro‘yxati. O‘ngda loyiha hisobi, **top
donatchilar** (`loadTopDonors` — `uid` bo‘yicha, hisobsizlari ism bo‘yicha
yig‘iladi, profil havolasi bilan) va oxirgilari. Kirgan odam tepada o‘z
hissasini, darajasini va keyingisigacha qolgan summani ko‘radi
(`useDonorTotal`, `donorProgress`). To‘lovga o‘tishda yig‘indi keshi
tashlanadi (`forgetDonorTotals`) — qaytib kelganda yangi daraja chiqsin.

## Homiylik darajalari

Donat qilgan o‘yinchi ajralib turadi (`src/lib/donor.ts`): avatar atrofida
daraja rangidagi halqa (hamma avatar `Avatar.tsx` orqali chiqadi, shuning
uchun reyting, arena, profil — hamma joyda), reyting kartochkasida daraja
chipi va kartochkaning o‘zi daraja ohangida (`rating--donor`), profil
sarlavhasida chip. Darajalar umumiy summadan: **5 000** — «Saxovatpesha»
(bronza), **25 000** — «Eski boylardan» (oltin), **100 000** — «Boylarni
boyi» (platina, kartochka ustidan yaltirash o‘tadi). Chegaralar `DONOR_TIERS` da, hozirgi donatlarga qarab
qo‘yilgan.

Manba — `donations` (ochiq kolleksiya): bitta REST so‘rovda 300 tagacha
yozuv olinib `uid` bo‘yicha yig‘iladi, xotirada va brauzer keshida
(`sozgir.donors`, bir soat) turadi; har avatar do‘kondan so‘raydi,
alohida so‘rov yubormaydi. Hisobsiz donat (`uid` yo‘q) sanalmaydi. Ilovada
hozircha bunday ko‘rinish yo‘q — ko‘chirilsa, yig‘indini serverda
(`onDonationWrite` → `scores/{uid}.donated`) yozib qo‘ygan ma’qul, shunda
ikkalasi bitta maydondan o‘qiydi.

## Reklama

Ilovadagi `lib/core/ads/` ning veb muqobili: `src/lib/ads.ts` (sozlama,
o‘chirish kaliti, Yandex skripti) va `src/components/AdBanner.tsx`
(ramka va bosqichlar). Tarmoq bitta — **Yandex Advertising Network**;
ilovadagi kaskadning ikkinchi bo‘g‘ini (AdMob) bu yerda yo‘q, chunki
AdSense alohida moderatsiya va alohida hisob talab qiladi.

**Bitta tur — banner.** Oraliq oyna, video, pop-up, «sahifa ustidan
chiqadigan» hech narsa yo‘q. Ilovadagi qoida bilan bir xil: o‘yin
jarayoni to‘xtatilmaydi.

### Qayerda turadi

| Joylashuv | Sahifa | Qayerda | Tip |
| --- | --- | --- | --- |
| `hub` | `/oynash` | Kartochkalar va Telegram bannerdan keyin | `edge` |
| `game` | `/oyin` | Yon ustunning eng oxirida | `inline` |
| `guncha` | `/guncha` | Yon ustunning eng oxirida | `inline` |
| `battle` | `/sozjang` | Faqat lobbida, jadval ostida | `inline` |
| `profile` | `/oyinchi/{uid}` | Profil oxirida | `inline` |

Bosh sahifada (`/`) reklama **yo‘q**: u tanishtiruv sahifasi va birinchi
taassurot o‘sha yerda hosil bo‘ladi. O‘yin taxtasi, klaviatura, natija,
so‘zjangning qidiruv va jang ekranlari, kirish oynasi, `/qollab`,
`/privacy` va `/contact` ham reklamasiz.

Blok id‘lari `src/lib/ads.ts` dagi `UNITS` da — oddiy konstanta, chunki
id maxfiy emas (u baribir sahifa kodida ko‘rinadi). **Ilovadagi `R-M-…`
bloklari yaramaydi**: ular mobil ilova uchun, saytga Yandex Partner
interfeysida «Sayt» turidagi alohida bloklar ochiladi. Bo‘sh
qoldirilgan joylashuvda banner umuman chizilmaydi va sahifa reklama
yo‘qday ko‘rinadi — ya‘ni bloklar ochilgunicha kod hech narsani
buzmaydi. O‘z bloki bo‘lmagan joylashuv `hub` blokidan foydalanadi.

### Nega g‘ashga tegmaydi

* **Ekran sakramaydi.** Joy reklama kelishidan **oldin** band qilinadi:
  talab yuborilishi bilan ramka to‘liq o‘lchamida turadi, faqat
  ko‘rinmaydi (`.ad--live`). Reklama kelganda faqat shaffoflik
  o‘zgaradi (`.ad--on`, 260 ms).
* **Tekshiruvlar oldin, joy keyin.** «Bu odamga ko‘rsatiladimi» degan
  savol komponent o‘rnashishi bilan so‘raladi, joy esa javob «ha»
  bo‘lgandagina band qilinadi — shuning uchun qo‘llagan odam bo‘sh
  joyning paydo bo‘lib yo‘qolishini ko‘rmaydi.
* **So‘ralmagan joyda so‘ralmaydi.** Talab banner ekranga
  yaqinlashgandagina ketadi (`IntersectionObserver`, 400 px) va varaq
  fonda turgan bo‘lsa kutiladi. Reklamagacha surmagan odamning
  brauzeriga Yandex skripti umuman tushmaydi.
* **To‘ldirish bo‘lmasa iz ham qolmaydi.** Reklama kelmasa (yoki
  balandligi nol bo‘lsa) komponent butunlay yo‘qoladi — bo‘sh ramka
  turib qolmaydi. Kutish 8 soniya: Yandex to‘ldirish topolmaganda har
  doim ham xabar bermaydi.
* **Yangilanish taymeri yo‘q.** Ilovada banner har 60 soniyada qayta
  so‘raladi; saytda almashinishni blokning o‘zi (Yandex interfeysidagi
  sozlama) hal qiladi. Qo‘lda qayta chizish ko‘z oldida
  «o‘chib-yonadigan» reklama yasaydi.
* **Yorliq.** Ramka ustida bitta jumla — `AD_LABELS` dan navbatdagisi,
  tasodifiy joydan boshlanadi va banner umri davomida o‘zgarmaydi.
  Ichida «reklama» so‘zi turishi **shart** (tarmoq reklamani sayt
  kontentidan ajratishni talab qiladi) va hech biri bosishga
  chaqirmaydi — bosishga undash hisobni bloklatadi.
* **Mavzu bir xil.** `render` ga `darkTheme` uzatiladi
  (`data-theme` dan): tungi saytdagi oq banner ko‘zni qamashtiradi va
  aynan shu bezovta qiladi.
* **Alifbo ko‘chiruvchisi tegmaydi.** Konteynerda `data-script="off"`:
  `scriptDom.ts` butun sahifani kuzatib turadi va shu belgisiz reklama
  matnini ham kirillga o‘girib yuborardi — begona kontentni o‘zgartirish
  tarmoq qoidasini buzadi.

### Kim ko‘rmaydi

Loyihani qo‘llagan odam (`isAdFree`, `src/lib/donor.ts`) — shart
ilovadagi `AdFreePlan` bilan aynan bir xil: oxirgi **7 kunlik**
qo‘llovlar yig‘indisi **5 555 so‘m** ga yetsa, reklama umuman
so‘ralmaydi, Yandex skripti ham yuklanmaydi. Bu obuna emas — eski
qo‘llov oynadan chiqqach rejim o‘zi so‘nadi.

Hisob-kitob `donations` ning o‘sha bitta REST so‘rovidan chiqadi
(homiylik darajalari uchun baribir olinadi), natija `sozgir.donors`
keshida yig‘indi bilan yonma-yon turadi.

Ikkinchisi — **tasdiqlangan hisob** (`isVerifiedAsync`,
`src/lib/verified.ts`): nishon bilan birga reklamasizlik keladi va u
muddatsiz, ro‘yxatdan chiqmaguncha turadi. Ikkala javob ham banner
talabni yuborishdan **oldin** kutiladi, aks holda belgi egasi bir lahza
bo‘lsa ham reklama ko‘rib qolardi.

### O‘chirish kaliti

Ilova bilan **bitta** hujjat — Firestore‘dagi `app/ads`:

```
app/ads
  enabled: true
  web:    { enabled: false }
  yandex: { enabled: true, web: { enabled: false } }
```

`web` bo‘limi saytga tegishli va umumiy kalitning ustidan yoziladi:
moderatsiya yoki nosoz reklama chiqsa saytni ilovaga tegmasdan
o‘chirish mumkin (`ios`/`android` bo‘limlari ilovaniki). Qoida ilovadagi
bilan bir xil — **faqat aniq `false` o‘chiradi**; hujjat yo‘q yoki
Firestore javob bermasa reklama yoqiq qoladi. Sozlama sahifa umrida bir
marta o‘qiladi.

### Dev server

`npm run dev` da haqiqiy reklama **hech qachon** so‘ralmaydi
(`adsSupported`): o‘z reklamangni o‘zing yuklashing yoki bosishing
hisobning bloklanishiga olib keladi. O‘rnida o‘sha o‘lchamdagi sinov
ramkasi turadi, ya‘ni joylashuvni blok ochilmasdan ham ko‘rish mumkin.

### ads.txt

`https://sozgir.uz/ads.txt` — **sayt** uchun sotuvchilar ro‘yxati, unda
faqat Yandex satrlari. Ilovaniki alohida: `/app-ads.txt`, unda Yandex
bilan birga AdMob ham turadi. Ikkalasi ham `vercel.json` dagi SPA
qayta yo‘naltirishidan chiqarib tashlangan — aks holda `/ads.txt` ga
sahifaning HTML‘i qaytardi.

Fayl ikki qismdan iborat: uzun ro‘yxat ilovanikidan ko‘chirilgan
(Yandex‘ning umumiy resellerlari), oxiridagi qisqa bo‘lim esa aynan shu
sayt uchun РСЯ interfeysi bergan ro‘yxat. `yandex.com, 306206921,
DIRECT` ikkalasida ham bitta — sayt ham, ilova ham bir hisobda.
Ortiqcha satr zarar qilmaydi (ads.txt — ruxsat ro‘yxati), yetishmagani
esa daromadni yo‘qotadi. Yandex ro‘yxatni vaqti-vaqti bilan
yangilaydi, shuning uchun uni interfeysdagi bilan solishtirib turish
kerak.

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

Uch yo‘l: **mehmon** (anonim hisob), **yangi hisob** (email yoki telefon
raqam + parol) va **kirish**. Mehmon sifatida o‘ynagan odam keyin email qo‘shsa, hisob
*bog‘lanadi* (`linkWithCredential`) — uid o‘zgarmaydi, ya’ni yig‘ilgan aqcha
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

### Telefon raqam bilan kirish

Kirish maydoniga email ham, telefon raqam ham yozish mumkin: raqam
jimgina `<raqam>@gmail.com` ko‘rinishiga o‘giriladi
(`src/lib/loginId.ts`, ilovadagi `LoginIdentifier` ko‘chirmasi). Firebase
uchun bu o‘sha email provayderi — alohida telefon provayderi ham, SMS
kodi ham kerak emas.

Qoida ilova bilan **belgima-belgi** bir xil bo‘lishi shart: telefonda
raqam bilan ro‘yxatdan o‘tgan odam saytga ham o‘sha raqam bilan kirishi
kerak. Kanonik shakl ham shuning uchun — `+998 90 123 45 67`,
`998901234567` va `90-123-45-67` ayni bir hisobga tushadi.

Bitta farq bor: **parolni tiklash** faqat email bilan ishlaydi. Raqamdan
yasalgan manzil odamning o‘z pochtasi bo‘lmasligi mumkin, shuning uchun
maydonda raqam turganda tiklash so‘ralmaydi.

Ro‘yxatdan o‘tishda **tug‘ilgan sana va jins** ham so‘raladi (ilovadagi
`ProfileDetails`): ular sozlama emas, hisobga tegishli va `users/{uid}`
da turadi — odam boshqa qurilmadan kirsa qayta so‘ralmaydi. Eski hisoblar
ularni profil oynasida to‘ldiradi. Sana `YYYY-MM-DD` satri bo‘lib
yoziladi: har qanday vaqt zonasida bir xil o‘qiladi.

### Nima yoziladi

Yo‘llar ilova bilan bir xil (`src/firebase/paths.ts`):

```
users/{uid}                                  profil (nickname, email, birthDate, gender, platform: web)
users/{uid}/stats/{mode}_{length}            statistika nusxasi
users/{uid}/found_words/{so'z}               topilgan so'zlar
scores/{uid}                                 hisob kitobi (tiyinda) — `games`, `totalScore`, `onlineScore`
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

Taslimdan keyin **natija ekrani ochiladi**, lobbi emas (ilovadagi
`_forfeit`): taslim bo‘lganning natijasi allaqachon ma’lum — u
yutqazdi. Noma’lumi faqat raqibniki va uni bilish uchun jangda o‘tirish
shart emas — natija janglar tarixida chiqadi. Shuning uchun ekran
hujjatdan emas, `forfeited` bayrog‘idan o‘qiydi: jang hujjati hali
yopilmagan (uni raqib tugatganda server yopadi), ya’ni `winnerUid` ham,
javob so‘zi ham yo‘q. Raqib kartochkasida «o‘ynayapti» turadi,
«topa olmadi» emas — u hali topishi mumkin; javob so‘zining o‘rnida esa
sabab yoziladi, aks holda ekran chala chizilgandek ko‘rinardi. Revansh
tugmasi **o‘chiq**: chaqiruv raqibning hali ketayotgan jangi ustidan
tushardi — raqib tugatgach u o‘zi yonadi va javob so‘zi ham joyiga
tushadi (ekran kuzatuvda qoladi).

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

## G‘uncha

`/guncha` — ilovadagi **G‘uncha** modulining veb ko‘rinishi. Ekranda gul
shaklida yettita harf turadi: o‘rtada **yurak harf**, atrofida oltita
barg. Vazifa — shu harflardan iloji boricha ko‘p so‘z yasash.

Qoidalar ilovadagi bilan aynan bir xil (`docs/guncha.md`):

1. so‘z kamida **4 harfdan** (`sh`, `ch`, `oʻ`, `gʻ` — bitta harf);
2. **yurak harf** har bir so‘zda qatnashsin;
3. faqat g‘unchadagi harflar, lekin har biri necha marta bo‘lsa ham;
4. so‘z lug‘atning **javob so‘zlari** ro‘yxatida bo‘lsin;
5. urinishlar cheklanmagan — xato so‘z uchun jarima yo‘q.

Ball: 4 harfli so‘z — 1, undan uzuni o‘z uzunligicha, yettala harf
ishlatilgan so‘z (**pangramma**) — qo‘shimcha 7. Daraja esa
**hisobning ulushi** bo‘yicha beriladi (Urug‘ → … → Bog‘bon → Mukammal),
ya’ni og‘ir g‘unchada ham, yengilida ham bir xil mehnat talab qiladi.

| Rejim | Qayerdan keladi |
| --- | --- |
| Kunlik | Harflarni **server** beradi: `guncha/{sana}` hujjati |
| Mashq | Butunlay brauzerda yasaladi, raqami brauzerda saqlanadi |

Kunlik g‘unchani nega server tanlaydi: lug‘at yangilanganda tanlov
natijasi ham o‘zgaradi, «kunlik» esa hamma uchun bir xil bo‘lishi kerak —
kunlik so‘zdagi bilan bir xil sabab. Hujjat ochiq (`allow read: if true`),
shuning uchun REST bilan o‘qiladi va brauzerda saqlanadi: aloqa uzilsa
ham o‘sha kunning g‘unchasi ochilaveradi.

Hujjatda **faqat harflar** bo‘ladi, so‘zlar ro‘yxati emas: so‘zlarni sayt
o‘zining lug‘atidan yig‘adi (`uz_4`…`uz_7` ning javob so‘zlari), shuning
uchun har topilgan so‘zning ma’nosi ham joyida turadi — modulning
o‘rgatuvchi qismi shu.

Tanlov algoritmi `src/lib/guncha.ts` da: u ilovadagi `GunchaLexicon` va
`GunchaBuilder` ning, ya’ni `functions/src/guncha.ts` ning ko‘chirmasi.
Natija belgima-belgi bir xil chiqishi shart va uni tekshirish oson —
brauzerda hisoblangan kunlik g‘uncha serverdagi hujjat bilan mos
tushishi kerak:

```js
// sahifa ochiq bo‘lganda, brauzer konsolida
const g = await import('/src/lib/guncha.ts');
const lex = await (await import('/src/lib/gunchaLexicon.ts')).gunchaLexicon();
const d = await import('/src/lib/daily.ts');
const server = await (await import('/src/lib/gunchaDaily.ts'))
  .fetchDailyGuncha({ dateKey: d.dailyKey(), number: d.dailyNumber() });
g.buildGuncha({ lexicon: lex, number: server.number, daily: true });
// center va petals serverdagi bilan bir xil bo‘lsin
```

Topilgan so‘zlar har bir g‘uncha uchun alohida saqlanadi va **harflar
imzosi** bilan tekshiriladi: lug‘at yangilanib g‘uncha o‘zgarib ketgan
bo‘lsa, eski ro‘yxat tashlanadi.

## G‘uncha jangi

`/gunchajang` — ikkalangizga bir xil g‘uncha beriladi, uch daqiqa vaqt
bo‘ladi va kim ko‘p to‘plasa, o‘sha yutadi (`docs/guncha_online.md`).
Jang So‘zjang bilan **bitta to‘plamda** yashaydi (`battles`): juftlash,
chaqiruv, muddati o‘tganini tozalash va tarix ikkalasiga umumiy, farq
faqat `game` maydonida va o‘yinga xos qismda.

Serverdagi funksiyalar: `gunchaCreate` (kod bilan chaqiruv), `gunchaWord`
(so‘z) va `gunchaFinish` (yakunlash). Tezkor jang va kod bilan qo‘shilish
So‘zjangnikini ishlatadi — `battleQuick` va `battleJoin` ga `game`
yuboriladi.

**Vaqt.** Ekrandagi teskari sanoq — ko‘rsatma, chegara emas: chegarani
server hal qiladi va har so‘zni o‘z soati bo‘yicha tekshiradi. Shuning
uchun sanoq `Date.now()` ga emas, `performance.now()` ga tayanadi —
qurilma soati o‘yin o‘rtasida o‘zgartirilsa ham sakramaydi. Qolgan vaqt
serverdan kelgan ikki sondan olinadi (`endsAt` − `serverNow`) va
qaytadan so‘raladi: jang boshlanganda, har 30 soniyada, ilovaga
qaytilganda va sanoq nolga yetganda. Sinxrondan keyin vaqt faqat
**qisqaradi** — kamroq ko‘rsatish noqulaylik, ko‘proq ko‘rsatish esa
aldov.

**So‘z.** Har bir so‘z serverga boradi, lekin javob kutilmaydi: uch
daqiqalik poygada har so‘z uchun borib kelish sezilarli. So‘z avval
brauzerdagi lug‘at bilan baholanadi va hisob darhol ko‘rinadi, server
javobi kelgach hisob to‘g‘rilanadi — rad etilgan so‘z ekrandan olinadi.
Ikkalasi deyarli har doim mos keladi; mos kelmaydigan holat — muddat
o‘tib ketgani va u jangning oxirgi soniyasida bo‘ladi.

Jang davomida raqibning faqat **bali va so‘zlar soni** ko‘rinadi
(`score`, `wordCount`); topilgan so‘zlar jang tugagach ochiladi
(`found`) — davomida ular tayyor javob bo‘lardi. Natijada ikkala
ro‘yxat yonma-yon turadi va «buni qanday topding?» degan savol shu
yerda tug‘iladi.

Maydon nomlari haqida bitta qoida bor va u og‘ir tajribadan kelib
chiqqan: **bitta to‘plamda bir nom ikki xil turda bo‘lmasin**. G‘uncha
topilgan so‘zlar sonini `wordCount` ga yozadi, chunki `words` ostida
So‘zjangda **ro‘yxat** yotadi — bir xil nom ostida son bo‘lsa, jang
tarixini o‘qiyotgan mijoz qulab tushardi.

## Aqcha va o‘lja

Ekranda ikkita birlik bor, saqlanadigan son esa uchinchisi —
**tiyin** (`docs/aqcha.md`, `soztop/docs/aqcha_tz_web.md`):

```
aqcha  = floor(tiyin / 10)                — har doim butun son
o‘lja  = 1000 + floor((reyting − 1000) / 2)
```

Firestore’da hech narsa o‘zgarmadi: `totalScore`, `points`,
`found_words.score` — hammasi o‘sha-o‘sha tiyinda, `battle_ratings`da
esa xom Elo. Bo‘lish faqat chizish paytida bo‘ladi (`src/lib/aqcha.ts`),
tartiblash esa har doim xom qiymat bo‘yicha qoladi — aks holda
yaxlitlangan sonlar o‘nlab «teng» qator yasardi.

Mukofot **butun aqchada** hisoblanadi va saqlashga `aqcha × 10` bo‘lib
tushadi (`src/lib/score.ts`):

| Qayerda | Eng ko‘pi |
| --- | --- |
| Kunlik so‘z | 20 aqcha (urinishlar bo‘yicha 20 · 17 · 13 · 10 · 7 · 3) |
| Cheksiz rejim | qancha urinish qolsa — shuncha aqcha, eng ko‘pi 8 |
| Kunlik g‘uncha | `floor(20 × hisob / eng ko‘pi)` — to‘liq yechilsa 20 |
| Onlayn jang | aqcha bermaydi, ±10 o‘ljagacha |

Cheksiz rejimda yordam shiftni tushiradi: mavzu ochilsa 6, ma’no ham
ochilsa 4 aqcha. Shift — yuqori chegara, ayirma emas; avval takror
koeffitsienti (60 %, eng kami 1), keyin chegara. Kunlik o‘yinda yordam
yo‘q.

Sayt mukofot hisoblaydigan **o‘yin mijozi**, shuning uchun bu jadval
ilovaniki bilan bir xil bo‘lishi shart: ikkalasi bir maydonga yozadi
(`scores/{uid}`, `daily_scores`, `found_words`).

### Uch xil son

| Son | Nima | Qayerda |
| --- | --- | --- |
| O‘yin hisobi | O‘yinning o‘z shkalasidagi xom son | `scores/{uid}.games.{oyin}` |
| Umumiy hisob | Barcha o‘yinlar, koeffitsient bilan | `scores/{uid}.totalScore` |
| Onlayn hisob | Shundan raqib bilan o‘ynab olingani | `scores/{uid}.onlineScore` |

Shuning uchun `scores/{uid}` ga «o‘zimniki» deb yozib bo‘lmaydi: ilgari
sayt `totalScore` ga faqat topilgan so‘zlar yig‘indisini yozardi va bu
g‘unchada yig‘ilganini hujjatdan uchirib yuborardi. Endi yozuv
`src/lib/scores.ts` dan o‘tadi: hujjatdagi `games` o‘qiladi, faqat shu
o‘yinning ulushi almashtiriladi, umumiy va onlayn hisob qaytadan
yig‘iladi.

Ikkinchi qoida — **pasaytirmaslik**. Sayt topilgan so‘zlarning oxirgi
500 tasini tiklaydi, ya’ni uning ro‘yxati telefondagidan qisqa bo‘lishi
mumkin. Ilova to‘liq ro‘yxat bilan yozadi, shuning uchun sayt hujjatdagi
qiymatni hech qachon kamaytirmaydi — kamayishi kerak bo‘lgan holatni
ilovaning o‘zi to‘g‘rilaydi.

G‘unchada hamyonga raundning **ulushi** tushadi, xom yig‘indi emas:
o‘yin ichidagi hisob (4 harfli so‘z 1, pangramma +7) daraja
zinapoyasini yuritadi va ekranda birliksiz turadi. Jangda yig‘ilgani
hozircha umumiy hisobga qo‘shilmaydi — ilovada ham shunday
(`GunchaScoreSource` faqat yakka o‘yinni sanaydi).

### Tasdiqlangan hisoblar

Mashhur odamlarning nomi yonida tasdiq belgisi turadi
(`src/lib/verified.ts`, `public/verified.png`). Ro‘yxat **uid bo‘yicha**:
taxallusni har kim o‘ziga qo‘yishi mumkin, uid esa o‘zgarmaydi — «Serobov»
deb yozib olgan boshqa odam belgini olmaydi. Belgi nom turgan hamma
joyda chiqadi (jadval, jang, tarix, maydon, hisob menyusi); profilda esa
u bosiladi va nishon nimaligi aytiladi. Egasining o‘zi bossa oyna
boshqacha bo‘ladi: u belgisining nimaligini so‘ramaydi, unga
minnatdorchilik va imtiyozlar ro‘yxati chiqadi.

Ro‘yxat ilgari shu faylda qo‘lda yozilgan edi, endi u bulutdagi bitta
hujjatda — `config/verified` (`{ uids: [...] }`) va ilova ham o‘shani
o‘qiydi: belgi adminkadan qo‘yiladi, sayt qaytadan yig‘ilmaydi. Hujjatni
faqat admin yozadi, o‘qish hammaga ochiq. Sahifa umrida bir marta
o‘qiladi va `sozgir.verified` keshida qoladi — birinchi kadrda belgi
joyida bo‘lsin.

Nishon uchta narsa beradi va uchalasi ham **haqiqatan bor** imtiyoz:

| Imtiyoz | Qayerda |
| --- | --- |
| Reklama ko‘rsatilmaydi | `AdBanner.tsx` — talab umuman yuborilmaydi |
| Ochiq profil premium ko‘rinishda | `PlayerPage.tsx` — grafit maydon, shampan chiziq, avatar chetidagi nishon (ilovadagi `ProfileSkin.verified`) |
| Begonalar jangga chaqira olmaydi | chaqiruv tugmasi profilda ham, reyting qatorida ham chizilmaydi (ilovadagi `canInviteToBattle`) |

Uchinchisining sababi: nishon taniqli shaxslarga beriladi va ularning
profiliga kuniga yuzlab odam kiradi — har biri chaqirsa, egasining
ekrani chaqiruv oynalaridan iborat bo‘lib qolardi. Tugma **yashiriladi**,
bosilib «bo‘lmaydi» deyilmaydi: bajarib bo‘lmaydigan amalni taklif
qilishning ma’nosi yo‘q.

### Belgilar

Aqcha va o‘lja raqamli joylarda **belgi bilan** ko‘rsatiladi
(`src/components/Units.tsx`): jadvalda o‘n qatorda «aqcha» so‘zi
takrorlansa, u ma’no bermay qo‘yadi. Matn ichida (qoidalar, savollar)
esa so‘zning o‘zi qoladi. Rasmlar `public/aqcha.png` va
`public/olja.png` — 128 px, shaffof fonda; belgi o‘zi turgan matn bilan
birga o‘sadi (`font: inherit`, `1em` o‘lcham).

### Darajalar

O‘lja bo‘yicha o‘nta pog‘ona, chegaralar **xom reytingda**
(`src/lib/battleRating.ts`): Chopar, Cherik, Navkar, O‘nboshi,
Yuzboshi, Mingboshi, Botir, Bahodir, Tarxon, Alp.

## Bosh sahifa o‘yindan boshlanadi

`/` ochilishi bilan taxta va klaviatura turadi, tanishtiruv matni esa
ularning **ostida**. Tepada — kunlik so‘z banneri (`/oyin` ga olib
boradi), ostida cheksiz rejimdagi taxta.

Bosh sahifadagi taxta **cheksiz** rejimda: kunlik so‘z endi hisob talab
qiladi (pastdagi bo‘lim), ya‘ni birinchi marta kelgan odam bosh
sahifada darrov to‘siqqa urilardi. Cheksiz rejim esa hisobsiz ochiq va
yangi mehmon aynan o‘sha yerda o‘yinni sinab ko‘radi.

Taxtada rejim va uzunlik tanlovi yo‘q — ular birinchi ekrandan joy
yeydi, holbuki kunlik so‘z banner orqali, uzunliklar esa
`/cheksiz/{n}-harf` sahifalari va menyu orqali ochiladi.

Sarlavhaning o‘rtasida sayt nomi va **bugun necha kishi o‘ynadi**
(`src/lib/players.ts`). Ilgari u yerda uchta havola turardi — ular endi
menyuda, chunki menyu saytning xaritasi bo‘ldi va uchta havola baribir
bo‘limlarning uchdan birini ham ko‘rsatmasdi. Ilgari hero ikki ustunli edi: chapda sarlavha va
gap, o‘ngda telefon ramkasidagi taxta. Telefonda ustunlar ustma-ust
tushardi, ya‘ni o‘ynash uchun avval butun matnni surib o‘tish kerak
bo‘lardi — qaytib kelgan o‘yinchi esa buni har safar qilardi.

Matn yo‘qolmadi (u qidiruv uchun ham, birinchi marta kelgan odam uchun
ham kerak) — faqat joyini o‘yinga bo‘shatib berdi. Telefon ramkasi ham
olib tashlandi: u o‘yinni «ilovaning ko‘rinishi» qilib ko‘rsatardi,
holbuki u shu yerda o‘ynaladigan haqiqiy o‘yin.

Taxta **har qanday ekranda** birinchi ekranga sig‘adi: hisob
`/oyin` dagi `--fit` bilan bir xil (`landing.css` dagi `.hero__board`),
farqi shundaki bu yerda u kompyuterda ham ishlaydi — o‘yinni yuqoriga
ko‘tarishning butun ma’nosi uning ko‘rinib turishida. `--reserve`
ekrandan sarlavha, banner, holat qatori, klaviatura va havoni ayiradi;
kam baholansa taxta bir oz kichik chiqadi (zarari yo‘q), oshirib
yuborilsa klaviatura birinchi ekrandan chiqib ketardi.

Sanoq o‘ylab topilmaydi — u `daily_scores/{sana}/entries` dagi yozuvlar
soni, ya‘ni bugun ball yozgan odamlar. Bitta `count()` so‘rovi,
ro‘yxatning o‘zi o‘qilmaydi. Nol bo‘lsa (yoki so‘rov yiqilsa) qator
umuman chizilmaydi.

## Kunlik so‘z uchun hisob kerak

Kunlik o‘yin — hamma uchun bitta so‘z va natija reytingga tushadi:
natijasi saqlanmaydigan o‘yinchi jadvalda ham yo‘q, ya‘ni kunlik
o‘yinning yarmi u uchun ishlamaydi. Shuning uchun kirmagan odamga
taxta o‘rniga to‘siq ko‘rinadi: sabab, «Kirish» va «Hisob ochish».

Cheksiz rejim, g‘uncha va mashq **hisobsiz ochiq** qolaveradi — mashq
uchun kirish talab qilishning ma’nosi yo‘q va yangi mehmon aynan o‘sha
yerda o‘yinni sinab ko‘radi. To‘siqning ostida o‘sha yo‘l ko‘rsatiladi:
«Hisobsiz cheksiz rejimda o‘ynash».

To‘siq `auth.ready` ni kutadi: hisob holati aniqlanmaguncha u
ko‘rsatilmaydi, aks holda kirgan odam ham bir lahza uni ko‘rib qolardi.
Mehmonlar uchun eski chegara (`GUEST_GAME_LIMIT` — beshta o‘yin) cheksiz
rejimda o‘z joyida qoladi.

## Javoblar arxivi

`/javoblar` — bugungi so‘z va o‘tgan kunlar ro‘yxati
(`AnswersPage.tsx`, `src/lib/answers.ts`). «Bugungi javob» bu turdagi
o‘yinlarda eng ko‘p qidiriladigan so‘rov: javobni o‘zimiz bermasak,
odam uni boshqa joydan (yoki umuman noto‘g‘ri) topadi.

Bugungi javob **spoyler ostida**: sahifaga o‘ynamagan odam ham tushib
qoladi va javobni tasodifan ko‘rmasligi kerak. O‘tgan kunlar ochiq —
ular allaqachon o‘ynab bo‘lingan.

**Kelajakdagi so‘zlar ko‘rsatilmaydi.** Hujjatlar oldinga yasab
qo‘yilgan (server bir necha hafta oldinda ishlaydi), shuning uchun
ro‘yxat `dateKey <= bugun` chegarasi bilan so‘raladi
(`queryUpTo`, `firebase/rest.ts`) — kelajak brauzerga umuman kelmaydi.
Ma’nolar lug‘atdan qo‘shiladi, u baribir keshlangan.

## Uzunlik bo‘yicha sahifalar

`/cheksiz/4-harf` … `/cheksiz/7-harf` — cheksiz rejim, har uzunlik o‘z
manzili bilan (`EndlessPage.tsx`, matni `src/data/lengths.ts` da).
Rejim ilgari ham bor edi, lekin «6 harfli so‘z o‘yini» deb qidirgan
odam saytni topmasdi.

Sahifa o‘yinni **darrov o‘sha uzunlikda** ochadi (`useGameChoice` ga
boshlang‘ich holat beriladi). Matndagi sonlar lug‘atning o‘zidan:
javoblar va qabul qilinadigan so‘zlar soni.

`data/pages.ts` sahifa yozuvlarini shu ro‘yxatdan yasaydi, ya’ni
sarlavha, tavsif va statik HTML bir manbadan oziqlanadi.

## Qo‘llanma

`/qollanma` va uchta maqola: birinchi so‘z, taktika, o‘zbek
alifbosidagi qiyin joylar (`src/data/guides.ts`).

Matndagi **hamma son o‘lchangan** — So‘zgirning o‘z lug‘atidan
hisoblangan, boshqa tildagi Wordle’dan ko‘chirilgan emas: eng ko‘p
uchraydigan harflar, takror harfli javoblar ulushi (41 %), SH/CH/O‘/G‘
bor javoblar (17 %), ikki unlili javoblar (94 %). Start so‘zlari ham
lug‘atdan: beshta turli harf va eng yuqori chastota.

## Yangiliklar

`/yangiliklar` — saytda va ilovada nima o‘zgargani (`data/updates.ts`).
Sarlavhadagi menyu tugmasida o‘qilmagan yangilik bo‘lsa kichik nuqta
turadi, menyuning ichida esa soni (`lib/updates.ts`).

Brauzerda bitta sana saqlanadi — oxirgi ko‘rilgan yangilikniki.
Birinchi tashrifda sanoq **chiqmaydi**: saytga endi kirgan odamga
«uchta yangilik bor» deyishning ma’nosi yo‘q.

Ro‘yxatga faqat odam sezadigan o‘zgarish tushadi va bir kun bitta yozuv
bo‘ladi — kun ichida o‘nta commit bo‘lsa ham.

## Ilova taklifi (telefonda)

Telefondan ochilgan har qanday sahifada pastdan varaq ko‘tariladi:
«So‘zgir ilovasi» (`AppPopup.tsx`). Kompyuterda u umuman chizilmaydi —
u yerda sayt o‘zi to‘liq o‘yin.

Uchta chegara bilan:

* **Sahifa avval ochiladi** — oyna 4 soniyadan keyin chiqadi, ya’ni
  odam nimani rad etayotganini ko‘radi;
* **kuniga bir marta** (`sozgir.app.promo`) — har sahifada qayta chiqsa
  u reklama emas, to‘siq bo‘lardi;
* **yopish oson** — ✕, fon, Escape va «Saytda davom etish».

Qurilma sensorli ekran, tor oyna va mobil `userAgent` uchtasi birga
bo‘lganda telefon deb hisoblanadi: sensorli monitorli kompyuter ham,
oynasi toraytirilgan brauzer ham bu shartga tushmaydi. Do‘kon qurilmaga
qarab tanlanadi — iPhone‘da App Store, qolganida Google Play birinchi
turadi.

## Nishonlar

`/nishonlar` — yigirmata nishon (`src/lib/badges.ts`,
`src/components/BadgesPage.tsx`, rasmlar `public/nishon/{id}.png`).
Ro‘yxat, nomlar, izohlar va chegaralar ilovadagi `AppBadge` ning aynan
nusxasi: bir xil nishon ikki platformada bir xil shart bilan berilishi
kerak (`soztop/docs/nishonlar.md`).

Nishon — bir martalik yutuq belgisi. Darajadan farqi shunda: daraja
reyting tushsa tushadi, nishon esa **qaytib olinmaydi**. U aqcha
bermaydi va hech narsani ochmaydi — butun qiymati ko‘rinishida.

Yangi sanoq yaratilmaydi: sonlar bor joyidan yig‘iladi
(`src/lib/useBadges.ts`).

| Son | Qayerdan |
| --- | --- |
| Kunlik ketma-ketlik | `sozgir.stats.daily.5` (eng uzuni) |
| Topilgan so‘z, mavzu, birinchi urinish | `sozgir.found` |
| Jang g‘alabalari, ketma-ketligi, reytingi | `battle_ratings/{uid}` |
| Ball yig‘ilgan o‘yinlar | g‘uncha hisobi + `scores/{uid}.games` |
| Kunning eng zo‘ri | `scores/{uid}.manOfTheDay` (serverniki) |
| Ulashish | `sozgir.badges.shares` — yagona yangi sanoq |

Qolganlari **hodisa** nishonlari: ular hech qanday sanoqda qolmaydi,
shuning uchun hodisa yuz bergan joyda belgilanadi — g‘uncha to‘liq
yechildi (`useGuncha`), lug‘atga murojaat yuborildi (`ReportWord`),
o‘yin tong sahar yoki yarim tundan keyin o‘ynaldi (`markPlayedAt`).
«Yasovul» saytda olinmaydi: Yangso‘z faqat ilovada.

Olingan nishonlar `sozgir.badges.earned` da. Ro‘yxat ikki narsa uchun
kerak: sanoq pasaysa (ketma-ketlik uzildi, reyting tushdi) nishon
qaytarib olinmasin va hodisa nishonlari bilinsin. Serverga yozilmaydi,
ya’ni telefondagi nishonlar saytda ko‘rinmaydi va aksincha — ilovada
ochiq profil uchun `player_badges` ga nusxa yozish ishlanyapti, sayt
o‘sha qotgach qo‘shiladi.

Kirmagan odamda ham ishlaydi: brauzerdagi sonlar yetadi, hisobga
bog‘liq uchtasi (jang, boshqa o‘yinlar, kun odami) kirilganda
qo‘shiladi. `/oyin` ning yon ustunida qisqa kartochka turadi
(`BadgesCard.tsx`): olinganlari va eng yaqin nishon.

## Janglar tarixi

Kirilgan odam o‘zining oxirgi janglarini ko‘radi (`ArenaHistory`):
`battles` to‘plami `players.{uid}.joinedAt` bo‘yicha saralanadi — bu
ilovadagi maydon sahifasidagi so‘rovning o‘zi. Ro‘yxat o‘yinlarni
ajratmaydi: qatorda qaysi o‘yin, kim bilan, qanday tugagani va reyting
qancha o‘zgargani (`ratingBefore`/`ratingAfter` farqi) turadi.

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

## Jangdagi reaksiyalar

Jang davomida raqibga bitta belgi yuboriladi — ilovadagi `BattleReaction`
ning aynan o‘zi: 😭 🌚 😎 🤯 🤪 🥸 🫡. Ro‘yxat **yopiq**, erkin matn yo‘q:
demak moderatsiya ham kerak emas va Firestore qoidalari aynan shu yetti
kalitni qabul qiladi. Ilovadan yuborilgan reaksiya saytda, saytdan
yuborilgani ilovada ko‘rinadi.

Yozuv: `battles/{id}/reactions/{uid}` — har o‘yinchiga bitta hujjat,
`{ key, at }`. Jang hujjatining o‘ziga tegilmaydi (u serverniki), shuning
uchun bu yo‘l mijozga ochiq: reaksiya Cloud Function orqali emas,
to‘g‘ridan-to‘g‘ri Firestore’ga yoziladi. Qoidalar yangi yozuvni
eskisidan kamida 1.5 soniya keyin qabul qiladi — tugma esa 2 soniya
«sovib» turadi va shu vaqt ichida uning o‘rnida yuborilgan belgi turadi
(xira ikonka «buzilib qoldi» degan taassurot berardi).

Yuborish «optimistik»: javob kutilmaydi va xato jim yutiladi — reaksiya
yetib bormagani o‘yinga ta’sir qilmaydi, jang esa to‘xtamasligi kerak.

Kelgan reaksiya raqib paneli ustida chiqib, chayqalib turadi va yuqoriga
suzib ketadi (`.burst`). Yangi voqea sanoq (`token`) bilan belgilanadi:
element qaytadan yaratiladi, ya’ni raqib ketma-ket bir xil belgini
yuborsa ham har biri ko‘rinadi.

«Yangi reaksiya» hujjatdagi `at` ni **o‘z soatimiz bilan** emas, oldingi
suratdagi qiymat bilan solishtirib aniqlanadi: `at` raqibning
qurilmasidan olinadi va u biznikidan orqada bo‘lsa hech qachon «yangi»
bo‘lmasdi. Birinchi surat faqat boshlang‘ich nuqta — jangdan oldin
yuborilgan reaksiya qaytadan chiqmaydi.

Tugma jang ketayotganda ham, o‘z navbatim tugab raqibni kutayotganda ham
ko‘rinadi — aynan o‘sha kutish paytida u eng o‘rinli.

## Alifbolar: lotin, yangi lotin, kirill

Sayt ham ilovadagidek uch alifboda o‘qiladi. Sarlavhadagi `O‘` tugmasi
ro‘yxatni ochadi: **Lotin** (`O‘zbek tili`), **Yangi lotin** (`Özbek tili`)
va **Кирилл** (`Ўзбек тили`). Tanlov `localStorage` da — `sozgir.script`.

**Asosiy qoida ilovanikiga aynan teng:** lug‘at, Firestore, sessiya —
hammasi **eski lotinda** saqlanadi. Alifbo faqat ekranga chiqishda
almashtiriladi, kiritishda esa darhol eski lotinga qaytariladi. Shu sababli
kunlik so‘z, reyting, jang va ulashish uch alifboda ham bir xil ishlaydi.

Ikki xil ko‘chirish bor va ular aralashmaydi:

| Nima | Qanday | Misol |
| --- | --- | --- |
| O‘yin so‘zi | harfma-harf, birlik soni o‘zgarmaydi | `yosh` → `ЙОШ` (3 katak) |
| Interfeys matni | to‘g‘ri imlo | `yosh` → `ёш`, `eshik` → `эшик` |

Agar o‘yin so‘zi ham to‘g‘ri imloda yozilsa, kirillcha `ёш` ikki katak
bo‘lardi — kunlik so‘z hammaga bir xil bo‘lishi va jang ikki o‘yinchiga bir
xil to‘r berishi kerak, ya‘ni katak soni o‘zgarishi mumkin emas.

Ko‘chirish **bitta joyda**, `src/lib/scriptDom.ts` da: ilovadagi `AppText`
vidjetining o‘rnini bosadi. React chizgan matn tugunlari o‘qiladi, asl (eski
lotin) shakli `WeakMap` da eslab qolinadi va ekranga tanlangan alifbodagi
shakli qo‘yiladi; keyingi o‘zgarishlarni `MutationObserver` ushlaydi. Har bir
matnni alohida o‘rash shart emas — keyin qo‘shiladigan matn ham o‘zi
ko‘chadi. React xalaqit ko‘rmaydi: u virtual daraxtiga qaraydi, DOM’dagi
matnni o‘qimaydi.

Istisnolar `data-script` atributi bilan belgilanadi:

* `word` — harfma-harf ko‘chiriladi: taxta, klaviatura, natija so‘zi,
  alifbo bo‘limidagi kataklar;
* `off` — umuman tegilmaydi: alifbo tanlash ro‘yxati (har bir variant o‘z
  alifbosida turishi kerak), logotip harflari va fizik klaviatura
  maslahatidagi `<kbd>` tugmalari;
* atribut matnlari (`title`, `aria-label`, `placeholder`, `alt`) doim
  to‘g‘ri imloda — ular gap, katak emas.

Brend va manzillar ko‘chirilmaydi: URL, email, `sozgir.uz`, `@sozgir_uz` va
ro‘yxatdagi nomlar (`Telegram`, `App Store`, `Payme`, `Elo`, …).

Kiritish teskari yo‘ldan o‘tadi (`toLatin`): kirill yoki yangi lotinda
yozilgan taxallus, alifbo bo‘limidagi so‘z va xabar izohi darhol eski
lotinga o‘giriladi — maydonda ham, serverda ham bitta shakl turadi.
Fizik klaviatura ham shunday: `ш` bosilsa `sh` katagi to‘ladi
(`gameKey` → `keyAction`).

Ulashish matni ataylab lotinda qoladi — ilovadagidek: natijani boshqa
odam o‘qiydi, uning alifbosi boshqacha bo‘lishi mumkin.

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
    Header.tsx    sarlavha: bo‘limlar, alifbo, mavzu, hisob, «O‘ynash», telefon menyusi
    ScriptPicker.tsx  alifbo tanlash (ilovadagi `ScriptSheet`)
    Footer.tsx    ko‘p ustunli footer
    GamePage.tsx  `/oyin` sahifasi: taxta + statistika + reyting
    AdBanner.tsx  banner reklama: yorliqli ramka, joyni oldindan band qilish
    PlayHub.tsx   `/oynash`: So‘ztop yoki So‘zjang tanlovi
    BattlePage.tsx  `/sozjang`: chaqiruv, tezkor jang va jangning o‘zi
    GunchaPage.tsx  `/guncha`: gul, daraja va topilgan so‘zlar
    GunchaBattlePage.tsx  `/gunchajang`: lobbi, taymerli jang va natija
    GunchaFlower.tsx  yettita oltiburchak: yurak harf va olti barg
    GunchaCard.tsx  `/oynash` dagi g‘uncha kartochkasi
    ArenaHistory.tsx  janglar tarixi (ikkala o‘yin bitta ro‘yxatda)
    CodeInput.tsx   olti katakli chaqiruv kodi (ikkala jangda)
    Reactions.tsx   reaksiya tugmasi va kelgan belgi (ikkala jangda)
    BattleStats.tsx  So‘zjang reytingi kartochkasi (ilovadagi RatingCard)
    BattleBoard.tsx  So‘zjang reytingi jadvali (battle_ratings, robotlarsiz)
    Versus.tsx    arena afishasi: kutish, 3-2-1 va «kelmadi» holatlari
    PlayerPage.tsx  `/oyinchi/{uid}`: o‘yinchining ochiq profili
    SendInvite.tsx  yuborilgan chaqiruv (revansh / jadvaldan) — javob kutish oynasi
    InviteOverlay.tsx  kelgan chaqiruv — istalgan sahifada pastdan chiqadi
    OpponentBoard.tsx  raqib yo‘li — faqat ranglar
    Play.tsx      o‘yin bo‘limi: rejim, natija, qisqa statistika
    Support.tsx   qo‘llab-quvvatlash bo‘limi (bosh sahifa), DonateForm
    SupportPage.tsx  `/qollab`: shakl, darajalar, top donatchilar
    Board.tsx     taxta va o‘zbek klaviaturasi
    StatsPanel.tsx  statistika va urinishlar taqsimoti
    Leaderboard.tsx kunlik va umumiy reyting
    BadgesPage.tsx  `/nishonlar`: yigirmata nishon, yo‘lakcha va izoh
    BadgesCard.tsx  yon ustundagi qisqa nishonlar kartochkasi
    AnswersPage.tsx `/javoblar`: bugungi javob (spoyler) va arxiv
    EndlessPage.tsx `/cheksiz/{n}-harf`: o‘yin + o‘sha uzunlik haqida matn
    GuidePage.tsx   `/qollanma` ro‘yxati va maqolaning o‘zi
    UpdatesPage.tsx `/yangiliklar`: o‘zgarishlar vaqt chizig‘i
    AppPopup.tsx    telefonda chiqadigan ilova taklifi
    Account.tsx   hisob tugmasi va kirish oynasi
  data/
    site.ts     barcha matn va havolalar — dizaynga tegmasdan tahrirlash uchun
    pages.ts    sahifalar: manzil, sarlavha, tavsif va statik matn
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
    script.ts   uch alifbo: harf jadvallari, harfma-harf va to‘g‘ri imlo
    useScript.ts  tanlangan alifbo (store + `useScript` hook), qisqartmalar
    scriptDom.ts  sahifani tanlangan alifboga ko‘chiruvchi (`AppText` o‘rni)
    modes.ts    rejim, uzunliklar, urinishlar soni
    daily.ts    kunlik raqam, sana kaliti va deterministik so‘z tanlovi
    dictionary.ts  lug‘at (REST + localStorage kesh + versiya tekshiruvi)
    aqcha.ts    aqcha va o‘lja — ko‘rsatish birliklari
    score.ts    mukofot formulasi (ScoreCalculator porti)
    progress.ts statistika, topilgan so‘zlar, cloud yozuv va tiklash
    nickname.ts taxallus filtri (nickname_filter.dart porti)
    leaderboard.ts  kunlik va umumiy reyting jadvallari
    battle.ts   Jang hujjatining turlari va chaqiruvlari (`game` bilan)
    activeBattle.ts  ochiq jang: qaysi o‘yin, qaysi sahifa, qaysi hujjat
    battleHistory.ts  janglar tarixi (`players.{uid}.joinedAt` bo‘yicha)
    scores.ts   hisob kitobi: o‘yin ulushi, umumiy va onlayn hisob
    loginId.ts  telefon raqam → kirish emaili (`LoginIdentifier` porti)
    guncha.ts   g‘uncha: lug‘at, yasash, hisob, daraja va hukm
    gunchaLexicon.ts  g‘uncha lug‘ati — bir marta yig‘iladi
    gunchaDaily.ts  kunlik g‘unchaning harflari (`guncha/{sana}`)
    gunchaProgress.ts  topilgan so‘zlar, yig‘ma hisob va cloud yozuvi
    gunchaBattle.ts  g‘uncha jangining funksiyalari
    useGuncha.ts  yakka g‘unchaning holati
    useGunchaJang.ts  g‘uncha jangining holati: sanoq, so‘z, raqib
    reactions.ts  jangdagi reaksiyalar: ro‘yxat, yuborish va kuzatuv
    donor.ts    homiylik darajalari va reklamasiz rejim (bitta donatlar so‘rovidan)
    ads.ts      reklama: bloklar, `app/ads` kaliti, Yandex skripti va yorliqlar
    publicProfile.ts  ochiq profil: scores + battle_ratings + kunlik + donatlar
    useSozjang.ts  So‘zjang holati (chaqiruv, navbat, jang)
    auth.tsx    hisob holati va amallari
    useGameChoice.ts  rejim va uzunlik tanlovi
    useSozTop.ts  o‘yin holati (kunlik + cheksiz)
    useReveal.ts  scroll animatsiyasi va mavzu almashtirish
    useRoute.ts   kichik router (`/`, `/oynash`, `/oyin`, `/sozjang`, `/guncha`, `/gunchajang`, `/oyinchi/{uid}`, `/qollab`, `/privacy`, `/contact`)
    battleRating.ts  So‘zjang reytingi: darajalar va `battle_ratings/{uid}` kuzatuvi
  styles/
    theme.css   dizayn tokenlari (yorug‘ + tungi)
    landing.css bo‘lim uslublari
    play.css    hisob oynasi, o‘yin bo‘limlari va `/oyin`, `/sozjang`
    guncha.css  gul, daraja, jang paneli, natija va janglar tarixi
vite/
  prerender.ts  build oxirida har manzilga HTML fayl va sitemap.xml
```

### Brauzerda saqlanadigan kalitlar

| Kalit | Nima |
| --- | --- |
| `sozgir.theme` | mavzu tanlovi (admin panel bilan bir xil) |
| `sozgir.session` | oldingi tashrifda kirilganmi (SDK’ni darhol yuklash uchun) |
| `sozgir.nickname` | ko‘rinadigan nom |
| `sozgir.script` | tanlangan alifbo (lotin / yangi lotin / kirill) |
| `sozgir.settings` | qattiq rejim va avto to‘ldirish |
| `sozgir.dict.{4..7}` | lug‘at keshi |
| `sozgir.game.{mode}.{length}` | boshlangan o‘yin |
| `sozgir.stats.{mode}.{length}` | statistika |
| `sozgir.found` | topilgan so‘zlar va ularning tiyini |
| `sozgir.endless.{length}` | cheksiz rejim o‘yin raqami |
| `sozgir.pending` | kirilmagan holda o‘ynalgan, hali yozilmagan natijalar |
| `sozgir.length` | cheksiz rejimdagi so‘z uzunligi |
| `sozgir.battle` | boshlangan jang |
| `sozgir.battle.words.{id}` | o‘sha jangdagi taxminlarim |
| `sozgir.battle.length` | So‘zjangdagi so‘z uzunligi |
| `sozgir.guncha.daily.{sana}` | kunlik g‘unchaning harflari (oxirgi 3 kun) |
| `sozgir.guncha.round.{id}` | bitta g‘unchada topilgan so‘zlar |
| `sozgir.guncha.total` | g‘unchadan yig‘ilgan tiyin va so‘zlar soni |
| `sozgir.guncha.practice` | mashq g‘unchasining raqami |
| `sozgir.guncha.battle` | boshlangan g‘uncha jangi |
| `sozgir.guncha.battle.words.{id}` | o‘sha jangda topgan so‘zlarim |
| `sozgir.badges.earned` | olingan nishonlar |
| `sozgir.badges.shares` | natija necha marta ulashilgani («Jarchi») |
| `sozgir.updates.seen` | oxirgi ko‘rilgan yangilik sanasi |
| `sozgir.app.promo` | ilova taklifi oxirgi marta qachon chiqqani |
| `sozgir.verified` | tasdiqlangan hisoblar ro‘yxatining keshi |
| `sozgir.donors` | donatchilar yig‘indisi va reklamasizlik muddati |

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
| `sozgir.uz/ln/ol` | `linkedin` | LinkedIn |
| `sozgir.uz/ak/ol` | `kulgili` | «Kulgili ovozlar» kanalidagi reklama |

Sahifa **nusxalanmaydi**: hammasi `vercel.json` dagi bitta rewrite bilan
`public/ol/index.html` ga yo‘naltiriladi (`/:channel(t|x|th|i|tt|y|f|ln|ak)/ol`).
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

Pullik joylashtirish aralashib ketmasin uchun `/ak/ol` ning o‘z mavzusi
bor — «Kulgili ovozlar (reklama)», raqami `api/ol.ts` dagi `AK_THREAD`
(maxfiy emas). Mavzu boshqasiga ko‘chsa, kodga tegmay `TELEGRAM_AK_THREAD`
bilan almashtirsa bo‘ladi. Yangi mavzu ochish (bot guruhda admin bo‘lsin):

```bash
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/createForumTopic" \
  -d chat_id="$TELEGRAM_CHAT_ID" -d name="Kulgili ovozlar (reklama)"
```

Javobdagi `message_thread_id` — o‘sha raqam.

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
| `TELEGRAM_AK_THREAD` | `/ak/ol` reklamasi mavzusi, ixtiyoriy (kodda `AK_THREAD`) |

Token yoki chat berilmasa funksiya `503` qaytaradi, forma esa foydalanuvchiga
pochta manzilini ko‘rsatadi. Lokalda `npm run dev` bilan faqat sahifalar
ishlaydi — funksiyani sinash uchun `vercel dev` kerak.

## Statik HTML va sitemap

Sayt — SPA, ya‘ni serverdan kelgan HTML‘da bir paytlar `<div
id="root"></div>` dan boshqa hech narsa yo‘q edi: **hamma manzil bir xil
2 KB fayl**, bir xil sarlavha, bir xil tavsif. JavaScript ishlatmaydigan
har qanday o‘quvchi — qidiruv roboti, reklama tarmog‘ining moderatsiya
tizimi, ijtimoiy tarmoqdagi havola ko‘rinishi — butun saytni bo‘sh deb
ko‘rardi. `/sitemap.xml` ham o‘sha bo‘sh HTML‘ni qaytarardi.

Endi build tugagach `dist/` ga har manzil uchun **o‘z fayli** yoziladi:

```
dist/index.html            /
dist/oynash/index.html     /oynash
dist/oyin/index.html       /oyin
…
dist/sitemap.xml
```

Har birida o‘z `<title>`, `<meta description>`, `<link canonical>`,
`og:` yorliqlari va `#root` ichida o‘sha sahifaning matni. React
`createRoot` o‘rnashayotganda konteynerni tozalaydi, ya‘ni statik matn
ilova chizilishi bilan almashadi — sahifada takror ko‘rinmaydi. Sekin
ulanishda esa u bir necha soniya ko‘rinib turadi, bu ham yutuq: odam
bo‘sh oq sahifaga qarab o‘tirmaydi.

**Manba bitta** — `src/data/pages.ts`. Undan uch narsa oziqlanadi:
router bilgan manzillar (`useRoute.ts`), `document.title` (`App.tsx`) va
build paytida yasaladigan fayllar (`vite/prerender.ts`). Statik matn
sahifadagi `h1` va `section__lead` dan ko‘chirilgan, bosh sahifa va
maxfiylik siyosati esa `data/site.ts` va `data/privacy.ts` dan
generatsiya qilinadi — ya‘ni **odam ko‘radigan matnning aynan o‘zi**.
Robotga boshqa, odamga boshqa matn ko‘rsatish klouking hisoblanadi va
saytni qidiruvdan ham, reklama tarmog‘idan ham chiqarib yuboradi.

Qolip topilmasa yoki `vercel.json` da manzilning qoidasi bo‘lmasa build
**yiqiladi**. Jim o‘tib ketilsa `dist` ga noto‘g‘ri sarlavhali fayllar
yozilardi yoki yangi sahifa bosh sahifaning matni bilan ochilaverardi —
ikkalasini ham faqat qidiruvda sezardik.

`/oyinchi/{uid}` parametrli, shuning uchun `sitemap.xml` ga tushmaydi,
lekin o‘z HTML fayli bor: `vercel.json` dagi qoida barcha `uid` larni
o‘shanga yo‘naltiradi, aks holda o‘yinchi profili bosh sahifaning matni
bilan ochilardi. `/kunlik` ham shunday — u `/oyin` ning fayliga tushadi.

`npm run preview` bu yerda Vercel‘ni to‘liq takrorlamaydi: vite‘ning
preview serveri `/oynash` ga ham `index.html` ni beradi. Tekshirish
uchun deploydan keyin `curl -s https://sozgir.uz/oynash | grep title`.

## Deploy

Vercel: `vercel.json` tayyor (framework `vite`, chiqish `dist`, SPA uchun
rewrite). Repo ulansa qo‘shimcha sozlash kerak emas.

## Stack

Vite · React 19 · TypeScript · Firebase (auth + firestore/lite, kechiktirib
yuklanadi) · oxlint. CSS freymvorki yo‘q — faqat CSS o‘zgaruvchilari.
