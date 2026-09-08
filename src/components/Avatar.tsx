/** Avatar — ilovadagi `BattleAvatar` ning porti.
 *
 *  Taxallusning bosh harfi, rang esa taxallusdan hisoblanadi: bir odam
 *  ilovada ham, saytda ham, reytingda ham bir xil rangda ko'rinadi —
 *  ro'yxatda kim kim ekani tezroq tanaladi. Palitra va formula ilovadagi
 *  bilan aynan bir xil (kod birliklari yig'indisi mod 6). */
import { avatarColor, initialOf } from '../lib/avatar';
import { Users } from './Icons';

export default function Avatar({
  name,
  size = 42,
  waiting = false,
  className = '',
}: {
  name: string;
  size?: number;
  /** Raqib hali yo'q: harf o'rniga belgi va so'lg'un rang. */
  waiting?: boolean;
  className?: string;
}) {
  const empty = waiting || name.trim().length === 0;
  return (
    <span
      className={`avatar-mark${empty ? ' avatar-mark--empty' : ''}${className ? ` ${className}` : ''}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.42),
        ...(empty ? {} : { background: avatarColor(name) }),
      }}
      aria-hidden="true"
    >
      {empty ? <Users size={Math.round(size * 0.5)} /> : initialOf(name)}
    </span>
  );
}
