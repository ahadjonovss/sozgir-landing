/** So'zgir logotipi — `assets/branding/logo.svg` dagi aynan o'sha piksel to'ri.
 *  Farqi: qora bloklar `currentColor` bilan chiziladi, shuning uchun tungi
 *  rejimda ham ko'rinadi (asl faylda rang qattiq #16181D). */

const DARK: [number, number, number, number][] = [
  // S
  [0, 0, 5, 1], [0, 1, 1, 1], [0, 2, 5, 1], [4, 3, 1, 1], [0, 4, 5, 1],
  // O
  [6, 0, 5, 1], [6, 4, 5, 1], [6, 1, 1, 3], [10, 1, 1, 3],
  // Z
  [14, 0, 5, 1], [18, 1, 1, 1], [14, 2, 5, 1], [14, 3, 1, 1], [14, 4, 5, 1],
  // G
  [0, 6, 5, 1], [0, 7, 1, 3], [0, 10, 5, 1], [4, 7, 1, 1], [4, 9, 1, 1], [2, 8, 3, 1],
  // I
  [7, 6, 5, 1], [9, 7, 1, 3], [7, 10, 5, 1],
  // R
  [14, 6, 5, 1], [14, 7, 1, 4], [18, 7, 1, 1], [14, 8, 5, 1],
  [17, 9, 1, 1], [18, 9, 1, 1], [18, 10, 1, 1],
];

const GREEN: [number, number, number, number][] = [
  [7, 1, 3, 3], // O ichidagi kvadrat
  [12, 0, 1, 1], // tutuq belgisi
];

export default function Logo({ height = 30 }: { height?: number }) {
  return (
    <svg
      className="logo"
      viewBox="0 0 19 11"
      height={height}
      width={(height * 19) / 11}
      role="img"
      aria-label="So‘zgir"
      shapeRendering="crispEdges"
    >
      <g fill="currentColor">
        {DARK.map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} />
        ))}
      </g>
      <g fill="var(--green)">
        {GREEN.map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} />
        ))}
      </g>
    </svg>
  );
}
