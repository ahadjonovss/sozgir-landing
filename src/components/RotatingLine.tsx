/** Kutish davomida almashib turadigan izoh.
 *
 *  Bitta jumla ekranda qotib qolsa qidiruv to'xtaganday tuyuladi —
 *  ayniqsa raqib bir necha daqiqa topilmasa. Jumlalar navbat bilan
 *  eriydi: harakat ko'rinib turadi va nima kutilayotgani har safar
 *  boshqacha aytiladi.
 *
 *  Balandligi qotirilgan: jumlalar turli uzunlikda, aks holda almashganda
 *  ostidagi tugmalar sakrab ketardi. */
import { useEffect, useState } from 'react';

export default function RotatingLine({
  lines,
  every = 3000,
}: {
  lines: string[];
  every?: number;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (lines.length < 2) return;
    const timer = window.setInterval(
      () => setIndex((value) => (value + 1) % lines.length),
      every,
    );
    return () => window.clearInterval(timer);
  }, [every, lines.length]);

  if (lines.length === 0) return null;
  const line = lines[index % lines.length];

  return (
    <p className="rotating" role="status">
      {/* `key` almashganda React eski tugunni almashtiradi va animatsiya
          qaytadan o'ynaydi. */}
      <span key={line} className="rotating__line">
        {line}
      </span>
    </p>
  );
}
