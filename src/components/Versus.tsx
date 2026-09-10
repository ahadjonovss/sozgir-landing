/** Jang afishasi — ilovadagi `BattleArena`: chapda siz, o'ngda raqib,
 *  o'rtada «VS».
 *
 *  Ilgari bu ikki avatar va kulrang «VS» matni edi — kutish ekrani oddiy
 *  ro'yxatdek ko'rinardi. Endi arena: maydon diagonal ikki rangga
 *  bo'lingan (siz — yashil, raqib — ko'k), o'rtada burilgan romb nishon,
 *  pastda jang shartlari. Raqib kirmaguncha uning tomoni bo'sh turadi va
 *  avatar atrofida to'lqin yuradi; kirganda o'sha joy uning rasmi bilan
 *  to'ladi — kutish va boshlanish ekranlari bir-birining davomi.
 *
 *  Ranglar palitradan: ikki rejimda ham ishlaydi, «jangovar» tus
 *  qizil-qora bilan emas, saytning o'z ranglari bilan beriladi. */
import { useDonorTier } from '../lib/donor';
import Avatar from './Avatar';
import DonorChip from './DonorChip';
import { Clock, Close, Person, Swords } from './Icons';

/** Arena qaysi holatda: raqib kutilmoqda, kelmadi yoki ikkalasi joyida. */
export type ArenaMode = 'waiting' | 'expired' | 'ready';

function Side({
  name,
  uid,
  mine = false,
  waiting = false,
  pulse = false,
  label,
  icon,
}: {
  name: string;
  uid?: string;
  /** O'zining tomoni — yashil ohang, chapdan chiqadi. */
  mine?: boolean;
  /** Raqib hali noma'lum: harf o'rniga belgi va so'lg'un rang. */
  waiting?: boolean;
  /** Avatar atrofida to'lqin — raqib kutilayotganda. */
  pulse?: boolean;
  /** Holat yorlig'i: «Siz», «Kutilmoqda», «Kelmadi», «Raqib qo‘shildi». */
  label: string;
  icon: React.ReactNode;
}) {
  // Homiylik belgisi — raqib ko'rganda «bu nima?» degan savolga chipdagi
  // ⓘ javob beradi.
  const donor = useDonorTier(waiting ? undefined : uid);
  return (
    <div className={`versus__side${mine ? ' versus__side--me' : ' versus__side--foe'}`}>
      <span className="versus__ring">
        {pulse && <i className="versus__pulse" aria-hidden="true" />}
        <Avatar name={name} uid={uid} size={64} waiting={waiting} className="versus__avatar" />
      </span>
      <strong className="versus__name">{name}</strong>
      {donor && <DonorChip tier={donor} className="versus__chip versus__donor" />}
      <span className="versus__chip">
        {icon}
        {label}
      </span>
    </div>
  );
}

export default function Versus({
  me,
  opponent,
  meUid,
  opponentUid,
  mode = 'ready',
  length,
  maxAttempts,
  note,
}: {
  me: string;
  opponent: string;
  meUid?: string;
  opponentUid?: string;
  mode?: ArenaMode;
  /** Jang shartlari — berilsa pastda ikki yorliq: harf va urinish soni. */
  length?: number;
  maxAttempts?: number;
  /** Afisha ostidagi qator — shior yoki sanoq. */
  note?: React.ReactNode;
}) {
  // Raqib tomonidagi yorliq holatga qarab: kutilmoqda → kelmadi → qo'shildi.
  const foe =
    mode === 'waiting'
      ? { label: 'Kutilmoqda', icon: <Clock size={13} /> }
      : mode === 'expired'
        ? { label: 'Kelmadi', icon: <Close size={13} /> }
        : { label: 'Raqib qo‘shildi', icon: <Swords size={13} /> };

  return (
    <div className={`versus versus--${mode}`}>
      <div className="versus__floor" aria-hidden="true" />
      <div className="versus__row">
        <Side name={me} uid={meUid} mine label="Siz" icon={<Person size={13} />} />
        <span className="versus__vs" aria-hidden="true">
          <b>VS</b>
        </span>
        <Side
          name={opponent}
          uid={opponentUid}
          waiting={mode !== 'ready'}
          pulse={mode === 'waiting'}
          label={foe.label}
          icon={foe.icon}
        />
      </div>
      {length !== undefined && maxAttempts !== undefined && (
        // Jang shartlari — ikkala tomon uchun bir xil, shuning uchun
        // o'rtada, ikkala rangga ham tegmaydigan yorliqlar.
        <div className="versus__meta">
          <span className="versus__tag">{length} harf</span>
          <span className="versus__tag">{maxAttempts} urinish</span>
        </div>
      )}
      {mode === 'ready' && <p className="versus__motto">Eng so‘zgirlar g‘olib bo‘ladi</p>}
      {note}
    </div>
  );
}
