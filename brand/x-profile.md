# So‘zgir — X (Twitter) profili

## Bio

X'da bio 160 belgi. To'rt variant, har biri limitga sig'adi.

**A — modullarga urg'u (154 belgi)** ← tavsiya
> Do‘stlar bilan jonli jang qiling, tilda yo‘q tushunchaga yangi so‘z o‘ylab
> toping, har topgan so‘zingizni o‘rganing. O‘zbekcha so‘z o‘yinlari platformasi.

**B — mexanikaga urg'u (144 belgi)**
> Kuniga bitta so‘z — butun O‘zbekiston bilan birga. SH, CH, O‘ va G‘ bitta
> harf, chunki o‘zbekchada shunday. Internetsiz, reklamasiz, ro‘yxatsiz.

**C — qisqa (126 belgi)**
> O‘zbek tilidagi so‘z o‘yinlari platformasi. Kunlik so‘z, jonli jang, yangi
> so‘z o‘ylash va lug‘at — bitta ilovada. Reklamasiz.

**D — juda qisqa (103 belgi)**
> Kuniga bitta so‘z. Butun O‘zbekiston bilan birga. O‘zbekcha so‘z o‘yinlari —
> internetsiz va reklamasiz.

A varianti tavsiya etiladi: u uchta modulni ham nomlaydi, ya'ni profilga
kirgan odam ilova nima qilishini bir o'qishda tushunadi.

## Qolgan maydonlar

| Maydon | Qiymat |
| --- | --- |
| Ism | So‘zgir |
| Foydalanuvchi nomi | `@sozgir_uz` (Telegram kanali bilan bir xil) |
| Sayt | `https://sozgir-landing.vercel.app` |
| Joylashuv | O‘zbekiston |

## Profil rasmi (logo)

`x-avatar-green.png` · `x-avatar-dark.png` · `x-avatar-light.png` — 800×800
(400×400 @2x). X uni aylana qilib kesadi.

Belgi — ilova logotipidagi (`SozgirMark`) blokli «S», ya'ni splash ekranidagi
yozuv bilan bir xil til. Diametrning ~49% ini egallaydi, shuning uchun aylana
kesuvida hech qachon kesilmaydi.

**Yashil variant tavsiya etiladi:** lentada 40px gacha kichrayganda ham yashil
doira darhol ko'zga tashlanadi va tungi header bilan juftlashadi.

> Nunito shriftidagi «S» ham sinaldi — u kichik o'lchamda tanib bo'lmas holga
> keldi, shuning uchun blokli variant tanlandi.

## Header rasmi

`x-header-light.png` va `x-header-dark.png` — 3000×1000 (1500×500 @2x, X
tavsiya qilgan nisbat 3:1).

Bosh qatordagi slogan ilovaning splash ekranidan olingan
(`AppStrings.appTagline`).

> **Diqqat — imlo.** Ilovada slogan `O‘zbechada emas, o‘zbekchangizda yo‘q :)`
> deb yozilgan. «O‘zbechada» da `k` tushib qolgan, ikkinchi yarmi esa
> «o‘zbekchangizda» — parallel tuzilish `O‘zbekchada` ni talab qiladi.
> Rasmda to'g'rilangan shakl ishlatildi. Aynan ilovadagidek kerak bo'lsa,
> `x-header.html` dagi `<h1>` ni almashtirib qayta chizing.
>
> Xuddi shu xato ilovaning o'zida ham turibdi —
> `lib/core/constants/app_strings.dart`, 12-qator.

Tungi variant tavsiya etiladi: X foydalanuvchilarining ko'pchiligi qorong'i
mavzuda o'tiradi va yashil kataklar qora fonda kuchliroq ajralib turadi.

Kompozitsiya markazda — X'da chap-past burchakni avatar, o'ng-yuqorini esa
tugmalar egallaydi, shuning uchun burchaklar bo'sh qoldirilgan. Mobil va
desktop ko'rinishida tekshirilgan: avatar matnni to'smaydi.

### Qayta chizish

```bash
brand/render.sh
```

Matn yoki rangni o'zgartirish uchun `x-header.html` tahrirlanadi — u saytdagi
`theme.css` bilan bir xil ranglardan foydalanadi.

> Diqqat: fayllarda `‘` (U+2018) ishlatilgan, `ʻ` (U+02BB) emas. Nunito
> shriftida U+02BB glifi yo'q va o'rnida bo'shliq chiqadi.
