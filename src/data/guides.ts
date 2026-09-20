/** Qo'llanmalar — `/qollanma` va uning maqolalari.
 *
 *  Nega kerak: «qanday yutish kerak», «qaysi so'zdan boshlash kerak»
 *  degan savollar qidiruvda o'yinning o'z nomidan kam so'ralmaydi.
 *  Javobi yo'q sayt o'sha odamni boshqa saytga yuboradi va u qaytib
 *  kelmaydi.
 *
 *  Matndagi **hamma son o'lchangan**: ular So'zgirning o'z lug'atidan
 *  (5 harfli 1 753 javob) hisoblab chiqarilgan, boshqa tildagi
 *  Wordle'dan ko'chirilgan emas. Umumiy maslahat («ko'p unli ishlating»)
 *  hamma joyda bor; o'zbek tilidagi aniq son esa faqat shu yerda.
 *
 *  Matn shu faylda turadi, chunki uni ikki joy o'qiydi: sahifaning o'zi
 *  va build paytida yasaladigan statik HTML (`data/pages.ts`). */

export interface GuideSection {
  h2: string;
  body: string[];
  /** Qatorlar ro'yxati — matndan keyin. */
  list?: string[];
}

export interface Guide {
  path: GuidePath;
  /** Ro'yxatdagi va sahifadagi sarlavha. */
  h1: string;
  /** `<title>`. */
  title: string;
  description: string;
  lead: string;
  /** Ro'yxatdagi bir qatorlik ta'rif. */
  tagline: string;
  sections: GuideSection[];
}

export const GUIDE_PATHS = [
  '/qollanma/birinchi-soz',
  '/qollanma/taktika',
  '/qollanma/qiyin-sozlar',
] as const;

export type GuidePath = (typeof GUIDE_PATHS)[number];

export const GUIDES: Guide[] = [
  {
    path: '/qollanma/birinchi-soz',
    h1: 'Qaysi so‘zdan boshlagan ma’qul',
    title: 'So‘ztopda birinchi so‘z — qaysi biri yaxshi | So‘zgir',
    description:
      'Birinchi urinish javobni topish uchun emas, harflarni ochish uchun. O‘zbek lug‘atidagi eng ko‘p uchraydigan harflar va ular asosidagi yaxshi start so‘zlari.',
    lead:
      'Birinchi urinish javobni topish uchun emas — u harflarni ochish uchun. Shuning uchun undan ko‘p narsa talab qilmaslik kerak: u faqat keyingi urinishlarni oson qilsa bo‘ldi.',
    tagline: 'Eng ko‘p uchraydigan harflar va yaxshi start so‘zlari',
    sections: [
      {
        h2: 'Yaxshi birinchi so‘zning bitta sharti bor',
        body: [
          'Yaxshi start so‘zi — harflari takrorlanmaydigan so‘z. Sabab oddiy: takrorlangan harf bitta katakni tekshiradi, boshqasi esa yangi ma’lumot bermaydi. «Aloqa» beshta katakni to‘ldiradi, lekin tekshiradigani to‘rtta harf: «a» ikki marta keladi.',
          'Ikkinchi shart — harflar ko‘p uchraydigan bo‘lsin. Nodir harf (j, f, x) javobda kamdan-kam uchraydi, ya’ni u ko‘pincha «yo‘q» degan javob beradi. Bu ham ma’lumot, lekin arzoni.',
        ],
      },
      {
        h2: 'O‘zbek tilida eng ko‘p uchraydigan harflar',
        body: [
          'So‘zgirning 5 harfli lug‘atida 1 753 ta javob bor. Ulardagi harflarni sanab chiqsak, tartib shunday bo‘ladi:',
        ],
        list: [
          'A — javoblarning yarmidan ko‘pida (53%) bor',
          'O (48%) va I (40%) — keyingi ikkitasi',
          'R, T, L, N, M — eng foydali undoshlar',
          'U, Q va K — foydali, lekin yuqoridagilardan sezilarli kam',
        ],
      },
      {
        h2: 'Tayyor start so‘zlari',
        body: [
          'Quyidagi so‘zlar beshta **turli** harfdan iborat va ularning harflari eng ko‘p uchraydiganlar qatoridan. Ya’ni birinchi urinishdayoq taxtaning yarmi ochiladi:',
        ],
        list: ['OLIMA', 'OQILA', 'IBORA', 'IRODA', 'DOIRA', 'QOIDA', 'ILOVA', 'AHOLI'],
      },
      {
        h2: 'Ikkinchi so‘z birinchisiga qarab tanlanadi',
        body: [
          'Agar birinchi urinish kam narsa ochgan bo‘lsa, ikkinchisida ham **yangi** harflarni sinang: bitta sariq harfni katakdan katakka ko‘chirib chiqishdan ko‘ra, beshta yangi harfni tekshirish foydaliroq.',
          'Javoblarning 94 foizida aynan ikkita unli bo‘ladi. Shuning uchun uchta unlili so‘z bilan boshlash odatda ortiqcha: uchinchi unli deyarli har doim «yo‘q» chiqadi.',
        ],
      },
      {
        h2: 'So‘z oxiriga e’tibor bering',
        body: [
          'Beshta javobdan bittasi «a» harfi bilan tugaydi — bu o‘zbek tilidagi eng ko‘p uchraydigan oxir. Undan keyin n, i, r va q keladi.',
          'So‘z boshida esa boshqa manzara: eng ko‘p t, s, q, k va m turadi. Ya’ni birinchi katak uchun undosh, oxirgisi uchun unli taxmin qilish ko‘pincha to‘g‘ri chiqadi.',
        ],
      },
    ],
  },
  {
    path: '/qollanma/taktika',
    h1: 'Taktika: urinishni behuda sarflamaslik',
    title: 'So‘ztop taktikasi — urinishlarni qanday tejash | So‘zgir',
    description:
      'Sariq harfni qayerga qo‘yish kerak, qachon «tekshiruvchi» so‘z aytish kerak va oxirgi urinishni qanday saqlab qolish mumkin.',
    lead:
      'Ko‘pincha o‘yin harf yetishmaganidan emas, urinish yetishmaganidan yutqaziladi. Quyidagi bir necha qoida aynan urinishni tejaydi.',
    tagline: 'Sariq harf, tekshiruvchi so‘z va oxirgi urinish',
    sections: [
      {
        h2: 'Sariq harfni eski joyiga qaytarmang',
        body: [
          'Katak sariq bo‘ldi — demak harf so‘zda bor, lekin **aynan o‘sha joyda emas**. Uni o‘sha katakka qayta qo‘yish urinishni bekorga sarflaydi.',
        ],
      },
      {
        h2: 'Klaviatura — tayyor shpargalka',
        body: [
          'Ekrandagi klaviatura tekshirilgan harflarni eslab qoladi: kulrang tugmani qayta yozishning hojati yo‘q, sariqlari esa yangi joy kutib turadi. Uzun o‘yinda aynan shu narsa eng ko‘p vaqt tejaydi.',
        ],
      },
      {
        h2: 'Takror harfni unutmang',
        body: [
          'So‘zgirning 5 harfli javoblaridan 41 foizida bir harf ikki marta keladi: «aloqa», «amaki», «afzal». Har bir katak alohida hisoblanadi, ya’ni bitta harf bir katakda yashil, boshqasida kulrang bo‘lishi mumkin.',
          'Shuning uchun «bu harf allaqachon topildi» degan fikr bilan uni ro‘yxatdan o‘chirib qo‘ymang.',
        ],
      },
      {
        h2: 'Qolgan variantlar ko‘p bo‘lsa — tekshiruvchi so‘z ayting',
        body: [
          '«_ALLA» ochildi, javob esa kalla, malla, palla yoki salla bo‘lishi mumkin. Bitta-bitta taxmin qilish urinishlarni yeydi: har bir xato javob faqat bitta variantni o‘chiradi.',
          'O‘rniga shubhali harflarni **birdan** tekshiradigan so‘z ayting — masalan «kompas» K, M, P va S ni bitta urinishda sinab ko‘radi. Javob bo‘lmasligini bilsangiz ham: bitta urinish uch-to‘rt variantni birdan yopadi.',
        ],
      },
      {
        h2: 'Oxirgi urinishga shoshilmang',
        body: [
          'Oxirgi urinishdan oldin qolgan variantlarni yozib chiqing va ular **bir-biridan farq qiladigan** harf bo‘yicha tanlang. Bir xil ehtimolli ikki so‘z qolsa, tanlov tavakkal bo‘ladi — lekin unga qadar tavakkalni kamaytirish mumkin.',
          'Kunlik o‘yinda shoshilishning ma’nosi ham yo‘q: soat sanamaydi, urinish esa sanaladi.',
        ],
      },
    ],
  },
  {
    path: '/qollanma/qiyin-sozlar',
    h1: 'Qiyin joylar: SH, CH, O‘, G‘ va takror harflar',
    title: 'So‘ztopdagi qiyin so‘zlar va o‘zbek alifbosi | So‘zgir',
    description:
      'SH, CH, O‘ va G‘ — bitta harf va bitta katak. Takror harflar, tutuq belgisi va qiyin so‘zlar bilan qanday ishlash kerak.',
    lead:
      'So‘ztop o‘zbek alifbosiga moslangan va aynan shu narsa boshqa tildagi Wordle’dan kelgan odamni chalg‘itadi.',
    tagline: 'O‘zbek alifbosi va uning tuzoqlari',
    sections: [
      {
        h2: 'Bitta tovush — bitta katak',
        body: [
          'SH, CH, O‘ va G‘ — o‘zbek tilida bitta tovush, shuning uchun o‘yinda ham bitta katak va klaviaturada bitta tugma. Ya’ni «boshqa» — besh harfli so‘z: B-O-SH-Q-A.',
          'Kompyuter klaviaturasida ularni ikki tugma bilan yozsa bo‘ladi: s+h → SH, c+h → CH, o+’ → O‘, g+’ → G‘. Yozilgan zahoti ular bitta katakka birlashadi.',
          'Javoblarning 17 foizida shu to‘rt harfdan kamida bittasi bor, ya’ni ularni «nodir» deb hisoblab bo‘lmaydi.',
        ],
      },
      {
        h2: 'Tutuq belgisi (’) harf emas',
        body: [
          '«San’at» so‘zidagi tutuq belgisi alohida katak egallamaydi va uni yozish ham shart emas — o‘yin uni o‘zi hisobga oladi.',
        ],
      },
      {
        h2: 'Takror harf — eng ko‘p uchraydigan tuzoq',
        body: [
          'Javoblarning 41 foizida bir harf ikki marta keladi. Odam odatda bunday so‘zni oxirigacha o‘ylamaydi: «a» topildi, demak boshqa «a» yo‘q deb hisoblaydi va javobni o‘tkazib yuboradi.',
          'Agar barcha harflar ochilgan-u, so‘z yig‘ilmayotgan bo‘lsa — birinchi navbatda shu ehtimolni tekshiring.',
        ],
      },
      {
        h2: 'Uzun taxta qisqaroq bo‘lib chiqadi',
        body: [
          '7 harfli rejimda «qorachiq» yozuvda to‘qqizta belgi, taxtada esa yettita katak. Shuning uchun uzun so‘zlar ko‘rinishidan qo‘rqmaslik kerak — ular ko‘pincha o‘ylagandan qisqa.',
        ],
      },
      {
        h2: 'So‘z qabul qilinmasa',
        body: [
          'Lug‘at katta, lekin cheksiz emas: 5 harfli rejimda 9 600 dan ortiq so‘z qabul qilinadi. Shunga qaramay biror so‘z noo‘rin rad etilsa yoki ma’nosi noto‘g‘ri bo‘lsa, o‘yin oxiridagi «So‘z haqida xabar berish» orqali yuboring — lug‘at aynan shu xabarlar bilan to‘ldiriladi.',
        ],
      },
    ],
  },
];

export const guideOf = (path: string): Guide | null =>
  GUIDES.find((guide) => guide.path === path) ?? null;
