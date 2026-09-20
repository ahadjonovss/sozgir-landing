# Aqcha va O'lja — saytdagi ish

> Holat: **bajarildi** (1- va 2-bosqich). Kod saytda, qolgan savollar
> 10-bo'limda.
>
> Topshiriq: `soztop/docs/aqcha_tz_web.md`.
> Formulalar va muvozanat: `soztop/docs/aqcha_tz.md` (2- va 7-bo'limlar).
> Sabablar: `soztop/docs/aqcha.md`.
>
> Bu hujjat — o'sha TZ ning saytga tushirilgan ko'rinishi. TZ dan
> farq qiladigan **bitta** joyi bor va u 2-bo'limda.

```
tiyin  = saqlanadigan son (hozirgi ball) — o'zgarmaydi
aqcha  = floor(tiyin / 10)                — har doim butun son
o'lja  = 1000 + floor((reyting − 1000) / 2)
boylik = aqcha + floor(max(0, o'lja − 1000) × 1,5)     — serverniki
```

## 1. Nima o'zgaradi, nima o'zgarmaydi

| Qatlam | Nima bo'ladi |
| --- | --- |
| Firestore va `localStorage` | **Tegilmaydi.** Migratsiya yo'q |
| Ko'rsatish (komponentlar, matnlar) | Butunlay yangi: bo'lish, nom, daraja |
| **Ball hisobi** (`score.ts`, guncha ulushi) | **Qaytadan yoziladi** — 2- va 4-bo'lim |

Uchinchi qatorni TZ ko'zda tutmagan. Sababi quyida.

## 2. TZ ning bitta farazi saytga to'g'ri kelmaydi

TZ da ikki marta yozilgan: «web bu maydonlarning hech biriga yangi
qiymat yozmaydi» va «web bu sonlarni hisoblamaydi — faqat matnda
yozadi». Bu **admin panel uchun to'g'ri**, `sozgir-landing` uchun esa
yo'q: sayt — tanishtiruv sahifasi emas, to'liq o'yin mijozi. U ball
hisoblaydi va uni ilova yozadigan hujjatlarning aynan o'ziga yozadi:

| Fayl | Nima hisoblaydi / yozadi |
| --- | --- |
| `src/lib/score.ts` | So'ztop balli — `ScoreCalculator` ning porti |
| `src/lib/progress.ts` | `daily_scores/{sana}/entries/{uid}.points`, `users/{uid}/found_words/{so'z}.score` |
| `src/lib/scores.ts` | `scores/{uid}.games.{oyin}` va `totalScore` |
| `src/lib/gunchaProgress.ts` | G'uncha ulushi → `games.guncha` |

Demak yangi muvozanat (`aqcha_tz.md`, 7-bo'lim) saytga ham tushishi
**shart**. Aks holda ertasi kuni shunday bo'ladi:

> Kunlik so'zni telefonda birinchi urinishda topgan odam **20 aqcha**,
> saytda topgan odam **10 aqcha** oladi. Ikkalasi bir maydonga
> yoziladi, ya'ni xato ko'rinmaydi ham — odam shunchaki yarmini
> yo'qotadi.

`scores.ts` dagi «pasaytirmaslik» qoidasi buni yashiradi, tuzatmaydi:
katta son qoladi, ya'ni saytda o'ynalgan kun jim ravishda arzonlashadi.

Shuning uchun saytdagi ish ikki qismdan iborat: **ko'rsatish** (TZ da
yozilgani) va **hisob** (TZ da yozilmagani, lekin ilovaniki bilan bir
xil bo'lishi shart).

## 3. `src/lib/aqcha.ts` — bitta manba

TZ ning 2-bo'limidagi funksiyalarning aynan nusxasi. `Math.floor`,
`Math.trunc` emas.

```ts
export const aqcha = (tiyin: number) => Math.floor(tiyin / 10);
export const olja = (rating: number) => 1000 + Math.floor((rating - 1000) / 2);
export const oljaDelta = (before: number, after: number) => olja(after) - olja(before);
export const boylik = (tiyin: number, rating: number) =>
  aqcha(tiyin) + Math.floor(Math.max(0, olja(rating) - 1000) * 1.5);

/** `598`, `1 198` — ingichka bo'shliq (U+2009), kasr yo'q. */
export function formatAqcha(tiyin: number): string;
```

Tekshirish nuqtalari (TZ, 2-bo'lim): 100 → 550, 799 → 899, 800 → 900,
999 → 999, 1000 → 1000, 1001 → 1000, 1600 → 1300, 4000 → 2500.
Aqcha: 1 → `0`, 124 → `12`, 5 980 va 5 989 → `598`, 11 980 → `1 198`.

**Tartiblash har doim xom qiymat bo'yicha.** `leaderboard.ts` dagi
`orderBy` tiyindagi maydonni saralaydi: 5 989 ham, 5 980 ham «598 aqcha»
ko'rinadi, lekin birinchisi tepada turadi. Umumiy jadval `wealth`
bo'yicha saralanadi (quyida), kunlik jadval esa `points` bo'yicha.

**Alifbo.** `aqcha` va `o'lja` — oddiy so'zlar, kirillga saytning o'z
qatlami orqali o'zi o'tadi (`prose`, `scriptDom`). Ularni
`data-script="off"` ichiga qo'yib bo'lmaydi.

## 4. Yangi muvozanat — saytdagi hisob

### 4.1 So'ztop (`score.ts` qaytadan yoziladi)

Hozirgi `DAILY_BASE = 100` va `LENGTH_BASE = {4:50, 5:60, 6:80, 7:90}`
olib tashlanadi. O'rniga:

**Kunlik so'z** — asos 20 aqcha, urinish samarasi bilan:

| Urinish | 1 | 2 | 3 | 4 | 5 | 6 |
| --- | --- | --- | --- | --- | --- | --- |
| Aqcha | 20 | 17 | 13 | 10 | 7 | 3 |
| Saqlanadi (tiyin) | 200 | 170 | 130 | 100 | 70 | 30 |

**Cheksiz rejim** — «qancha urinish qolgan bo'lsa, shuncha aqcha»
(`attemptsFor(length) = length + 1`):

| Uzunlik | 1-urinish | … | oxirgi urinish |
| --- | --- | --- | --- |
| 4 harf | 5 | … | 1 |
| 5 harf | 6 | … | 1 |
| 6 harf | 7 | … | 1 |
| 7 harf | 8 | … | 1 |

* Avval topilgan so'z — 60 %, eng kami **1 aqcha**.
* Topa olmasa — 0.
* **Yordam shiftni tushiradi:** mavzu olingan bo'lsa 6 aqcha, ma'no ham
  olingan bo'lsa 4 aqcha. Shift — yuqori chegara, ayirma emas:
  `aqcha = min(shift, mukofot)`. Tartib: avval takror koeffitsienti,
  keyin chegara.
* Kunlik o'yinda yordam yo'q — saytda ham shunday (`useHint`).

Bu yerda bitta yangi bog'lanish paydo bo'ladi: hozir `useHint` va
`score.ts` bir-birini bilmaydi. Endi olingan yordam bosqichi (mavzu /
ma'no) `recordOutcome` ga yetib borishi kerak.

Saqlanadigan son har doim **aqcha × 10** — butun aqcha qoidasi shundan
kelib chiqadi (`aqcha_tz.md`, 2-bo'lim).

### 4.2 G'uncha (`gunchaProgress.ts`)

Bugun hamyonga raundning **xom yig'indisi** tushadi. Ertaga — raundning
ulushi:

```
tiyin = floor(20 × score / maxScore) × 10
```

To'liq yechilgan g'uncha — 20 aqcha, yarmi — 10. `maxScoreOf(puzzle)`
saytda allaqachon bor.

G'unchaning **o'z balli o'yin ichida qoladi** (4 harfli so'z 1, uzuni
uzunligicha, pangramma +7): u daraja zinapoyasini yuritadi, hamyonni
emas.

Farq usuli saytda allaqachon ishlaydi (`applied` yozuvi), faqat endi
xom ball emas, **to'langan tiyin** eslab qolinadi:

```
total = total − applied.paid + yangi ulush
```

Islohotdan oldin qo'llangan raundlarda `applied.paid` yo'q — o'shalar
uchun eski xom qiymat (`applied.score`) ayiriladi. Shunda ko'chirish
kerak bo'lmaydi va bir raund ikki marta to'lanmaydi.

### 4.3 Jang

Sayt Elo hisoblamaydi va hisoblamaydi ham — `PROVISIONAL_K` ni server
o'zgartiradi (`functions/src/elo.ts`). Saytga faqat ko'rsatish tegadi.

`battles/{id}.players.{uid}.score` (`battleScore`) hamyonga tushmaydi
va aqchaga o'girilmaydi — u jangning ichki natijasi. Natija ekranidagi
ikki son **birliksiz** qoladi.

## 5. Darajalar — beshta emas, o'nta

`battleRating.ts` dagi `TIERS` va `tierName` butunlay almashadi.
Chegaralar **xom reytingda** tekshiriladi, ekranda esa o'lja turadi:

| Reyting | Daraja | O'ljada ko'rinishi |
| --- | --- | --- |
| < 800 | Chopar | < 900 |
| 800–999 | Cherik | 900–999 |
| 1000–1099 | Navkar | 1000–1049 |
| 1100–1249 | O'nboshi | 1050–1124 |
| 1250–1399 | Yuzboshi | 1125–1199 |
| 1400–1599 | Mingboshi | 1200–1299 |
| 1600–1799 | Botir | 1300–1399 |
| 1800–2099 | Bahodir | 1400–1549 |
| 2100–2499 | Tarxon | 1550–1749 |
| 2500+ | Alp | 1750+ |

`tierProgress()` ham shu ro'yxatdan hisoblanadi — hozir u to'rtta
chegaraga va «oldingisidan 200 past» degan farazga tayanadi, o'nta
pog'onada oraliqlar teng emas.

Eski nomlar (*Yangi · Havaskor · Tajribali · Ustoz · So'z ustasi*)
saytdan butunlay ketadi — `BattleStats`, `PlayerPage`, `Leaderboard`
va matnlardan.

## 6. Ekranlar

| Joy | Bugun | Ertaga |
| --- | --- | --- |
| `Leaderboard.tsx` | `1 240` | `124 aqcha` |
| `StatsPanel.tsx` | «Jamlangan ball» | «Aqcha» — belgisiz |
| `Play.tsx` natija | `+100 ball` | `+20 aqcha` |
| `PlayHub.tsx` | `+83 ball` | `+17 aqcha` |
| `GunchaCard.tsx` | `54 ball` | `11 aqcha` — raund ulushi |
| `GunchaPage.tsx` daraja | `54 / 96 ball` | `54 / 96` — birliksiz |
| `GunchaBattlePage.tsx` | `12 ball ko'p topdingiz` | `12 ko'p topdingiz` |
| `ArenaStandings.tsx`, `ArenaTiles.tsx` | `54 ball` | birliksiz son |
| `BattlePage.tsx` natija | ikki tomonning balli | birliksiz son |
| `BattleStats.tsx` | «Bellashuv reytingi», `1 240` | «O'lja», `1 120` |
| `BattleStats.tsx` daraja yo'li | `Keyingi darajaga 60 ball` | `Keyingi darajaga 30 o'lja` |
| `ArenaHistory.tsx` | `+12` | `+6 o'lja` (`oljaDelta`) |
| `PlayerPage.tsx` | «Umumiy ball», «Bellashuv reytingi» | «Aqcha», «O'lja» |
| Daraja (`BattleStats`, `BattleBoard`) | faqat nom | nishon + nom |
| Homiylik chipi (`DonorChip`) | ♥ belgisi | homiylik nishoni |
| `data/site.ts`, `data/pages.ts`, `data/privacy.ts` | ball, reyting | aqcha, o'lja |
| `README.md` «Ballar tizimi» | ball | tiyin / aqcha / o'lja |

Qoida matnlari yangi sonlar bilan: «kunlik so'z — 20 aqcha», «cheksizda
qancha urinish qolsa shuncha aqcha», «jangda eng ko'pi ±10 o'lja».

**Nishonlar.** O'nta daraja (`public/daraja/*.png`) va beshta homiylik
darajasi (`public/homiy/*.png`) — nom yonida kichik nishon: bellashuv
kartochkasida, O'lja jadvalining qatorlarida, homiylik chipida va
qo'llab-quvvatlash sahifasidagi summalarda.

**Belgilar.** Aqcha va o'lja raqam yonida belgi bilan turadi
(`components/Units.tsx`, `public/aqcha.png`, `public/olja.png`):
jadval, kartochka, natija va profilda — belgi; qoida va savol
matnlarida — so'zning o'zi. O'lja rasmining foni shaffof emas edi
(eksportda shaxmat naqshi pikselga aylanib qolgan) — chegaradan
bog'langan fon o'chirilib, mayda dog'lar tozalandi.

**Har o'yin ichida tushuntirish** — `ScoreRules` (`components/ScoreRules.tsx`):
So'ztopda statistika panelining oxirida yig'ilgan bo'lim, qolgan
o'yinlarda esa mavjud qoidalar ro'yxatiga qo'shiladigan qatorlar.
Sonlar **formuladan chiqadi** (`scoreFor`, `attemptsFor`), qo'lda
yozilmagan: muvozanat o'zgarsa qoida matni ham o'zi o'zgaradi — aks
holda ikkisi bir kun ajralib qolardi.

Ulashish matnlarida ball yo'q (`shareText` faqat urinish va emoji
to'rini beradi) — ularga tegilmaydi.

## 7. Tegilmaydigan joylar

* **Homiylik darajalari** (`donor.ts`) va donat summalari — so'mda
  qoladi, aqchaga aylantirilmaydi.
* **`battleScore`** — 4.3.
* **Elo** — sayt hech qachon hisoblamaydi.
* **Tartiblash maydonlari** — xom qiymat.

Donat va aqcha bir ekranda uchrashadi (`PlayerPage`): donat matnlarida
hech qachon «aqcha» yozilmaydi, faqat «so'm». Aqchani pulga sotib olish
yo'li ko'zda tutilmagan.

## 8. Reliz tartibi

Sayt bir necha daqiqada yangilanadi, ilova esa do'kon ko'rigidan
o'tadi. Muvozanat o'zgargani uchun tartib endi qat'iy:

1. Server (`elo.ts` dagi `PROVISIONAL_K`) — ilova bilan bir vaqtda yoki
   undan oldin.
2. Ilova relizi chiqadi.
3. **Shundan keyin** sayt. Oldin chiqarilsa, sayt yangi muvozanatda,
   ilova eskisida yozadi — bir maydonga ikki xil shkala tushadi.

Eski ilova versiyalari bir necha hafta qoladi: ularda eski sonlar
ko'rinadi, ma'lumot buzilmaydi. Saytda bitta jumla turadi: «Ilovada
hozircha ball ko'rinishi mumkin — bir xil hisob, boshqa o'lchov.»

## 9. Qabul mezonlari (sayt)

1. Ekranda «ball», «reyting», «tiyin» so'zlari yo'q.
2. `aqcha()` va `olja()` 3-bo'limdagi jadvalning har qatorida
   ilovanikiga mos.
3. Kunlik so'z 1-urinishda **20 aqcha**, 7 harfli cheksiz so'z
   1-urinishda **8 aqcha** (mavzu bilan 6, ma'no bilan 4), to'liq
   yechilgan g'uncha **20 aqcha**.
4. Saytda o'ynalgan kunlik o'yin ilovada o'ynalganidan farq qilmaydi:
   bir xil urinishda bir xil aqcha.
5. Daraja nomi va ko'rsatilgan o'lja chegaralarda zid emas
   (799/800, 999/1000, 2499/2500).
6. Aqcha hech qayerda kasr bilan chiqmaydi.
7. Tartiblash xom qiymat bo'yicha; ikki o'yinchining aqchasi bir xil
   ko'rinsa ham o'rni to'g'ri.
8. Firestore'ga aqcha shkalasida hech narsa yozilmagan — yozuv har doim
   tiyinda (aqcha × 10).

## 10. Ochiq savollar

1. **Muvozanat saytga ham tushadimi.** 2-bo'lim. Tushmasa, sayt o'yin
   mijozi bo'lishdan to'xtashi kerak (ball yozmaydigan «demo» rejim) —
   uchinchi yo'l yo'q.
2. **O'yin ichidagi sonlar qanday ataladi.** TZ «ball» so'zini
   taqiqlaydi, lekin g'unchaning o'z balli o'yin ichida qoladi. Sayt
   birliksiz son taklif qiladi (`54 / 96`); ilovada qanday bo'lsa,
   sayt ham shunday qiladi.
3. ~~**Boylik ko'rsatiladimi.**~~ **Ha** — umumiy jadval va ochiq
   profil endi `scores/{uid}.wealth` ni ko'rsatadi (ilovadagi bilan
   bir xil maydon va bir xil saralash). Sayt uni **yozmaydi**: maydonni
   server triggeri (`onScoreWealth`) yuritadi, ya'ni `battle_ratings`
   ni o'qish ham, formulani ikkinchi marta hisoblash ham kerak emas.
   Maydoni yo'q eski hujjat uchun yalang `totalScore` ishlatiladi.
   Nomi o'zgarmadi: sayt uni baribir **aqcha** deb ataydi.
4. **«Reyting» so'zi jadval nomi sifatida qoldi** — `Reyting` paneli,
   «Kunlik / Umumiy reyting», «aqcha reytingga tushadi». Birlik sifatida
   u hech qayerda yo'q (o'lja bilan almashdi). Ilovada jadval boshqacha
   atalsa, sayt ham o'zgaradi.
5. **G'unchada kichik ulush nolga yaxlitlanadi.** TZ ning o'z formulasi
   (`floor(20 × hisob / eng ko'pi)`) katta g'unchadagi bitta qisqa so'zga
   0 aqcha beradi — «eng kichik mukofot 1 aqcha» mezoni bilan zid.
   Formula parity muhimroq deb, saytda TZ dagidek qoldirildi.
6. **`aqcha_tz.md` ning 8-bo'limidagi testlar eskirgan** — u yerda
   `124 → 12,4` va `999 → 99,9` deb yozilgan, ya'ni kasrli eski qoida.
   2-bo'lim va veb TZ esa butun sonni talab qiladi. Ilova tomonida
   tuzatilsin, aks holda ikki platforma boshqacha yaxlitlaydi.
