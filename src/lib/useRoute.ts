import { useEffect, useState } from 'react';

export type Route = '/' | '/oyin' | '/privacy' | '/contact';

const routes: Route[] = ['/', '/oyin', '/privacy', '/contact'];

function read(): Route {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return routes.includes(path as Route) ? (path as Route) : '/';
}

/** Bir necha sahifa uchun kichik router — paket qo'shmasdan.
 *  Langar (`#`) va boshqa domenga havolalarni brauzerning o'ziga qoldiradi,
 *  shuning uchun `/#qoida` ko'rinishidagi havolalar ham ishlaydi. */
export function useRoute(): Route {
  const [route, setRoute] = useState(read);

  useEffect(() => {
    const sync = () => setRoute(read());

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = (event.target as Element | null)?.closest('a');
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.hash || url.pathname === window.location.pathname) return;

      event.preventDefault();
      window.history.pushState(null, '', url.pathname);
      sync();
      // `instant` — silliq surilish yangi sahifa chizilganda uzilib qolardi.
      window.scrollTo({ top: 0, behavior: 'instant' });
    };

    // Sahifa `/#qoida` bilan ochilganda brauzer langarni topolmaydi — o'sha
    // paytda `#root` hali bo'sh bo'ladi. Shuning uchun o'zimiz suramiz.
    const target = window.location.hash
      ? document.getElementById(window.location.hash.slice(1))
      : null;
    target?.scrollIntoView({ behavior: 'instant' });

    window.addEventListener('popstate', sync);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('popstate', sync);
      document.removeEventListener('click', onClick);
    };
  }, []);

  return route;
}
