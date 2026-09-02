import { useEffect } from 'react';

/** `.reveal` klassli elementlar ko'rinishga kirganda `.is-in` oladi.
 *  Bitta observer butun sahifaga yetadi. */
export function useReveal() {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );

    const scan = () =>
      document
        .querySelectorAll<HTMLElement>('.reveal:not(.is-in)')
        .forEach((n) => io.observe(n));

    scan();

    // Keyin qo'shilgan bloklar ham kuzatuvga tushsin (shartli render, HMR).
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    // Xavfsizlik chorasi: agar observer umuman ishlamasa (ba'zi headless va
    // prerender muhitlarida shunday), `js` klassi olib tashlanadi va butun
    // sahifa animatsiyasiz bo'lsa ham ko'rinadi.
    const guard = window.setTimeout(() => {
      if (!document.querySelector('.reveal.is-in')) {
        document.documentElement.classList.remove('js');
      }
    }, 1500);

    return () => {
      window.clearTimeout(guard);
      mo.disconnect();
      io.disconnect();
    };
  }, []);
}

/** Mavzu almashtirish — tanlov `localStorage` da, admin panel bilan bir kalit. */
export function toggleTheme() {
  const root = document.documentElement;
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  localStorage.setItem('sozgir.theme', next);
  return next;
}
