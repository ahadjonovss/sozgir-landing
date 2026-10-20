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
import { useVerified } from '../lib/verified';
import { Users } from './Icons';
import { VerifiedMark } from './PlayerName';

export default function Avatar({
  name,
  uid,
  image,
  size = 42,
  waiting = false,
  className = '',
  mark = true,
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
  /** Tasdiq belgisi burchakda chizilsinmi.
   *
   *  Odatda — ha: belgi o'yinchining **rasmiga** tegishli va nom
   *  qayerda yozilganidan qat'i nazar o'sha yerda turishi kerak.
   *  Juda kichik avatarlarda (20 px dan past) belgi rasmni bosib
   *  ketadi va o'shanda `false` qilinadi. */
  mark?: boolean;
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

  /* Tasdiq belgisi — rasmning o'ng pastki burchagida.
   *
   *  Ilgari u nom yonida turardi va shu sabab har xil joyda har xil
   *  ko'rinardi: ba'zi ro'yxatda nomdan keyin, ba'zisida umuman
   *  yo'q. Belgi odamning o'ziga tegishli, ya'ni uning rasmida
   *  turgani to'g'ri — va o'shanda u nom qayerda yozilganiga
   *  bog'liq bo'lmaydi. */
  const verified = useVerified(waiting ? undefined : uid);
  /* Kichik avatarlarda nisbat yetmaydi: 28 px dan 36 % — o'n piksel,
     ya'ni belgi bor-yo'qligi bilinmaydi. Shuning uchun pastki chegara
     ham bor.

     Chegara esa o'zi muammo yasardi: 12 px 24 px li avatarning yarmi
     bo'lib, belgi bosh harfni bosib ketardi — jang satridagi va
     janglar tarixidagi avatarlar aynan shunday «xunuk» ko'rinardi.
     Shu sababli belgi endi 32 px dan kichik avatarda umuman
     chizilmaydi: o'sha o'lchamdan boshlab 12 px nisbatga
     (0,34) to'g'ri keladi.

     Yo'qolgan belgidan zarar yo'q — u o'lchamda baribir nuqtadan
     farq qilmasdi, nom esa yonginasida yozilgan. */
  const badge =
    verified && mark && size >= 32 ? Math.max(12, Math.round(size * 0.34)) : 0;

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
    >
      {/* Rasmning o'zi bezak: nom yonida yozilgan va uni ekran
          o'quvchiga ikkinchi marta aytish shart emas. Tasdiq belgisi
          esa boshqa gap — u yashirilmaydi, chunki endi faqat shu
          yerda turadi. */}
      <span className="avatar-mark__face" aria-hidden="true">
        {photo ? (
          <img
            className="avatar-mark__photo"
            src={avatarSrc(photo)}
            alt=""
            width={size}
            height={size}
            draggable={false}
          />
        ) : empty ? (
          <Users size={Math.round(size * 0.5)} />
        ) : (
          initialOf(name)
        )}
      </span>
      {badge > 0 && (
        <span className="avatar-mark__verified" style={{ width: badge, height: badge }}>
          <VerifiedMark uid={uid} size={badge} />
        </span>
      )}
    </span>
  );
}
