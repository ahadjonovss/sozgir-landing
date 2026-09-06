import { useEffect, useState } from 'react';

/** Ekran kengligiga qarab tartibni tanlash.
 *
 *  Ko'p joyda CSS kifoya, lekin bosh sahifada mazmunning o'zi boshqacha
 *  (telefonda ilova ekrani, kompyuterda tanishtiruv sahifasi) — ikkalasini
 *  birga chizib, birini yashirish esa o'yinni ikki marta ishga tushirardi. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => matchMedia(query).matches);

  useEffect(() => {
    const media = matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
