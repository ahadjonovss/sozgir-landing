/** Avatar — ilovadagi `BattleAvatar` + `AvatarPhoto` porti.
 *
 *  Rasm bo'lsa (`avatars/{uid}`) — doira ichida rasm; bo'lmasa taxallusning
 *  bosh harfi, rang taxallusdan hisoblanadi (palitra va formula ilovadagi
 *  bilan aynan). Rasm do'kondan so'raladi — bir ekrandagi o'nlab avatar
 *  bitta so'rovga tushadi. */
import { avatarColor, initialOf } from '../lib/avatar';
import { avatarSrc } from '../lib/avatarImage';
import { useAvatarThumb } from '../lib/avatars';
import { donorLabel, useDonorTier } from '../lib/donor';
import { Users } from './Icons';

export default function Avatar({
  name,
  uid,
  image,
  size = 42,
  waiting = false,
  className = '',
}: {
  name: string;
  /** Kimning rasmi — berilmasa faqat bosh harf. */
  uid?: string;
  /** Tayyor rasm (base64): o'z profilida do'kon kutilmaydi. */
  image?: string;
  size?: number;
  /** Raqib hali yo'q: harf o'rniga belgi va so'lg'un rang. */
  waiting?: boolean;
  className?: string;
}) {
  const thumb = useAvatarThumb(waiting ? undefined : uid);
  const photo = waiting ? '' : image || thumb;
  const empty = waiting || name.trim().length === 0;
  // Homiylik halqasi: donat qilgan odamning avatari daraja rangida
  // ajralib turadi — hamma joyda, chunki hamma avatar shu komponent.
  const donor = useDonorTier(waiting ? undefined : uid);
  const classes = [
    'avatar-mark',
    empty ? 'avatar-mark--empty' : '',
    photo ? 'avatar-mark--photo' : '',
    donor ? `avatar-mark--donor avatar-mark--${donor}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={classes}
      title={donor ? donorLabel(donor) : undefined}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.42),
        ...(empty || photo ? {} : { background: avatarColor(name) }),
      }}
      aria-hidden="true"
    >
      {photo ? (
        <img src={avatarSrc(photo)} alt="" width={size} height={size} draggable={false} />
      ) : empty ? (
        <Users size={Math.round(size * 0.5)} />
      ) : (
        initialOf(name)
      )}
    </span>
  );
}
