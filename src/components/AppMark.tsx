/** Ilova belgisi — `core/widgets/app_mark.dart` ning aynan o'lchamlari:
 *  linza (yumaloq katak), ichida topilgan harf kvadrati va dasta. */

export default function AppMark({
  size = 24,
  ink = 'currentColor',
  accent = 'var(--green)',
}: {
  size?: number;
  ink?: string;
  accent?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label="So‘zgir"
    >
      <rect
        x="7.25"
        y="7.25"
        width="55.5"
        height="55.5"
        rx="14.6"
        stroke={ink}
        strokeWidth="10.5"
        strokeLinejoin="round"
      />
      <rect x="25.8" y="25.8" width="18.5" height="18.5" rx="4.1" fill={accent} />
      <path
        d="M64 64 L85.3 85.3"
        stroke={ink}
        strokeWidth="10.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
