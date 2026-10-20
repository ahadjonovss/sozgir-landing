/** Sahifalar ro'yxati — manzil, sarlavha va statik matn.
 *
 *  Uch joyda ishlatiladi va shuning uchun shu yerda turadi:
 *
 *  1. `useRoute.ts` — router shu ro'yxatdagi manzillarni biladi;
 *  2. `App.tsx` — `document.title` shu yerdan olinadi;
 *  3. `vite.config.ts` — build paytida har manzilga alohida HTML fayl
 *     va `sitemap.xml` yasaladi.
 *
 *  **Nega statik matn kerak.** Sayt — SPA: serverdan kelgan HTML'da
 *  `<div id="root"></div>` dan boshqa hech narsa yo'q edi va JavaScript
 *  ishlatmaydigan har qanday tekshiruvchi (qidiruv roboti, moderator
 *  tizimi, ulashishdagi ko'rinish) butun saytni bo'sh deb ko'rardi —
 *  hamma manzilda bir xil, bir xil sarlavha bilan. Endi har manzil o'z
 *  sarlavhasi, tavsifi va matni bilan keladi.
 *
 *  Matn **odam ko'radigani bilan bir xil** bo'lishi shart: bu yerdagi
 *  `h1` va `lead` sahifadagi `h1` va `section__lead` dan ko'chirilgan.
 *  Robotga boshqa, odamga boshqa matn ko'rsatish — klouking, va u
 *  saytni qidiruvdan ham, reklama tarmog'idan ham chiqarib yuboradi. */

import { GUIDES, type GuidePath } from './guides';
import { LENGTH_PAGES, type LengthPath } from './lengths';
import { LUGAT_INDEX, LUGAT_PAGES, LUGAT_PATH, type LugatLetterPath } from './lugat';

export interface Page {
  /** Manzil — router uchun ham shu. */
  path: string;
  /** `<title>` va brauzer yorlig'i. */
  title: string;
  /** `<meta name="description">`. */
  description: string;
  /** Havolalar ro'yxatidagi qisqa nom — footer'dagi yorliq bilan bir
   *  xil. To'liq `title` havolada uzun va takroriy ko'rinadi. */
  nav: string;
  /** Sahifadagi sarlavha — statik HTML uchun. */
  h1: string;
  /** Sarlavha ostidagi izoh. */
  lead: string;
  /** Qo'shimcha xatboshilar — sahifa nima qilishini tushuntiradi. */
  body?: string[];
  /** Manzil `sitemap.xml` ga va statik faylga tushadimi.
   *
   *  Parametrli manzil (`/oyinchi/{uid}`) uchun `false`: uning mazmuni
   *  har o'yinchida boshqacha va oldindan yasab bo'lmaydi. */
  listed?: boolean;
  /** Ro'yxatda yo'q, lekin `dist/` da **fayli** bo'lishi shart.
   *
   *  Parametrli manzil `vercel.json` orqali aynan shu faylga
   *  yo'naltiriladi (`/soztop/{KOD}` → `/soztop/index.html`). Fayl
   *  bo'lmasa manzil bosh sahifaning matni bilan ochilardi — robot
   *  uchun ham, ulashishdagi ko'rinish uchun ham. */
  file?: boolean;
}

const BASE_PAGES = [
  {
    path: '/',
    title: 'So‘zgir — o‘zbekcha so‘z o‘yinlari',
    description:
      'So‘zgir — o‘zbek tilidagi so‘z o‘yinlari ilovasi. Kuniga bitta so‘z, hamma uchun bir xil. SH, CH, O‘ va G‘ bitta harf. Bepul, internetsiz ham ishlaydi, ilova ichi xaridlari yo‘q.',
    nav: 'Bosh sahifa',
    h1: 'Kuniga bitta so‘z. Butun O‘zbekiston bilan birga.',
    lead:
      'Yashirin so‘zni oltita urinishda toping, do‘stingiz bilan jonli jang qiling va har topgan so‘zingizning ma’nosini o‘rganing. SH, CH, O‘ va G‘ — bitta harf, xuddi maktabda o‘rgangandek.',
    body: [
      'So‘zgir — bitta o‘yin emas, o‘zbek tilidagi so‘z o‘yinlari to‘plami: So‘ztop (yashirin so‘zni topish), So‘zjang (ikki o‘yinchi bir so‘z ustida bellashadi), G‘uncha (yettita harfdan so‘z yig‘ish), Yangso‘z (tilda yo‘q tushunchaga yangi so‘z o‘ylab topish) va reyting.',
      'Kunlik so‘z butun mamlakatda bir xil va u telefondagi ilovada ham, saytda ham aynan bitta. Uni o‘ynash uchun hisob kerak — natija reytingga tushadi; cheksiz rejim esa hisobsiz ham ochiq.',
      'O‘yin o‘zbek alifbosiga moslangan: SH, CH, O‘ va G‘ bitta tovush, shuning uchun bitta katakcha va klaviaturada bitta tugma. Yozuvni lotin, yangi lotin yoki kirillga almashtirish mumkin.',
    ],
  },
  {
    path: '/oynash',
    title: 'O‘ynash — So‘zgir',
    description:
      'Bugungi so‘zni yolg‘iz toping, harflardan so‘z yig‘ing yoki do‘stingiz bilan bellashing — hammasi brauzerda.',
    nav: 'O‘ynash',
    h1: 'Nimani o‘ynaymiz?',
    lead:
      'Bugungi so‘zni yolg‘iz toping, harflardan so‘z yig‘ing yoki do‘stingiz bilan bellashing. Hammasi shu yerda, brauzerda.',
    body: [
      'So‘ztop — kuniga bitta 5 harfli so‘z, butun O‘zbekiston uchun bir xil. Topgach cheksiz rejimda 4 dan 7 harfgacha mashq qilasiz.',
      'So‘zjang — bir so‘z, ikki o‘yinchi: do‘stingizni kod bilan chaqiring yoki tezkor jangda tasodifiy raqib toping.',
      'G‘uncha — yettita harf, o‘rtadagi yurak harf har bir so‘zda qatnashadi.',
    ],
  },
  {
    path: '/oyin',
    title: 'So‘zgir — bugungi so‘zni toping',
    description:
      'So‘ztopning kunlik so‘zi: butun O‘zbekistonda bir xil, ilovadagi bilan aynan bitta. Cheksiz rejimda 4 dan 7 harfgacha mashq.',
    nav: 'Bugungi so‘z',
    h1: 'Bugungi so‘zni toping',
    lead:
      'Kunlik so‘z butun O‘zbekistonda bir xil va ilovadagi bilan aynan bitta. Cheksiz rejimda esa 4 dan 7 harfgacha xohlagancha mashq qilasiz.',
    body: [
      'Har taxmindan keyin kataklar rang oladi: yashil — harf o‘z joyida, sariq — so‘zda bor lekin boshqa joyda, kulrang — yo‘q.',
      'Sahifada o‘z statistikangiz, kunlik va umumiy reyting ham ko‘rinadi. Hisobga kirsangiz aqcha reytingga tushadi va boshqa qurilmadan ham ko‘rinadi.',
      'O‘zbek alifbosiga moslangan: SH, CH, O‘ va G‘ bitta tovush, ya’ni taxtada bitta katak va klaviaturada bitta tugma. Yozuvni lotin, yangi lotin yoki kirillga almashtirish mumkin — so‘z o‘zgarmaydi, faqat ko‘rinishi.',
      'Kunlik so‘zni o‘ynash uchun hisob kerak — natija reytingga tushadi va boshqa qurilmadan ham ko‘rinadi. Cheksiz rejim esa hisobsiz ochiq: u yerda natija faqat shu qurilmada qoladi.',
    ],
  },
  {
    path: '/sozjang',
    title: 'So‘zjang — do‘st bilan so‘z jangi | So‘zgir',
    description:
      'Ikki o‘yinchiga bitta yashirin so‘z: kim birinchi topsa — o‘sha yutadi. Do‘stni kod bilan chaqiring yoki tezkor jangda raqib toping.',
    nav: 'So‘zjang',
    h1: 'Bir so‘z, ikki o‘yinchi',
    lead: 'Ikkalangizga bir xil yashirin so‘z. Kim birinchi topsa — yutadi.',
    body: [
      'Jang — poyga: urinishlar sanalmaydi, so‘zni birinchi topgan yutadi. Maydon va turnirda qoida boshqacha — u yerda bir vaqtda ko‘p odam o‘ynaydi va o‘rin urinishlar soniga qarab beriladi.',
      'Raqibning taxtasida harflar ko‘rinmaydi — faqat ranglar, ya’ni javobni undan o‘qib bo‘lmaydi.',
      'Jang aqcha beradi: 1000 dan boshlanadi, bir jangda eng ko‘pi ±10. Darajalar — Chopar, Cherik, Navkar, O‘nboshi, Yuzboshi, Mingboshi, Botir, Bahodir, Tarxon, Alp.',
      'Saytda yaratilgan chaqiruvga telefondagi ilovadan ham qo‘shilish mumkin.',
      'O‘zbek alifbosiga moslangan: SH, CH, O‘ va G‘ bitta tovush, ya’ni taxtada bitta katak va klaviaturada bitta tugma. Yozuvni lotin, yangi lotin yoki kirillga almashtirish mumkin — so‘z o‘zgarmaydi, faqat ko‘rinishi.',
      'Jang uchun hisob kerak — raqib taxallusingizni ko‘radi va natija reytingga yoziladi. Saytdagi jang telefondagi ilovadagi bilan bitta: raqibingiz qaysi tarafda ekani farq qilmaydi.',
    ],
  },
  {
    path: '/guncha',
    title: 'G‘uncha — yettita harfdan so‘z yig‘ing | So‘zgir',
    description:
      'Yettita harf beriladi, o‘rtadagi yurak harf har bir so‘zda qatnashadi. Topilgan har bir so‘zning ma’nosi ham shu yerda.',
    nav: 'G‘uncha',
    h1: 'Yettita harfdan so‘z yig‘ing',
    lead:
      'O‘rtadagi yurak harf har bir so‘zda qatnashadi, qolgan oltitasi xohlagancha takrorlanadi. Topilgan har bir so‘zning ma’nosi ham shu yerda — o‘ynab turib lug‘at boyitasiz.',
    body: [
      'Yettala harf ishlatilgan so‘z — pangramma, u qo‘shimcha hisob beradi. To‘liq yechilgan kunlik g‘uncha 20 aqcha beradi.',
      'Kunlik g‘uncha hamma uchun bir xil; undan tashqari cheksiz mashq rejimi ham bor.',
      'Topilgan so‘zning ma’nosi darhol yonida chiqadi — lug‘at o‘yinning ichida, uni alohida qidirish shart emas.',
      'O‘zbek alifbosiga moslangan: SH, CH, O‘ va G‘ bitta tovush, ya’ni taxtada bitta katak va klaviaturada bitta tugma. Yozuvni lotin, yangi lotin yoki kirillga almashtirish mumkin — so‘z o‘zgarmaydi, faqat ko‘rinishi.',
    ],
  },
  {
    path: '/gunchajang',
    title: 'G‘uncha jangi — uch daqiqa, bir g‘uncha | So‘zgir',
    description:
      'Ikki o‘yinchiga bir xil g‘uncha va uch daqiqa vaqt: kim ko‘p to‘plasa — o‘sha yutadi.',
    nav: 'G‘uncha jangi',
    h1: 'G‘uncha jangi',
    lead:
      'Ikkalangizga bir xil g‘uncha beriladi va uch daqiqa vaqt bo‘ladi. Kim ko‘p to‘plasa — o‘sha yutadi.',
    body: [
      'Do‘stingizni olti raqamli kod bilan chaqirishingiz yoki tezkor jangda tasodifiy raqib topishingiz mumkin.',
      'G‘unchaning o‘zi o‘zgarmaydi: o‘sha yettita harf, o‘sha yurak harf va o‘sha pangramma hisobi — jang faqat vaqt va raqib qo‘shadi.',
      'Jang uchun hisob kerak: raqib taxallusingizni ko‘radi va natija hisobingizga yoziladi. Saytda ochilgan jangga telefondagi ilovadan ham qo‘shilish mumkin.',
    ],
  },
  {
    path: '/maydon',
    title: 'Mardu maydon — sakkiz kishilik so‘z jangi | So‘zgir',
    description:
      'Bir xil so‘z yoki bir xil g‘uncha, lekin ikki kishi emas: sakkiztagacha odam bir vaqtda o‘ynaydi va oxirida jadval tuziladi.',
    nav: 'Mardu maydon',
    h1: 'Mardu maydon',
    lead:
      'Yangi o‘yin emas — yangi shakl. O‘sha So‘zjang yoki G‘uncha, lekin ikki kishi emas: sakkiztagacha odam bir vaqtda o‘ynaydi va oxirida jadval tuziladi.',
    body: [
      'Ikki yo‘l bor: tezkor maydonga kirib notanish odamlar bilan o‘ynaysiz (ikkinchi odam kirgach 60 soniyalik sanoq boshlanadi) yoki bitta havola bilan butun davrani bir joyga yig‘asiz.',
      'O‘yin o‘zgarmaydi — o‘sha so‘z yoki o‘sha g‘uncha, faqat raqib ko‘p. Vaqtni server hisoblaydi, oxirida jadval tuziladi va aqcha o‘rin bo‘yicha taqsimlanadi.',
      'Maydon uchun hisob kerak: jadvalda taxallusingiz turadi va aqcha hisobingizga yoziladi. Saytda ochilgan maydonga telefondagi ilovadan ham qo‘shilish mumkin — o‘yin ikkala tomonda bitta.',
    ],
  },
  {
    path: '/turnir',
    title: 'Turnir — 8, 16 yoki 32 kishilik so‘z turniri | So‘zgir',
    description:
      'Turnir — ketma-ket bir necha mardu maydoni: har davradan yuqori yarmi o‘tadi. 32 kishi besh davrada bitta g‘olibga qisqaradi.',
    nav: 'Turnir',
    h1: 'Turnir',
    lead:
      'Turnir — ketma-ket bir necha mardu maydoni: har davrada odam ikki barobar kamayadi, sakkiztadan ko‘p bo‘lsa guruhlarga bo‘linadi va guruhlar bir vaqtda o‘ynaydi.',
    body: [
      'Hajmi uchta: 8 kishi — uch davra, 16 kishi — to‘rt davra, 32 kishi — besh davra. Har guruhdan yuqori yarmi o‘tadi, teng natijada ro‘yxatga oldinroq kirgani.',
      'Turnir ochgan odam kod oladi: qatnashchilar kod, havola yoki QR orqali qo‘shiladi. Yig‘ilish ikki soat davom etadi, boshlashni tashkilotchi bosadi.',
      'Har guruh jangi — oddiy mardu maydonining o‘zi: o‘sha so‘z yoki o‘sha g‘uncha, o‘sha jadval, o‘sha aqcha. Turnir faqat tartib beradi — kim kim bilan va kim keyingi davraga o‘tadi.',
      'Turnir uchun hisob kerak: o‘rin, aqcha va jadval hisobga yoziladi. Saytda ochilgan turnirga telefondagi ilovadan ham qo‘shilish mumkin.',
    ],
  },
  {
    path: '/qollab',
    title: 'Qo‘llab-quvvatlash — So‘zgir',
    description:
      'Ilova ichi xaridlari ham, obuna ham yo‘q. Loyihani hamjamiyat ko‘taradi: hisob ochiq turadi, qo‘llaganlar o‘yinda ajralib turadi.',
    nav: 'Qo‘llab-quvvatlash',
    h1: 'Loyihani hamjamiyat ko‘taradi',
    lead:
      'Ilova ichi xaridlari yo‘q, obuna yo‘q. Yig‘ilgan pul loyihani rivojlantirishga ketadi, hisob ochiq turadi. Qo‘llaganlar o‘yinda ajralib turadi — homiylik darajasi bilan.',
    body: [
      'Sahifada loyiha hisobi, qo‘llab-quvvatlaganlar ro‘yxati va homiylik darajalari ko‘rinadi.',
      'Homiylik darajalari yig‘indi bo‘yicha beriladi: Saxovatpesha — 5 000 so‘m, Boyvachcha — 20 000, Eski boylardan — 50 000, Zodagon — 150 000, Oqsuyak — 500 000. Daraja avatar atrofidagi halqa bilan ko‘rinadi.',
      'Qo‘llagan odamga reklama ko‘rsatilmaydi: oxirgi yetti kunlik qo‘llovlar 5 555 so‘mga yetsa, banner umuman so‘ralmaydi.',
      'Hisob ochiq turadi — qancha yig‘ilgani va kim qo‘llagani shu sahifada ko‘rinib turadi.',
    ],
  },
  {
    path: '/yangiliklar',
    title: 'Yangiliklar — So‘zgir',
    description:
      'So‘zgir saytida va ilovasida nima o‘zgardi: yangi o‘yinlar, nishonlar, aqcha islohoti va boshqa yangiliklar sanasi bilan.',
    nav: 'Yangiliklar',
    h1: 'Yangiliklar',
    lead:
      'So‘zgirda nima o‘zgardi — eng yangisidan boshlab. Faqat odam sezadigan o‘zgarishlar.',
    body: [
      'Ro‘yxatda saytdagi va ilovadagi o‘zgarishlar sanasi bilan turadi: yangi o‘yin rejimlari, nishonlar, aqcha islohoti, jangdagi tuzatishlar.',
    ],
  },
  {
    path: '/qollanma',
    title: 'So‘ztop qo‘llanmasi — qanday yutish kerak',
    description:
      'Qaysi so‘zdan boshlash kerak, urinishni qanday tejash mumkin va o‘zbek alifbosining qaysi joyi chalg‘itadi. Hammasi o‘yinning o‘z lug‘atidan olingan sonlar bilan.',
    nav: 'Qo‘llanma',
    h1: 'So‘ztop qo‘llanmasi',
    lead:
      'Qanday boshlash, urinishni qanday tejash va o‘zbek alifbosining qaysi joyi chalg‘itadi — hammasi o‘yinning o‘z lug‘atidan olingan sonlar bilan.',
    body: [
      'Qo‘llanmada uchta maqola bor: birinchi so‘zni tanlash, urinishlarni tejaydigan taktika va o‘zbek alifbosidagi qiyin joylar (SH, CH, O‘, G‘ va takror harflar).',
    ],
  },
  {
    path: '/javoblar',
    title: 'So‘ztop javoblari — bugungi so‘z va arxiv',
    description:
      'Bugungi So‘ztop javobi spoyler ostida: o‘ynab bo‘lgach oching. Ostida o‘tgan kunlar arxivi — har kunning so‘zi, raqami, sanasi va ma’nosi.',
    nav: 'Javoblar',
    h1: 'So‘ztop javoblari',
    lead:
      'Bugungi so‘z va o‘tgan kunlar arxivi. Javob yopiq turadi — o‘ynab bo‘lgach oching.',
    body: [
      'Kunlik so‘z butun O‘zbekiston uchun bir xil va yarim tunda almashadi. Shu sahifada bugungi javobni ochish, o‘tgan kunlarning so‘zlarini esa raqami, sanasi va ma’nosi bilan ko‘rish mumkin.',
      'Kelajakdagi so‘zlar ro‘yxatda yo‘q: arxivga faqat o‘ynab bo‘lingan kunlar tushadi.',
      'Arxiv lug‘at vazifasini ham o‘taydi: har so‘zning ma’nosi yonida turadi, shuning uchun o‘tgan kunlarni varaqlab turib yangi so‘z o‘rganish mumkin.',
      'Javob ataylab yopiq turadi — sahifani o‘ynashdan oldin ochgan odam o‘sha kunini o‘ziga buzib qo‘ymasin.',
    ],
  },
  {
    path: '/nishonlar',
    title: 'Nishonlar — So‘zgir',
    description:
      'So‘zgirdagi nishonlar: qaysi yutuq uchun qaysi belgi beriladi. Nishon aqcha bermaydi va hech narsani ochmaydi — bir marta olingach esa qaytarib olinmaydi.',
    nav: 'Nishonlar',
    h1: 'Nishonlar',
    lead:
      'Nishon — bir martalik yutuq belgisi. U aqcha bermaydi va hech narsani ochmaydi, lekin bir marta olingach hech qachon qaytarib olinmaydi.',
    body: [
      'Yigirmata nishon: kunlik ketma-ketlik, topilgan so‘zlar, jangdagi g‘alabalar, lug‘atning mavzulari va o‘yinning boshqa burchaklari uchun.',
      'Nishonlar sanoqlardan o‘zi hisoblanadi — alohida yig‘ish kerak emas. Kirgan odamda jangdagi natijalar ham hisobga qo‘shiladi.',
    ],
  },
  {
    path: '/privacy',
    title: 'Maxfiylik siyosati — So‘zgir',
    description:
      'So‘zgir qanday ma’lumot yig‘adi, nima uchun yig‘adi va uni qanday o‘chirish mumkin — o‘zbek, rus va ingliz tillarida.',
    nav: 'Maxfiylik siyosati',
    h1: 'Maxfiylik siyosati',
    lead:
      'Ilova va sayt qanday ma’lumot yig‘adi, nima uchun yig‘adi va uni qanday o‘chirish mumkin.',
  },
  {
    path: '/hisob-ochirish',
    title: 'Hisobni o‘chirish — So‘zgir',
    description:
      'So‘zgir hisobini va u bilan bog‘liq ma’lumotni qanday o‘chirish mumkin — ilova orqali ham, ilovasiz ham.',
    nav: 'Hisobni o‘chirish',
    h1: 'Hisobni o‘chirish',
    lead:
      'Bu sahifada So‘zgir ilovasining hisobini va u bilan bog‘liq ma’lumotni qanday o‘chirish mumkinligi yozilgan.',
    body: [
      'Eng tez yo‘l — ilovaning o‘zidan: profil bo‘limini oching, «Hisobni o‘chirish» tugmasini bosing va so‘ralgan tasdiqni bering.',
      'Telefoningizda ilova qolmagan bo‘lsa, hisob qaysi pochtaga ro‘yxatdan o‘tgan bo‘lsa o‘sha pochtadan bizga yozing — so‘rovni 30 kun ichida bajaramiz.',
    ],
  },
  {
    path: '/contact',
    title: 'Aloqa — So‘zgir',
    description:
      'Taklif, xatolik yoki hamkorlik bo‘yicha bizga yozing — odatda bir-ikki kun ichida javob beramiz.',
    nav: 'Aloqa',
    h1: 'Bizga yozing',
    lead:
      'Taklif, xatolik yoki hamkorlik — hammasini o‘qiymiz. Odatda bir-ikki kun ichida javob beramiz.',
    body: [
      'Yozishning uch yo‘li bor: shu sahifadagi shakl, elektron pochta va Telegram kanali. Shakl orqali kelgan xat o‘sha pochtaga tushadi, ya’ni qaysi birini tanlasangiz ham javob bitta joydan keladi.',
      'Ma’lumotlaringiz bo‘yicha so‘rov — hisobdagi ma’lumotni olish yoki o‘chirish — ham shu yerdan yuboriladi. Nima saqlanishi va qancha turishi maxfiylik siyosatida yozilgan.',
    ],
  },
  {
    path: '/oyinchi',
    title: 'O‘yinchi — So‘zgir',
    description:
      'O‘yinchining ochiq profili: yig‘ilgan aqcha, bugungi kunlik natija, jang aqchasi va loyihaga qo‘shgan hissasi.',
    nav: 'O‘yinchi profili',
    h1: 'O‘yinchi profili',
    lead:
      'Yig‘ilgan aqcha, bugungi kunlik natija, jang aqchasi va loyihaga qo‘shgan hissasi. Shaxsiy statistika faqat egasiga ko‘rinadi.',
    body: [
      'Profil reytingdan, jang natijasidan va qo‘llab-quvvatlaganlar ro‘yxatidan ochiladi — har o‘yinchining o‘z manzili bor.',
      'Ochiq profilda faqat o‘yinchining o‘zi ko‘rsatishga rozi bo‘lgan narsa turadi: taxallus, yig‘ilgan aqcha, nishonlar va homiylik darajasi. Elektron pochta va shunga o‘xshash ma’lumot hech qachon ko‘rinmaydi.',
    ],
    // Manzil parametrli (`/oyinchi/{uid}`) — oldindan yasab bo'lmaydi.
    listed: false,
    file: true,
  },
  {
    path: '/shikoyat',
    title: 'Shikoyat — So‘zgir',
    description:
      'So‘z haqida xabar berish va o‘yinchi ustidan shikoyat. Murojaatni moderator o‘qib chiqadi.',
    nav: 'Shikoyat',
    h1: 'Shikoyat',
    lead:
      'So‘z haqida xabar berish va o‘yinchi ustidan shikoyat — sabab tanlanadi, izoh ixtiyoriy.',
    body: [
      'Shikoyat moderatsiya navbatiga tushadi: chora darhol ko‘rilmaydi, qarorni odam qabul qiladi. Avtomatik chora noto‘g‘ri shikoyat bilan begunoh odamni jazolab qo‘yardi.',
      'Murojaat hisobga bog‘lanadi: kim yuborganini moderator ko‘radi, aks holda bitta odam boshqasini cheksiz shikoyat qila olardi.',
    ],
    // Manzil parametrli (`/shikoyat/soz/{so'z}`) — oldindan yasab
    // bo'lmaydi, lekin `vercel.json` aynan shu faylga yo'naltiradi.
    listed: false,
    file: true,
  },
  {
    path: '/soztop',
    title: 'Yashirilgan so‘z — So‘zgir',
    description:
      'Do‘stingiz So‘zgirda yashirgan so‘zni shu yerda, brauzerda toping. Ranglar o‘sha qoidada: uzunlik + 1 urinish.',
    nav: 'Yashirilgan so‘z',
    h1: 'Yashirilgan so‘z',
    lead:
      'Do‘stingiz bitta so‘z yashirdi — uni oddiy o‘yindagidek toping: uzunlik + 1 urinish.',
    body: [
      'So‘zTop — ilovadagi modul: odam lug‘atdan bitta so‘z tanlab yashiradi va havolasini do‘stlariga tashlaydi. Havolani ochgan odam o‘sha so‘zni topadi, yashirgan odam esa kim necha urinishda topganini ko‘rib turadi.',
      'Yashirilgan so‘z serverda qoladi: uni o‘yindan tashqari hech kim ko‘rolmaydi. Bu bo‘limda ball va reyting yo‘q — so‘zni o‘zingiz tanlaganingiz uchun ball berilsa, uni o‘z-o‘ziga ishlab olish yo‘li ochilardi.',
    ],
    // Har kodda boshqa so'z — oldindan yasab bo'lmaydi, lekin fayli
    // kerak: `/soztop/{KOD}` aynan shunga yo'naltiriladi.
    listed: false,
    file: true,
  },
] as const satisfies readonly Page[];

/** Uzunlik bo'yicha sahifalar (`/cheksiz/6-harf`) matni `data/lengths.ts`
 *  da turadi: uni sahifaning o'zi ham, statik HTML ham o'qiydi. Shu
 *  sabab ro'yxat qo'lda takrorlanmaydi — yozuvlar shu yerda yasaladi. */
const LENGTH_ENTRIES: Page[] = LENGTH_PAGES.map((page) => ({
  path: page.path,
  title: page.title,
  description: page.description,
  nav: page.h1,
  h1: page.h1,
  lead: page.lead,
  body: [...page.body],
}));

/** Qo'llanma maqolalari ham shu tartibda: matni `data/guides.ts` da,
 *  bu yerda esa sahifa yozuvi yasaladi. Statik HTML uchun maqolaning
 *  birinchi bo'limlari matn sifatida olinadi — robot ko'radigan matn
 *  odam ko'radigani bilan bir xil bo'lishi shart. */
const GUIDE_ENTRIES: Page[] = GUIDES.map((guide) => ({
  path: guide.path,
  title: guide.title,
  description: guide.description,
  nav: guide.h1,
  h1: guide.h1,
  lead: guide.lead,
  body: guide.sections.flatMap((section) => [section.h2, ...section.body]),
}));

/** Lug'at bo'limi: bosh sahifa va har harf uchun bittadan sahifa.
 *
 *  Matni `data/lugat.ts` da. Harf sahifalarining **so'zlar ro'yxati**
 *  bu yerga tushmaydi: u serverdagi lug'atdan keladi va build paytida
 *  `vite/prerender.ts` qo'shadi. Shu sabab `body` da faqat kirish
 *  matni turadi — ro'yxatsiz ham o'qiladigan, lekin sahifaning
 *  mazmunini ro'yxat beradi. */
const LUGAT_ENTRIES: Page[] = [
  {
    path: LUGAT_INDEX.path,
    title: LUGAT_INDEX.title,
    description: LUGAT_INDEX.description,
    nav: 'Lug‘at',
    h1: LUGAT_INDEX.h1,
    lead: LUGAT_INDEX.lead,
    body: [...LUGAT_INDEX.body],
  },
  ...LUGAT_PAGES.map((page) => ({
    path: page.path,
    title: page.title,
    description: page.description,
    nav: page.h1,
    h1: page.h1,
    lead: page.lead,
    body: [...page.body],
  })),
];

export const PAGES: readonly Page[] = [
  ...BASE_PAGES,
  ...LENGTH_ENTRIES,
  ...GUIDE_ENTRIES,
  ...LUGAT_ENTRIES,
];

/** Manzillar — router va `sitemap.xml` uchun. */
export type Route =
  | (typeof BASE_PAGES)[number]['path']
  | LengthPath
  | GuidePath
  | typeof LUGAT_PATH
  | LugatLetterPath;

export const pageOf = (path: string): Page | undefined =>
  PAGES.find((page) => page.path === path);

/** Manzil `sitemap.xml` ga va o'z HTML fayliga tushadimi.
 *
 *  Yordamchi kerak, chunki `PAGES` — `as const`: maydoni yo'q yozuvda
 *  `listed` xususiyati ham bo'lmaydi va uni to'g'ridan-to'g'ri o'qib
 *  bo'lmaydi. Bu yerda esa yozuv avval `Page` ga keltiriladi. */
export const isListed = (page: Page): boolean => page.listed !== false;
