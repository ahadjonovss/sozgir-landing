/** Kichik marshrutlagich.
 *
 *  Manzillar ataylab ilovaning deep link'lari bilan bir xil:
 *  `/kunlik`, `/jang/AB12CD`, `/u/<uid>`. Shu sababli bitta havola
 *  ikki joyda ishlaydi — ilovasi bor odamda ilova ochiladi, qolganida
 *  shu sahifa. Qoidalar manbasi — ilovadagi `core/deeplink/deep_link.dart`. */

import { useCallback, useEffect, useState } from 'react';

/** Sahifa manzili (`/jang/AB12CD` → `['jang', 'AB12CD']`). */
export const segmentsOf = (path: string) =>
  path.split('/').filter((part) => part.length > 0);

/** Sayt ichida bosilgan qadam tarix yozuvida belgilanadi. Orqaga
 *  tugmasi shunga qaraydi: havola bilan to'g'ridan-to'g'ri kelingan
 *  sahifada `history.back()` odamni saytdan chiqarib yuborardi. */
const depthOf = () => (history.state as { sozgir?: number } | null)?.sozgir ?? 0;

export function navigate(to: string, replace = false) {
  if (to === location.pathname + location.search) return;
  const depth = replace ? depthOf() : depthOf() + 1;
  history[replace ? 'replaceState' : 'pushState']({ sozgir: depth }, '', to);
  dispatchEvent(new PopStateEvent('popstate'));
}

/** Orqaga: ichkarida bo'lsak brauzer tarixi, aks holda berilgan manzil. */
export function goBack(fallback: string) {
  if (depthOf() > 0) {
    history.back();
    return;
  }
  navigate(fallback, true);
}

export function useRoute(): string {
  const [path, setPath] = useState(() => location.pathname);

  useEffect(() => {
    const onChange = () => setPath(location.pathname);
    addEventListener('popstate', onChange);
    return () => removeEventListener('popstate', onChange);
  }, []);

  return path;
}

/** Havolalarni ushlaydigan `onClick` — sahifa qayta yuklanmaydi.
 *
 *  Statik sahifalar (`/privacy`, `/shartlar`, `/donat`) va tashqi
 *  manzillar odatdagidek ochiladi. */
export function useLinkHandler() {
  return useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    const anchor = event.currentTarget;
    const external =
      anchor.target === '_blank' ||
      anchor.origin !== location.origin ||
      anchor.hasAttribute('download');
    if (external || event.metaKey || event.ctrlKey || event.shiftKey) return;

    event.preventDefault();
    navigate(anchor.pathname + anchor.search);
  }, []);
}
