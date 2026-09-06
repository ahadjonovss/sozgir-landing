// Ikonka fabrikasi komponent qaytaradi, lekin linter buni ko'rmaydi —
// fayl faqat ikonkalardan iborat, shuning uchun qoida o'chirilgan.
// oxlint-disable react/only-export-components

/** Ikonkalar — ilovadagi Material ikonkalarining yengil ko'chirmasi.
 *  Rasm emas, chizma: har o'lchamda tiniq va `currentColor` ni oladi. */

type Props = { size?: number };

const svg = (path: string) =>
  function Icon({ size = 22 }: Props) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d={path} />
      </svg>
    );
  };

export const ChevronLeft = svg('M15 6l-6 6 6 6');
export const ChevronRight = svg('M9 6l6 6-6 6');
export const Check = svg('M4 12.5l5 5L20 6.5');
export const Close = svg('M6 6l12 12M18 6L6 18');
export const Clock = svg('M12 21a9 9 0 100-18 9 9 0 000 18zM12 7.5V12l3 2');
export const Refresh = svg(
  'M20 12a8 8 0 11-2.34-5.66M20 4v4h-4',
);
export const Share = svg(
  'M12 15V3m0 0L8 7m4-4l4 4M5 13v5a2 2 0 002 2h10a2 2 0 002-2v-5',
);
export const Person = svg(
  'M12 12a4 4 0 100-8 4 4 0 000 8zM5 20a7 7 0 0114 0',
);
export const Bulb = svg(
  'M9.5 18h5M10 21h4M8 10a4 4 0 118 0c0 1.7-1 2.6-1.6 3.5-.5.8-.6 1.5-.6 2.5h-3.6c0-1-.1-1.7-.6-2.5C9 12.6 8 11.7 8 10z',
);
export const Book = svg(
  'M12 7v14M3 18a1 1 0 01-1-1V4a1 1 0 011-1h5a4 4 0 014 4 4 4 0 014-4h5a1 1 0 011 1v13a1 1 0 01-1 1h-6a3 3 0 00-3 3 3 3 0 00-3-3z',
);
export const Swords = svg(
  'M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2' +
    'M14.5 6.5L18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2',
);
export const Trophy = svg(
  'M7 4h10v5a5 5 0 01-10 0zM7 6H4v1a3 3 0 003 3M17 6h3v1a3 3 0 01-3 3M9 20h6M12 14v6',
);
export const Chart = svg('M5 20V10M12 20V4M19 20v-6');
export const Home = svg('M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1z');
export const Category = svg(
  'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
);
export const Infinity_ = svg(
  'M8.5 9a3 3 0 100 6c2.5 0 4-6 6.5-6a3 3 0 110 6c-2.5 0-4-6-6.5-6z',
);
export const Today = svg(
  'M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1zM4 10h16M8 3v4M16 3v4',
);
export const Heart = svg(
  'M12 20s-7-4.4-7-9a4 4 0 017-2.6A4 4 0 0119 11c0 4.6-7 9-7 9z',
);
export const Sun = svg(
  'M12 17a5 5 0 100-10 5 5 0 000 10zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
);
export const Moon = svg('M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 1010.5 10.5z');
/** To'ldirilgan uchburchak — kunlik kartochkadagi «o'ynash» belgisi. */
export function Play({ size = 22 }: Props) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M8 5.2l10.5 6.8L8 18.8z" />
    </svg>
  );
}
export const Download = svg('M12 4v11m0 0l-4-4m4 4l4-4M5 20h14');
export const Help = svg(
  'M12 21a9 9 0 100-18 9 9 0 000 18zM9.5 9.5A2.5 2.5 0 1112 12v1.5M12 17h.01',
);
export const Shield = svg(
  'M12 3l7 3v5.5c0 4.2-2.9 7.6-7 9.5-4.1-1.9-7-5.3-7-9.5V6z',
);
export const Send = svg('M4 12l16-8-6 16-2.5-6z');
export const Copy = svg(
  'M9 9h9a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1v-9a1 1 0 011-1zM6 15H5a1 1 0 01-1-1V5a1 1 0 011-1h9a1 1 0 011 1v1',
);
export const Users = svg(
  'M8 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2 20a6 6 0 0112 0M16.5 11.5a3 3 0 100-6M17 14.5a5.5 5.5 0 015 5.5',
);
