/** Turnir to'ri — zinapoya.
 *
 *  Har davra bitta ustun, ustunda guruhlar, guruhda qatnashchilar o'rin
 *  tartibida. O'tganlar yorqin, chiqqanlar so'lg'un — to'rni o'qish
 *  uchun matn emas, rang yetadi.
 *
 *  **Telefonda ustunlar vertikal yig'iladi** (bitta davra — bitta
 *  bo'lim). Besh ustun telefon ekraniga sig'maydi, gorizontal surish
 *  esa to'rni butunlay yashirardi: odam o'zining qaysi davrada
 *  chiqqanini topish uchun yonga surib yurardi.
 *
 *  Joriy davra guruhlarida jonli hisob turadi (jang hujjatlaridan),
 *  tugaganida esa server yozgan jadval — ya'ni bir xil qator ikki
 *  manbadan to'ladi va ko'rinishi o'zgarmaydi. */
import {
  groupName,
  type LadderGroup,
  type LadderRound,
  type LadderSeat,
} from '../lib/turnir';
import type { Turnir } from '../lib/useTurnir';
import Avatar from './Avatar';
import PlayerName from './PlayerName';

export default function TurnirLadder({ turnir }: { turnir: Turnir }) {
  if (turnir.rounds.length === 0) return null;

  return (
    <div className="ladder">
      {turnir.rounds.map((round) => (
        <Round key={round.round} round={round} />
      ))}
    </div>
  );
}

function Round({ round }: { round: LadderRound }) {
  return (
    <section className={`ladder__round${round.current ? ' ladder__round--now' : ''}`}>
      <h3 className="ladder__title">
        <b>{round.round}-davra</b>
        <span>{round.players} kishi</span>
      </h3>
      {round.groups.map((group, index) => (
        <Group
          key={group.battleId ?? index}
          group={group}
          // Nomi **rost**: guruh qaysi o'rinlar uchun o'ynayotganini
          // aytadi. Harf faqat birinchi davrada qoladi — u yerda
          // jadval hali yo'q va o'rin haqida gapirish yolg'on
          // bo'lardi.
          label={
            groupName({
              round: round.round,
              rounds: round.rounds,
              sizes: round.groups.map((item) => item.seats.length),
              index,
            }) ?? ''
          }
        />
      ))}
    </section>
  );
}

function Group({ group, label }: { group: LadderGroup; label: string }) {
  return (
    <div
      className={`ladder__group${group.done ? ' ladder__group--done' : ' ladder__group--live'}`}
    >
      {/* Holat — **yorliq**, ko'zga tashlanadigan: ilgari u nomning
          yonida kichkina kulrang yozuv edi va qaysi guruh hali
          o'ynayotganini ajratib bo'lmasdi. Ketayotganida yashil
          nuqta uriladi, tugaganida esa kartochkaning o'zi
          so'lg'unlashadi. */}
      <span className="ladder__gname">
        {label && <b>{label}</b>}
        <i className={group.done ? 'ladder__state' : 'ladder__state ladder__state--live'}>
          {group.done ? 'tugadi' : 'ketyapti'}
        </i>
      </span>
      <ol className="ladder__seats">
        {group.seats.map((seat) => (
          <Seat key={seat.uid} seat={seat} done={group.done} />
        ))}
      </ol>
    </div>
  );
}

function Seat({ seat }: { seat: LadderSeat; done: boolean }) {
  // So'lg'un qator yo'q: shveytsarda chiqarib yuborish ham yo'q.
  // Qator yonida o'sha davrada olingan ochko turadi va jadvaldagi
  // harakatni o'sha ko'rsatadi.
  return (
    <li className={`ladder__seat${seat.mine ? ' ladder__seat--me' : ''}`}>
      <span className="ladder__place">{seat.rank ?? '·'}</span>
      <Avatar name={seat.nickname} uid={seat.uid} size={22} />
      <span className="ladder__who">
        <PlayerName uid={seat.uid} name={seat.nickname} size={13} />
      </span>
      {seat.points !== null ? (
        <span className="ladder__points">{seat.points} ochko</span>
      ) : (
        seat.score !== null && <span className="ladder__score">{seat.score}</span>
      )}
    </li>
  );
}
