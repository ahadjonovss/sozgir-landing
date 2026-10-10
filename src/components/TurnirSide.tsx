/** Turnir guruhida o'ynayotgan odamga ikkita javob: **qolganlar
 *  qanday o'ynayapti** va **endi nima bo'ladi**.
 *
 *  Ikkalasi ham jang ekranining o'zida turadi, chunki odam turnir
 *  sahifasini ochmaydi: u o'yin ichida. Ilgari ekranning ikki yoni
 *  bo'm-bo'sh edi va davra tugaganda «Turnirga qaytish» tugmasidan
 *  boshqa hech narsa yo'q edi — keyingi davra o'zi boshlanishini
 *  odam bilmasdi va turnirni tashlab ketardi.
 *
 *  Ma'lumot turnir hujjatidan keladi (`useTurnir`): u joriy
 *  davraning guruh janglarini ham kuzatadi, ya'ni jadval jonli
 *  — qo'shni guruhda kim yetakchi ekani shu zahoti ko'rinadi. */
import { groupName, turnirPath } from '../lib/turnir';
import { useTurnir } from '../lib/useTurnir';
import { pretty } from '../lib/uz';
import Avatar from './Avatar';
import { Trophy } from './Icons';

/** O'yin paytidagi yon ustun: boshqa guruhlarning jadvali.
 *
 *  O'z guruhim bu yerda yo'q — u ekranning o'rtasida, hisobi bilan
 *  turibdi. Takrorlansa yon ustun uni ikkinchi marta aytardi. */
export function TurnirGroups({ code, battleId }: { code: string; battleId: string }) {
  const turnir = useTurnir(code);
  const round = turnir.rounds.find((item) => item.current);
  if (!round) return null;

  const sizes = round.groups.map((group) => group.seats.length);
  const others = round.groups
    .map((group, index) => ({ group, index }))
    .filter(({ group }) => group.battleId !== battleId);
  if (others.length === 0) return null;

  return (
    <aside className="tnr-side">
      <span className="tnr-side__head">
        <Trophy size={14} /> {round.round}-davra · boshqa guruhlar
      </span>
      {others.map(({ group, index }) => (
        <div className="tnr-side__group" key={group.battleId ?? index}>
          <span className="tnr-side__name">
            {groupName({
              round: round.round,
              rounds: round.rounds,
              sizes,
              index,
            }) ?? `${index + 1}-guruh`}
            <i>{group.done ? 'tugadi' : 'ketyapti'}</i>
          </span>
          <ol className="tnr-side__seats">
            {group.seats.map((seat) => (
              <li key={seat.uid}>
                <Avatar name={seat.nickname} uid={seat.uid} size={20} />
                <span>{pretty(seat.nickname)}</span>
                <em>{seat.score ?? 0}</em>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </aside>
  );
}

/** Guruh jangi boshlanishini kutish — turnirga xos ekran.
 *
 *  Bu yerda odatdagi «Chaqiruv tayyor» ekrani turardi: kod,
 *  havola va «Bekor qilish». Uchalasi ham yolg'on edi — turnir
 *  guruhida kod yo'q (xonani server tuzadi), chaqiradigan odam ham
 *  yo'q, bekor qilinadigan narsa ham: guruh hamma tayyor bo'lgach
 *  o'zi boshlanadi.
 *
 *  Shuning uchun bu yerda faqat rost gap bor: qaysi davra, kim
 *  bilan va nimani kutyapmiz. */
export function TurnirWaiting({ code, battleId }: { code: string; battleId: string }) {
  const turnir = useTurnir(code);
  const round = turnir.rounds.find((item) => item.current);
  const at = round?.groups.findIndex((group) => group.battleId === battleId) ?? -1;
  const mine = at >= 0 ? round?.groups[at] : undefined;
  // Bosqich nomi — davra raqamidan muhimroq: odam «final oldimi,
  // yo'qmi» degan savolga javob izlaydi.
  const stage = round
    ? groupName({
        round: round.round,
        rounds: round.rounds,
        sizes: round.groups.map((group) => group.seats.length),
        index: at,
      })
    : null;

  return (
    <div className="stage tnr-wait">
      <div className="stage__head">
        <h2>{stage ?? 'Guruh jangi'}</h2>
        <span className="stage__tag">
          {round ? `${round.round}-davra` : 'Turnir'}
        </span>
      </div>

      <p className="stage__hint" role="status">
        Guruhdagilar yig‘ilmoqda — jang o‘zi ochiladi, shu sahifada
        turing.
      </p>

      {mine && mine.seats.length > 0 && (
        <ul className="tnr-wait__seats">
          {mine.seats.map((seat) => (
            <li key={seat.uid} className={seat.mine ? 'tnr-wait__me' : undefined}>
              <Avatar name={seat.nickname} uid={seat.uid} size={28} />
              <span>{pretty(seat.nickname)}</span>
              {seat.mine && <i>siz</i>}
            </li>
          ))}
        </ul>
      )}

      <div className="result__actions">
        <a className="btn btn--outline btn--sm" href={turnirPath(code)}>
          <Trophy size={14} /> Turnirga qaytish
        </a>
      </div>
    </div>
  );
}

/** Davra tugagach: jadvaldagi o'rin va keyingi davra.
 *
 *  Eng muhimi — **o'zi boshlanadi**: odam sanoqni ko'rib turgan
 *  joyida qolaveradi va `useTurnirHop` uni yangi jangga o'zi olib
 *  o'tadi. Shuning uchun bu yerda «Boshlash» degan tugma yo'q:
 *  bosiladigan narsa yo'qligini aytish ham ma'lumot. */
export function TurnirNext({ code }: { code: string }) {
  const turnir = useTurnir(code);
  const doc = turnir.doc;
  if (!doc) return null;

  const round = doc.round ?? 0;
  const total = doc.rounds ?? 0;
  const left = turnir.nextIn;
  const finished = doc.status === 'finished';

  return (
    <div className="tnr-next">
      <span className="tnr-next__place">
        Turnir jadvalida{' '}
        <b>
          {turnir.place.rank > 0 ? `${turnir.place.rank}-o‘rin` : 'o‘rin hali yo‘q'}
        </b>
        {turnir.place.points > 0 && <> · {turnir.place.points} ochko</>}
      </span>
      <span className="tnr-next__what">
        {finished ? (
          'Turnir tugadi — yakuniy jadvalni turnir sahifasida ko‘ring.'
        ) : round >= total && total > 0 ? (
          'Oxirgi davra edi — yakun hisoblanmoqda.'
        ) : left !== null && left > 0 ? (
          <>
            <b>{round + 1}-davra</b> {left} soniyadan keyin o‘zi boshlanadi —
            shu sahifada turing, jang o‘zi ochiladi.
          </>
        ) : (
          <>
            <b>{round + 1}-davra</b> hozir boshlanadi — shu sahifada turing,
            jang o‘zi ochiladi.
          </>
        )}
      </span>
    </div>
  );
}
