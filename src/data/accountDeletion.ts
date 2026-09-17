/** Hisobni o'chirish sahifasi.
 *
 *  Google Play «Account deletion URL» maydoni shu sahifaga qaraydi:
 *  hisob yaratish mumkin bo'lgan ilova uni ko'rsatishi shart va sahifa
 *  kirishsiz ochilishi kerak.
 *
 *  Matn maxfiylik siyosati bilan bir turda (`Policy`), shuning uchun
 *  ikkalasi bitta ko'rinishni ishlatadi. */

import type { Policy } from './privacy';
import { email } from './site';

const uz: Policy = {
  label: 'O‘zbekcha',
  title: 'Hisobni o‘chirish',
  updated: 'Oxirgi yangilanish: 2026-yil 13-sentabr',
  intro:
    'Bu sahifada So‘zgir ilovasining hisobini va u bilan bog‘liq ma’lumotni qanday o‘chirish mumkinligi yozilgan.',
  meta: ['Ilova: So‘zgir', `Aloqa: ${email}`],
  sections: [
    {
      title: 'Ilova orqali',
      blocks: [
        'Eng tez yo‘l — ilovaning o‘zidan. Profil bo‘limini oching, «Hisobni o‘chirish» tugmasini bosing va so‘ralgan tasdiqni bering.',
        'Amal darhol bajariladi va qaytarib bo‘lmaydi.',
      ],
    },
    {
      title: 'Ilovasiz',
      blocks: [
        `Telefoningizda ilova qolmagan bo‘lsa, hisob qaysi pochtaga ro‘yxatdan o‘tgan bo‘lsa o‘sha pochtadan bizga yozing: ${email}. Xatga taxallusingizni ham qo‘shing.`,
        'So‘rovni 30 kun ichida bajaramiz va bajarilgani haqida javob yozamiz. Boshqa pochtadan kelgan so‘rovni bajarmaymiz: hisob egasi ekaningizni tasdiqlashning boshqa yo‘li yo‘q.',
      ],
    },
    {
      title: 'Hisobni saqlab, ma’lumotni o‘chirish',
      blocks: [
        'Hisobni yo‘qotmasdan ham ma’lumotingizning bir qismini o‘chirishni so‘rashingiz mumkin. Masalan:',
        [
          'o‘yin statistikangiz va kunlik faolligingiz;',
          'topilgan so‘zlar ro‘yxati;',
          'reyting jadvallaridagi yozuvlaringiz;',
          'profil rasmingiz — buni ilovaning o‘zidan ham o‘chirsa bo‘ladi.',
        ],
        `So‘rovni ro‘yxatdan o‘tgan pochtangizdan ${email} manziliga yuboring va nimani o‘chirish kerakligini yozing. Hisobingiz o‘z joyida qoladi, o‘yinni davom ettiraverasiz.`,
      ],
    },
    {
      title: 'Nima o‘chiriladi',
      blocks: [
        'Hisob o‘chirilganda quyidagilar butunlay yo‘qoladi:',
        [
          'hisobning o‘zi — kirish uchun pochta va parol;',
          'profilingiz — taxallus, profil rasmi va boshqa ma’lumotlar;',
          'o‘yin statistikangiz — har bir rejim va so‘z uzunligi bo‘yicha natijalar, seriyalar, urinishlar taqsimoti;',
          'kunlik faolligingiz — qaysi kunlari o‘ynaganingiz.',
        ],
        'Qurilmangizdagi sozlamalar va saqlangan o‘yin ilovani o‘chirganingizda ketadi.',
      ],
    },
    {
      title: 'Nima darhol o‘chmaydi',
      blocks: [
        'Ba’zi yozuvlar boshqa o‘yinchilar bilan umumiy bo‘lgani uchun avtomatik o‘chmaydi:',
        [
          'reyting jadvallaridagi yozuvlar — o‘tgan kunlarning natijalari;',
          'topilgan so‘zlar ro‘yxati;',
          'o‘ynagan janglaringiz — ularda raqibingizning natijasi ham bor.',
        ],
        `Bularni ham o‘chirishni istasangiz, ${email} manziliga yozing va so‘rovda buni alohida ayting — qo‘lda o‘chiramiz.`,
        'Qo‘llab-quvvatlash to‘lovlari haqidagi yozuvlar buxgalteriya talabi bo‘yicha saqlanadi va hisob o‘chirilganda ham qoladi. Ular ismingizga emas, to‘lov identifikatoriga bog‘langan.',
      ],
    },
  ],
};

const en: Policy = {
  label: 'English',
  title: 'Delete your account',
  updated: 'Last updated: September 13, 2026',
  intro:
    'This page explains how to delete your So‘zgir account and the data linked to it.',
  meta: ['App: So‘zgir', `Contact: ${email}`],
  sections: [
    {
      title: 'From the app',
      blocks: [
        'The quickest way is inside the app. Open the Profile tab, tap “Hisobni o‘chirish” (Delete account) and confirm.',
        'The action takes effect immediately and cannot be undone.',
      ],
    },
    {
      title: 'Without the app',
      blocks: [
        `If you no longer have the app installed, email us from the address the account was registered with: ${email}. Include your nickname.`,
        'We complete such requests within 30 days and reply once it is done. Requests sent from a different address are not carried out: there is no other way to confirm that you own the account.',
      ],
    },
    {
      title: 'Deleting data while keeping the account',
      blocks: [
        'You can also ask us to delete part of your data without losing the account. For example:',
        [
          'your game statistics and daily activity;',
          'the list of words you have found;',
          'your entries in the leaderboards;',
          'your profile photo — this one can also be removed inside the app.',
        ],
        `Email ${email} from your registered address and say what should be removed. Your account stays in place and you can keep playing.`,
      ],
    },
    {
      title: 'What is deleted',
      blocks: [
        'Deleting the account removes the following permanently:',
        [
          'the account itself — the sign-in email and password;',
          'your profile — nickname, profile photo and other details;',
          'your game statistics — results per mode and word length, streaks, guess distribution;',
          'your daily activity — which days you played.',
        ],
        'Settings and the saved game stored on your device go away when you uninstall the app.',
      ],
    },
    {
      title: 'What is not deleted right away',
      blocks: [
        'Some records are shared with other players and are not removed automatically:',
        [
          'leaderboard entries from previous days;',
          'the list of words you have found;',
          'battles you played — they also contain your opponent’s result.',
        ],
        `If you want those removed as well, email ${email} and say so in the request — we delete them manually.`,
        'Records of support payments are kept for accounting purposes and remain after the account is deleted. They are linked to a payment identifier, not to your name.',
      ],
    },
  ],
};

export type DeletionLang = 'uz' | 'en';

export const deletionPages: Record<DeletionLang, Policy> = { uz, en };
