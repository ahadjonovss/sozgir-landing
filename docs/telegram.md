# Telegram oqimi

Sayt nima qilayotgani «Sozgir Web» guruhiga tushadi: tashrif, tugagan
o'yin, reklama, ulashish, do'kon havolasi, aloqa formasi, xato va
kunlik hisobot. Har turkum o'z mavzusida.

Bu ilovadagi `Reporter` ning (`soztop/lib/core/report/reporter.dart`)
sayt tarafdagi juftligi va u bilan **bir xil guruh tartibini**
takrorlaydi: bitta guruh, turkumlar mavzularga ajratilgan, xabar
sarlavhasida teg.

## Nega ilovadagidek emas

Ikkita farq bor va ikkalasi ham ataylab.

**Token saytda saqlanmaydi.** Ilova tokenni o'zi bilan olib yuradi va
to'g'ridan-to'g'ri Telegram'ga yozadi. Brauzerda bunday qilib
bo'lmaydi: JavaScript to'plamiga tushgan hamma narsa ochiq matn va
tokenni istagan odam o'qib oladi — keyin bot begona qo'lga o'tadi.
Shuning uchun sahifa `/api/event` ga yozadi (`api/event.ts`), u esa
Vercel muhitidagi token bilan Telegram'ga yuboradi.

**Sahifa xabarning shaklini hal qilmaydi.** Mijoz faqat hodisa turini
va qatorlarni yuboradi; sarlavha, teg, mavzu va ovoz
`api/event.ts` dagi jadvaldan olinadi. Aks holda ochiq marshrutni
topgan odam guruhga istalgan matnni istalgan sarlavha bilan chiqara
olardi.

## Nima qayerga tushadi

| Mavzu | Hodisa | Qayerdan |
| --- | --- | --- |
| 👁 Tashriflar | Saytga kirildi — **seans boshiga bitta** | `trackVisit`, `App.tsx` |
| 🎮 O'yin | Tugagan o'yin: natija, rejim, uzunlik, urinish | `Play.tsx` |
| 📣 Reklama | Banner so'raldi / keldi / to'ldirish yo'q | `AdBanner.tsx` |
| 🔗 Ulashish | Natijani ulashish va nusxa olish | `Play.tsx` |
| ⬇️ Yuklab olish | App Store, Google Play, Telegram havolalari | `watchLinks`, delegatsiya |
| 📨 Aloqa | Saytdagi forma | `api/contact.ts` |
| ⚠️ Xatolar | Tutilmagan istisno va `unhandledrejection` | `watchErrors` |
| 📊 Kunlik hisobot | Metrika raqamlari, har kuni ertalab | `api/daily.ts`, cron |

Serverdagi hodisalar (ro'yxatdan o'tish, janglar, turnir, donat,
moderatsiya) bu guruhga **tushmaydi**: ularni backend allaqachon
ilovaning guruhiga yozyapti (`soztop/backend/src/infra/telegram.ts`).
Ikki joyda ikki marta chiqishining ma'nosi yo'q.

## Qoidalar

* **Faqat prodda.** `import.meta.env.DEV` da mijoz hech narsa
  yubormaydi: o'z yig'ishingdagi har bosish guruhga tushsa, guruh bir
  kunda o'qib bo'lmaydigan holga keladi.
* **Faqat xatolar ovozli.** Qolgani kuzatuv oqimi. Hammasi
  jiringlasa guruh o'chirib qo'yiladi va o'shanda xatolar ham
  ko'rinmay ketadi.
* **Sahifa sekinlashmaydi.** Yuborish `sendBeacon` orqali, javob
  kutilmaydi, xatolar yutiladi.
* **Takror yo'q.** Bir xil hodisa varaq umrida bir marta. Xatolarda
  kalit — xabarning matni: tsiklda yiqilayotgan kod bir soniyada
  yuzlab xabar yuborardi.

## Sozlash

Mavzular bir marta ochiladi:

```bash
TELEGRAM_BOT_TOKEN=… TELEGRAM_SITE_CHAT_ID=-100… node tool/telegram-topics.mjs
```

Skript tokenni `TELEGRAM_BOT_TOKEN` dan oladi — bu yerda **sayt
guruhidagi** botning tokeni beriladi, Vercel'da u
`TELEGRAM_SITE_BOT_TOKEN` nomi bilan saqlanadi.

Bot guruhda administrator bo'lishi va «Manage topics» huquqi bo'lishi
shart. Skript tayyor env satrlarini chop etadi — ular Vercel
sozlamalariga ko'chiriladi.

### Muhit o'zgaruvchilari

| Nom | Nima |
| --- | --- |
| `TELEGRAM_SITE_BOT_TOKEN` | sayt guruhidagi bot — **@splito_alert_bot** |
| `TELEGRAM_SITE_CHAT_ID` | sayt guruhi, `-100…` |
| `TELEGRAM_SITE_DAILY_THREAD` | 📊 Kunlik hisobot |
| `TELEGRAM_SITE_ERRORS_THREAD` | ⚠️ Xatolar |
| `TELEGRAM_SITE_CONTACT_THREAD` | 📨 Aloqa |
| `TELEGRAM_SITE_GAME_THREAD` | 🎮 O'yin |
| `TELEGRAM_SITE_ADS_THREAD` | 📣 Reklama |
| `TELEGRAM_SITE_SHARE_THREAD` | 🔗 Ulashish |
| `TELEGRAM_SITE_GET_THREAD` | ⬇️ Yuklab olish |
| `TELEGRAM_SITE_VISIT_THREAD` | 👁 Tashriflar |
| `TELEGRAM_SITE_VISIT` | `0` — tashrif oqimini o'chiradi |
| `YANDEX_METRIKA_TOKEN` | kunlik hisobot uchun OAuth token |
| `YANDEX_METRIKA_COUNTER` | hisoblagich, standart `113700305` |
| `CRON_SECRET` | berilsa, `/api/daily` shu bilan himoyalanadi |

Ikkala guruhda **ikki xil bot** turibdi: ilova guruhida
`TELEGRAM_BOT_TOKEN` dagi @sozgirbot, sayt guruhida esa
`TELEGRAM_SITE_BOT_TOKEN` dagi @splito_alert_bot. Token va guruh
doim juft olinadi — aralashtirilsa Telegram «chat not found»
qaytaradi va xabar jimgina yo'qoladi. `TELEGRAM_SITE_BOT_TOKEN`
berilmasa `TELEGRAM_BOT_TOKEN` zaxira sifatida ishlatiladi; bu
faqat kelajakda ikkala guruhga bitta bot qo'yilsa to'g'ri bo'ladi.

Biror qiymat berilmasa o'sha oqim jim turadi. Guruh yoki token
umuman bo'lmasa hech narsa yuborilmaydi — preview yig'ilishlari
guruhga shovqin qilmaydi.

### Tashriflar oqimi haqida

Trafik o'sganda «har tashrif — bitta xabar» kuniga minglab xabarga
aylanadi, Telegram esa guruhga daqiqasiga ~20 ta xabardan ortig'ini
o'tkazmaydi: ortig'i yo'qoladi va yo'qolganlar orasida xatolar ham
bo'ladi. Shuning uchun:

* tashrif **seans boshiga bitta** (`sessionStorage`), sahifadan
  sahifaga o'tish qayta yozmaydi;
* `TELEGRAM_SITE_VISIT=0` butun oqimni o'chiradi va qolganiga
  tegmaydi.

Kunlik son yuzdan oshsa, bu oqimni o'chirib, kunlik hisobotga
tayangan ma'qul — u o'sha savolga aniqroq javob beradi.

### Kunlik hisobot uchun token

`api/daily.ts` Metrika Stat API'dan o'qiydi va unga OAuth token
kerak:

1. `oauth.yandex.com` da ilova yarating, `metrika:read` huquqini
   belgilang;
2. tokenni oling va Vercel'ga `YANDEX_METRIKA_TOKEN` sifatida
   qo'shing.

Tokensiz marshrut jim turadi. Sozlangach uni qo'lda tekshirish
mumkin: `https://sozgir.uz/api/daily` ni oching — guruhga hisobot
tushishi kerak.
