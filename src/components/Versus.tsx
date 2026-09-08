/** Jang boshlanishidagi afisha: «falonchi VS falonchi».
 *
 *  Jang birdan taxta bilan boshlanardi va kim bilan o'ynayotganini
 *  bilish uchun yon ustunga qarash kerak edi. Endi ikki tomon bir soniya
 *  yuzma-yuz turadi — sport uchrashuvining afishasi kabi — so'ng taxta
 *  ochiladi.
 *
 *  Xuddi shu ko'rinish raqib kutilayotganda ham ishlatiladi: o'ng tomonda
 *  so'roq belgisi turadi va do'st qo'shilganda uning ismiga aylanadi. */
import Avatar from './Avatar';

function Side({
  name,
  mine = false,
  waiting = false,
}: {
  name: string;
  /** O'zining tomoni — ozgina ajratib ko'rsatiladi. */
  mine?: boolean;
  /** Raqib hali noma'lum: harf o'rniga so'roq belgisi. */
  waiting?: boolean;
}) {
  return (
    <div className={`versus__side${mine ? ' versus__side--me' : ''}`}>
      <Avatar name={name} size={64} waiting={waiting} className="versus__avatar" />
      <strong className="versus__name">{name}</strong>
    </div>
  );
}

export default function Versus({
  me,
  opponent,
  waiting = false,
  note,
}: {
  me: string;
  opponent: string;
  waiting?: boolean;
  /** Afisha ostidagi qator — shior yoki sanoq. */
  note?: React.ReactNode;
}) {
  return (
    <div className="versus">
      <div className="versus__row">
        <Side name={me} mine />
        <span className="versus__vs" aria-hidden="true">
          VS
        </span>
        <Side name={opponent} waiting={waiting} />
      </div>
      <p className="versus__motto">Eng so‘zgirlar g‘olib bo‘ladi</p>
      {note}
    </div>
  );
}
