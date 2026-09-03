/** Maxfiylik siyosati matni. Ingliz tilidagi variant — do'konlarga
 *  topshirilgan asl hujjat, o'zbekchasi shuning tarjimasi.
 *  Blok `string` bo'lsa — xatboshi, `string[]` bo'lsa — ro'yxat. */

import { email } from './site';

export type Block = string | string[];

export type PolicySection = {
  title: string;
  blocks: Block[];
};

export type Policy = {
  label: string;
  title: string;
  updated: string;
  intro: string;
  meta: string[];
  sections: PolicySection[];
};

const uz: Policy = {
  label: 'O‘zbekcha',
  title: 'Maxfiylik siyosati',
  updated: 'Oxirgi yangilanish: 2026-yil 1-sentabr',
  intro:
    'So‘zgir («ilova») — o‘zbek tilidagi so‘z o‘yinlari to‘plami. Uning ichida So‘ztop moduli (so‘z topish) va Yangso‘z moduli (yangi so‘z o‘ylab topish bo‘yicha haftalik tanlov) bor. Bu hujjatda ilova qanday ma’lumot yig‘ishi, nima uchun yig‘ishi va uni qanday o‘chirish mumkinligi tushuntirilgan.',
  meta: ['Ishlab chiquvchi: Samandar Ahadjonov', `Aloqa: ${email}`],
  sections: [
    {
      title: '1. Hisobsiz o‘ynash',
      blocks: [
        'Ilovada hisob ochmasdan ham to‘liq o‘ynash mumkin. Bunday holda natijalaringiz, statistikangiz va sozlamalaringiz faqat qurilmangizda qoladi va hech qayerga yuklanmaydi.',
      ],
    },
    {
      title: '2. Qanday ma’lumot yig‘iladi',
      blocks: [
        'Agar hisob ochsangiz:',
        [
          'elektron pochta — hisobga kirish va unga qayta kirishni tiklash uchun;',
          'taxallus — reytingda ballingiz yonida ko‘rinadi (uni o‘zingiz tanlaysiz);',
          'foydalanuvchi identifikatori — hisobingizni o‘yin ma’lumotlaringizga bog‘lovchi anonim ID.',
        ],
        'O‘yin ma’lumotlari:',
        [
          'topgan so‘zlaringiz, yig‘ilgan ballar, urinishlar soni, statistika va kunlik streaklar;',
          'kunlik va umumiy reytingni tuzish uchun ishlatiladigan natijalar (taxallusingiz va ballingiz boshqa o‘yinchilarga ko‘rinadi);',
          'Yangso‘z tanloviga yuborgan so‘zlaringiz va izohlaringiz hamda bergan ovozlaringiz (takliflar ovoz berish uchun boshqa o‘yinchilarga ko‘rsatiladi; g‘olib so‘z muallifi taxallusi bilan qayd etiladi).',
        ],
        'Texnik ma’lumotlar:',
        [
          '«o‘yin boshlandi» yoki «o‘yin tugadi» kabi foydalanish hodisalari — Google Analytics for Firebase orqali;',
          'ilovadagi nosozliklarni tuzatish uchun ishlatiladigan xatolik va yiqilish hisobotlari — Firebase Crashlytics orqali.',
        ],
        'Ilova joylashuv, kontaktlar, suratlar, fayllar, mikrofon ovozi, sog‘liq ma’lumotlari va reklama identifikatorlarini yig‘maydi. Ilovada reklama ham, ilova ichi xaridlari ham yo‘q.',
      ],
    },
    {
      title: '3. Ma’lumot nima uchun ishlatiladi',
      blocks: [
        [
          'natijalaringizni saqlash va boshqa qurilmada hisobga kirganingizda tiklash uchun;',
          'kunlik va umumiy reytingni tuzish uchun;',
          'Yangso‘z tanlovini o‘tkazish uchun (moderatsiya, ovoz berish, g‘olibni e’lon qilish);',
          'yiqilish va xatoliklarni topib tuzatish uchun;',
          'ilova umumiy holda qanday ishlatilayotganini tushunish uchun.',
        ],
        'Ma’lumotlaringiz reklama uchun ishlatilmaydi, sotilmaydi va marketing maqsadida uchinchi tomonlarga berilmaydi.',
      ],
    },
    {
      title: '4. Ma’lumot kim bilan bo‘lishiladi',
      blocks: [
        'Ma’lumotlar Google Firebase xizmatlarida (Authentication, Cloud Firestore, Analytics, Crashlytics) saqlanadi va qayta ishlanadi. Google bu ma’lumotni bizning nomimizdan, xizmat ko‘rsatuvchi sifatida qayta ishlaydi: https://firebase.google.com/support/privacy',
        'Taxallusingiz va ballingiz reytingda boshqa o‘yinchilarga ko‘rinadi, Yangso‘zga yuborgan so‘zlaringiz esa ovoz berish uchun boshqalarga ko‘rsatiladi. Elektron pochtangiz boshqa foydalanuvchilarga hech qachon ko‘rsatilmaydi.',
      ],
    },
    {
      title: '5. Ma’lumot qancha vaqt saqlanadi',
      blocks: [
        'Ma’lumot hisobingiz mavjud bo‘lgan davrda saqlanadi. Hisobingizni o‘chirsangiz, unga bog‘liq ma’lumotlar — statistika, topilgan so‘zlar, profil va reytingdagi yozuvlar — o‘chiriladi. Sizni aniqlab bo‘lmaydigan, jamlangan anonim analitika saqlanib qolishi mumkin.',
      ],
    },
    {
      title: '6. Sizning huquqlaringiz',
      blocks: [
        [
          'Ko‘rish: statistikangiz va topgan so‘zlaringizning to‘liq ro‘yxati ilovadagi Profil bo‘limida mavjud.',
          'O‘chirish: Profil > Hisobni o‘chirish. Bu hisobingizni va undagi bulut ma’lumotlarini butunlay o‘chiradi. Amalni qaytarib bo‘lmaydi.',
          'Chiqish: Profil > Chiqish. Bulutdagi natijalar qurilmada yashiriladi va qayta kirganingizda tiklanadi.',
          'Sozlamalar: haptik javobni Profil > Sozlamalar bo‘limida o‘chirish mumkin.',
          `So‘rovlar: ma’lumotlaringiz haqidagi har qanday savol bilan ${email} manziliga yozing. 30 kun ichida javob beramiz.`,
        ],
      ],
    },
    {
      title: '7. Bolalar',
      blocks: [
        'Ilova mazmuni barcha yosh uchun mos, ammo hisob ochish 13 yosh va undan katta foydalanuvchilar uchun mo‘ljallangan. 13 yoshga to‘lmagan bolalarning shaxsiy ma’lumotlarini bila turib yig‘maymiz. Agar bola hisob ochgan deb hisoblasangiz, bizga xabar bering — hisobni o‘chiramiz.',
      ],
    },
    {
      title: '8. Ma’lumot xavfsizligi',
      blocks: [
        'Ma’lumot shifrlangan ulanish (HTTPS/TLS) orqali uzatiladi va Google Firebase’da, har bir foydalanuvchi faqat o‘z ma’lumotini o‘qish va yozish huquqiga ega bo‘ladigan qoidalar bilan saqlanadi. Parollar Firebase Authentication tomonidan boshqariladi va ilovaning o‘zida hech qachon saqlanmaydi.',
      ],
    },
    {
      title: '9. Siyosatdagi o‘zgarishlar',
      blocks: [
        'Bu siyosat o‘zgarsa, hujjat boshidagi yangilanish sanasi ham o‘zgaradi. Muhim o‘zgarishlar ilova ichida ham e’lon qilinadi.',
      ],
    },
  ],
};

const en: Policy = {
  label: 'English',
  title: 'Privacy policy',
  updated: 'Last updated: September 1, 2026',
  intro:
    'So‘zgir ("the app") is a collection of Uzbek-language word games. It contains the So‘ztop module (word guessing) and the Yangso‘z module (a weekly contest for coining new words). This document explains what data the app collects, why it is collected, and how you can remove it.',
  meta: ['Developer: Samandar Ahadjonov', `Contact: ${email}`],
  sections: [
    {
      title: '1. Playing without an account',
      blocks: [
        'You can play the app fully without creating an account. In that case your results, statistics and settings stay only on your device and are not uploaded anywhere.',
      ],
    },
    {
      title: '2. Data we collect',
      blocks: [
        'If you create an account:',
        [
          'email address — used to sign in and to recover access to your account;',
          'nickname — shown next to your score in the leaderboard (you choose it yourself);',
          'user identifier — an anonymous ID that links your account to your game data.',
        ],
        'Game data:',
        [
          'words you have found, points earned, number of attempts, statistics and daily streaks;',
          'results used to build the daily and all-time leaderboards (your nickname and score are visible to other players);',
          'words and explanations you submit to the Yangso‘z contest, and the votes you cast (submissions are shown to other players for voting; the author of a winning word is credited by nickname).',
        ],
        'Technical data:',
        [
          'usage events such as "game started" or "game finished", collected through Google Analytics for Firebase;',
          'crash and error reports, collected through Firebase Crashlytics, used to fix problems in the app.',
        ],
        'The app does not collect location, contacts, photos, files, microphone audio, health data, or advertising identifiers. The app contains no ads and no in-app purchases.',
      ],
    },
    {
      title: '3. Why the data is used',
      blocks: [
        [
          'to save your results and restore them when you sign in on another device;',
          'to build the daily and all-time leaderboards;',
          'to run the Yangso‘z contest (moderation, voting, announcing a winner);',
          'to find and fix crashes and errors;',
          'to understand in aggregate how the app is used.',
        ],
        'Your data is not used for advertising, is not sold, and is not shared with third parties for marketing purposes.',
      ],
    },
    {
      title: '4. Who the data is shared with',
      blocks: [
        'Data is stored and processed in Google Firebase services (Authentication, Cloud Firestore, Analytics, Crashlytics). Google processes this data on our behalf as a service provider; see https://firebase.google.com/support/privacy',
        'Your nickname and score are visible to other players in the leaderboard, and words you submit to Yangso‘z are shown to other players for voting. Your email address is never shown to other users.',
      ],
    },
    {
      title: '5. How long the data is kept',
      blocks: [
        'Data is kept while your account exists. If you delete your account, the data associated with it — statistics, found words, profile and leaderboard entries — is deleted. Aggregated, anonymous analytics that cannot identify you may be retained.',
      ],
    },
    {
      title: '6. Your rights and choices',
      blocks: [
        [
          'Access: your statistics and the full list of words you have found are available in the app under Profile.',
          'Deletion: Profile > Delete account. This permanently deletes your account and its cloud data. The action cannot be undone.',
          'Sign out: Profile > Sign out. Cloud results become hidden on the device and are restored when you sign in again.',
          'Settings: haptic feedback can be turned off in Profile > Settings.',
          `Requests: for any question about your data, write to ${email}. We answer within 30 days.`,
        ],
      ],
    },
    {
      title: '7. Children',
      blocks: [
        'The app’s content is suitable for all ages, but creating an account is intended for users 13 years or older. We do not knowingly collect personal data from children under 13. If you believe a child has created an account, contact us and we will delete it.',
      ],
    },
    {
      title: '8. Data security',
      blocks: [
        'Data is transmitted over encrypted connections (HTTPS/TLS) and stored in Google Firebase with access rules that allow each user to read and write only their own data. Passwords are handled by Firebase Authentication and are never stored by the app itself.',
      ],
    },
    {
      title: '9. Changes to this policy',
      blocks: [
        'If this policy changes, the updated date at the top of the document will change. Significant changes will also be announced inside the app.',
      ],
    },
  ],
};

export type PolicyLang = 'uz' | 'en';

export const policies: Record<PolicyLang, Policy> = { uz, en };
