/** Har manzilga alohida HTML fayl yasaydigan build bosqichi.
 *
 *  **Muammo.** Sayt — SPA, ya'ni serverdan kelgan HTML'da `<div
 *  id="root"></div>` dan boshqa hech narsa yo'q edi. JavaScript
 *  ishlatmaydigan har qanday o'quvchi — qidiruv roboti, reklama
 *  tarmog'ining moderatsiya tizimi, ijtimoiy tarmoqdagi havola
 *  ko'rinishi — butun saytni bo'sh deb ko'rardi: hamma manzil bir xil
 *  2 KB fayl, bir xil sarlavha, bir xil tavsif. `/sitemap.xml` ham
 *  o'sha bo'sh HTML'ni qaytarardi.
 *
 *  **Yechim.** Build tugagach `dist/` ga har manzil uchun o'z fayli
 *  yoziladi (`dist/oynash/index.html`, `dist/guncha/index.html`, …):
 *  o'z `<title>`, `<meta description>`, `<link canonical>` va `#root`
 *  ichida o'sha sahifaning matni bilan. Vercel statik faylni SPA
 *  qayta yo'naltirishidan **oldin** tekshiradi, shuning uchun bu
 *  fayllar o'zi ochiladi.
 *
 *  React `createRoot` o'rnashayotganda konteynerni tozalaydi, ya'ni
 *  statik matn ilova chizilishi bilan almashadi. Sekin ulanishda esa u
 *  bir necha soniya ko'rinib turadi — bu ham yutuq: odam bo'sh oq
 *  sahifaga qarab o'tirmaydi.
 *
 *  Matn `data/pages.ts`, `data/site.ts` va `data/privacy.ts` dan
 *  olinadi — ya'ni odam ko'radigan matnning aynan o'zi. Robotga
 *  boshqa, odamga boshqa matn ko'rsatish (klouking) saytni qidiruvdan
 *  ham, reklama tarmog'idan ham chiqarib yuboradi. */
/* Importlar aniq kengaytma bilan: bu fayl Vite konfiguratsiyasi orqali
   yuklanadi, uning yangi («native») yuklovchisi esa kengaytmasiz yo'lni
   qo'llamaydi va keyingi katta versiyada standart bo'ladi. */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { Plugin } from 'vite';

import { deletionPages } from '../src/data/accountDeletion.ts';
import { GUIDES } from '../src/data/guides.ts';
import { PAGES, isListed, type Page } from '../src/data/pages.ts';
import { policies, type Policy } from '../src/data/privacy.ts';
import { categories, email, faq, gameLinks, links, modules, site, stats } from '../src/data/site.ts';
import { UPDATES } from '../src/data/updates.ts';
import { BADGES } from '../src/lib/badges.ts';

const escape = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const p = (text: string) => `<p>${escape(text)}</p>`;

/** Sahifa ichidagi mazmun — `h1`, izoh va sahifaga xos qismlar. */
function content(page: Page): string {
  const parts = [`<h1>${escape(page.h1)}</h1>`, `<p class="section__lead">${escape(page.lead)}</p>`];
  for (const line of page.body ?? []) parts.push(p(line));
  const extra = EXTRA[page.path];
  if (extra) parts.push(extra());
  return parts.join('\n');
}

/** Sahifaning o'z ro'yxati — odam ko'radigan ma'lumotning aynan o'zi.
 *
 *  Ilgari bunday blok faqat bosh sahifa va maxfiylik siyosatida bor
 *  edi, qolgan manzillarda esa statik HTML `h1` + izoh + ikki-uch
 *  xatboshidan iborat bo'lardi — o'lchab ko'rilganda navigatsiyani
 *  hisobga olmaganda 400–500 belgi. JavaScript ishlatmaydigan
 *  o'quvchi uchun sayt shu qadar yupqa ko'rinardi, holbuki nishonlar,
 *  yangiliklar va qo'llanma ro'yxatlari saytning o'zida to'la turibdi.
 *
 *  Shuning uchun ro'yxat **o'sha manbadan** olinadi: nishonlar
 *  `lib/badges.ts` dan, yangiliklar `data/updates.ts` dan, qo'llanma
 *  `data/guides.ts` dan, o'yinlar `data/site.ts` dan. Ya'ni robot
 *  ko'radigan matn odam ko'radiganining nusxasi, alohida yozilgan
 *  «robot uchun matn» emas — aks holda bu klouking bo'lardi va sayt
 *  qidiruvdan ham, reklama tarmog'idan ham chiqib ketardi.
 *
 *  Ro'yxatlar shu sababli qo'lda yangilanmaydi ham: yangi nishon yoki
 *  yangilik qo'shilsa statik HTML o'zi o'sadi. */
const EXTRA: Record<string, () => string> = {
  '/': home,
  '/privacy': privacy,
  '/oynash': games,
  '/nishonlar': badges,
  '/yangiliklar': updates,
  '/qollanma': guides,
  '/contact': contact,
  '/hisob-ochirish': deletion,
};

/** Aloqa: manzillar sahifada ko'rinadigan joyidan olinadi, ya'ni
 *  pochta yoki kanal o'zgarsa statik HTML ham o'zi yangilanadi. */
function contact(): string {
  return [
    '<h2>Aloqa</h2>',
    `<ul><li>Elektron pochta: <a href="${links.support}">${escape(email)}</a></li>` +
      `<li>Telegram kanal: <a href="${links.telegram}">@sozgir_uz</a></li></ul>`,
  ].join('\n');
}

/** O'ynash bo'limi: qaysi o'yin bor va har biri nima. */
function games(): string {
  return [
    '<h2>O\u2018yinlar</h2>',
    ...gameLinks.map((game) =>
      `<h3><a href="${game.href}">${escape(game.name)}</a></h3>\n${p(game.tagline)}`,
    ),
  ].join('\n');
}

/** Nishonlar: nomi, sharti va nom ortidagi izoh.
 *
 *  Izoh (`story`) ham olinadi: nishonlar turkiy nom bilan atalgan va
 *  «Yasovul» yoki «Kuntug'mish» nimaligi aytilmasa, ro'yxat bir-biriga
 *  o'xshagan nomlar yig'indisi bo'lib qolardi. */
function badges(): string {
  return [
    '<h2>Nishonlar</h2>',
    ...BADGES.map((badge) =>
      `<h3>${escape(badge.label)}</h3>\n${p(badge.hint)}\n${p(badge.story)}`,
    ),
  ].join('\n');
}

/** Yangiliklar: sana, sarlavha, izoh va o'zgarishlar ro'yxati. */
function updates(): string {
  return [
    '<h2>Yangilanishlar</h2>',
    ...UPDATES.map((update) =>
      [
        `<h3>${escape(update.title)}</h3>`,
        p(`${update.date} — ${update.where}`),
        p(update.body),
        ...(update.items
          ? [`<ul>${update.items.map((item) => `<li>${escape(item)}</li>`).join('')}</ul>`]
          : []),
      ].join('\n'),
    ),
  ].join('\n');
}

/** Qo'llanma bo'limi: maqolalar ro'yxati va har birining izohi.
 *
 *  Maqolaning o'zi alohida manzilda va o'z faylida to'la chiqadi
 *  (`GUIDE_ENTRIES`), bu yerda esa ro'yxat — sahifada ko'rinadigani
 *  bilan bir xil. */
function guides(): string {
  return [
    '<h2>Maqolalar</h2>',
    ...GUIDES.map((guide) =>
      `<h3><a href="${guide.path}">${escape(guide.h1)}</a></h3>\n${p(guide.lead)}`,
    ),
  ].join('\n');
}

/** Bosh sahifa: ko'rsatkichlar, modullar, kategoriyalar va savollar —
 *  sahifada ko'rinadigan ro'yxatlarning o'zi. */
function home(): string {
  return [
    '<ul>',
    ...stats.map((item) => `<li><b>${escape(item.value)}</b> — ${escape(item.label)} (${escape(item.hint)})</li>`),
    '</ul>',
    '<h2>Modullar</h2>',
    ...modules.map((module) =>
      [
        `<h3>${escape(module.name)}</h3>`,
        p(module.tagline),
        '<ul>',
        ...module.points.map((point) => `<li>${escape(point)}</li>`),
        '</ul>',
      ].join('\n'),
    ),
    '<h2>Kategoriyalar</h2>',
    `<ul>${categories.map((item) => `<li>${escape(item.name)}</li>`).join('')}</ul>`,
    '<h2>Ko‘p so‘raladigan savollar</h2>',
    ...faq.map((item) => `<h3>${escape(item.q)}</h3>\n${p(item.a)}`),
  ].join('\n');
}

/** Hujjat — maxfiylik siyosati va hisobni o'chirish sahifasi bitta
 *  turda (`Policy`), shuning uchun ikkalasi shu yerdan chiziladi.
 *
 *  O'zbekcha matn olinadi: boshqa tillar sahifada tugma bilan
 *  almashadi, ya'ni ular bir hujjatning tarjimasi va ularni ham
 *  qo'shish bir xil gapni uch marta takrorlash bo'lardi. */
function policyText(policy: Policy): string {
  return [
    p(policy.updated),
    p(policy.intro),
    `<ul>${policy.meta.map((row) => `<li>${escape(row)}</li>`).join('')}</ul>`,
    ...policy.sections.map((section) =>
      [
        `<h2>${escape(section.title)}</h2>`,
        ...section.blocks.map((block) =>
          Array.isArray(block)
            ? `<ul>${block.map((row) => `<li>${escape(row)}</li>`).join('')}</ul>`
            : p(block),
        ),
      ].join('\n'),
    ),
  ].join('\n');
}

function privacy(): string {
  return policyText(policies.uz);
}

function deletion(): string {
  return policyText(deletionPages.uz);
}

/** Sahifalar o'rtasidagi havolalar: robot butun saytni bitta fayldan
 *  aylanib chiqa olishi kerak. */
function nav(current: string): string {
  const links = PAGES.filter((page) => isListed(page) && page.path !== current)
    .map((page) => `<li><a href="${page.path}">${escape(page.nav)}</a></li>`)
    .join('');
  return `<nav aria-label="Sahifalar"><ul>${links}</ul></nav>`;
}

/** Berilgan qolipdagi bitta qatorni almashtiradi.
 *
 *  Topilmasa build **yiqiladi**: jim o'tib ketilsa `dist` ga noto'g'ri
 *  sarlavhali fayllar yozilardi va buni faqat qidiruvda sezardik. */
function swap(html: string, pattern: RegExp, replacement: string, what: string): string {
  if (!pattern.test(html)) {
    throw new Error(`prerender: index.html da ${what} topilmadi`);
  }
  return html.replace(pattern, replacement);
}

function render(shell: string, page: Page): string {
  const url = `${site}${page.path === '/' ? '/' : page.path}`;
  let html = shell;
  html = swap(html, /<title>[^<]*<\/title>/, `<title>${escape(page.title)}</title>`, '<title>');
  html = swap(
    html,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/>/,
    `<meta name="description" content="${escape(page.description)}" />`,
    'description',
  );
  html = swap(
    html,
    /<link rel="canonical" href="[^"]*" \/>/,
    `<link rel="canonical" href="${url}" />`,
    'canonical',
  );
  html = swap(
    html,
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${escape(page.title)}" />`,
    'og:title',
  );
  html = swap(
    html,
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/,
    `<meta property="og:description" content="${escape(page.description)}" />`,
    'og:description',
  );
  html = swap(
    html,
    /<meta property="og:url" content="[^"]*" \/>/,
    `<meta property="og:url" content="${url}" />`,
    'og:url',
  );
  // Rasm hamma sahifada bitta: havola ko'rinishida sahifaning emas,
  // saytning o'zi tanitiladi (`brand/og.html`).
  html = swap(
    html,
    /<meta property="og:image" content="[^"]*" \/>/,
    `<meta property="og:image" content="${site}/og.png?v=2" />`,
    'og:image',
  );
  // X `og:` ni o'qiydi deyiladi, lekin sarlavha va matnni o'z teglarida
  // topmasa kartochkani chizmay qo'yadi — shuning uchun ular ham
  // har sahifada alohida yangilanadi.
  html = swap(
    html,
    /<meta name="twitter:title" content="[^"]*" \/>/,
    `<meta name="twitter:title" content="${escape(page.title)}" />`,
    'twitter:title',
  );
  html = swap(
    html,
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/,
    `<meta name="twitter:description" content="${escape(page.description)}" />`,
    'twitter:description',
  );
  html = swap(
    html,
    /<meta name="twitter:image" content="[^"]*" \/>/,
    `<meta name="twitter:image" content="${site}/og.png?v=2" />`,
    'twitter:image',
  );
  html = swap(
    html,
    /<div id="root"><\/div>/,
    `<div id="root"><div class="wrap section">\n${content(page)}\n${nav(page.path)}\n</div></div>`,
    '#root',
  );
  return html;
}

function sitemap(): string {
  const urls = PAGES.filter(isListed)
    .map((page) => `  <url><loc>${site}${page.path === '/' ? '/' : page.path}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/** Har manzil `vercel.json` da o'z faylini ko'rsatib turibdimi.
 *
 *  Vercel statik faylni qayta yo'naltirishdan oldin tekshiradi, ya'ni
 *  qoida bo'lmasa ham ishlashi kerak — lekin bu tartibga suyanib
 *  qolmaslik uchun qoida aniq yozilgan. Yangi sahifa qo'shilib,
 *  `vercel.json` unutilsa, build shu yerda yiqiladi: aks holda yangi
 *  manzil jimgina bosh sahifaning matni bilan ochilaverardi. */
async function checkRewrites(): Promise<void> {
  const config = await readFile('vercel.json', 'utf8');
  const missing = PAGES.filter(
    (page) => isListed(page) && page.path !== '/' && !config.includes(page.path.slice(1)),
  );
  if (missing.length > 0) {
    throw new Error(
      `prerender: vercel.json da qoida yo'q — ${missing.map((page) => page.path).join(', ')}`,
    );
  }
}

export function prerender(): Plugin {
  return {
    name: 'sozgir-prerender',
    apply: 'build',
    async closeBundle() {
      const out = 'dist';
      const shell = await readFile(join(out, 'index.html'), 'utf8');

      for (const page of PAGES) {
        // `listed: false` sahifa ro'yxatda yo'q, lekin `file: true`
        // bo'lsa fayli baribir yoziladi: parametrli manzil
        // (`/oyinchi/{uid}`, `/soztop/{KOD}`) `vercel.json` orqali aynan
        // shu faylga yo'naltiriladi, ya'ni u bosh sahifaning matni bilan
        // ochilmaydi.
        if (!isListed(page) && page.file !== true) continue;
        // `/` — `dist/index.html`, qolganlari `dist/<manzil>/index.html`.
        const file = page.path === '/' ? join(out, 'index.html') : join(out, page.path, 'index.html');
        await mkdir(dirname(file), { recursive: true });
        await writeFile(file, render(shell, page));
      }

      await writeFile(join(out, 'sitemap.xml'), sitemap());
      await checkRewrites();
    },
  };
}
