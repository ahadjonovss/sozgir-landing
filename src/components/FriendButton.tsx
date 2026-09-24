/** Ochiq profildagi do'stlik tugmasi — ilovadagi `InviteToBattleButton`
 *  ning do'stlik qismi.
 *
 *  Profil hammaga ochiq, ya'ni filtrsiz joy shu bitta edi: reytingdan
 *  o'tgan begona odam istalgancha chaqiruv yuborib turardi. Endi
 *  chaqiruvdan oldin **rozilik** bor.
 *
 *  Holat aloqaga qarab tanlanadi:
 *
 *  | Holat | Tugma |
 *  | --- | --- |
 *  | do'st emas | «Do'stlikka qo'shish» |
 *  | so'rov yuborilgan | «So'rov yuborildi» (o'chiq) + «Qaytarib olish» |
 *  | so'rov kelgan | «Qabul qilish» / «Rad etish» |
 *  | do'st | «So'zjangga chaqirish» — eski oqim |
 *
 *  Aloqa kelmaguncha hech narsa chizilmaydi: tugma bir ko'rinishdan
 *  ikkinchisiga sakrab o'tsa ekran titrab ketardi. */
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import {
  removeFriend,
  respondFriendRequest,
  sendFriendRequest,
  watchFriendship,
  type FriendRequest,
} from '../lib/friends';
import type { Unsubscribe } from '../firebase/live';
import { pretty } from '../lib/uz';
import { Person, Swords } from './Icons';

export default function FriendButton({
  uid,
  nickname,
  onInvite,
}: {
  /** Kimning profili ochilgan. */
  uid: string;
  nickname: string;
  /** Do'st bo'lsa — eski chaqiruv oqimi. */
  onInvite: () => void;
}) {
  const { account, openPrompt } = useAuth();
  const [link, setLink] = useState<{ friend: boolean; request: FriendRequest | null } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const me = account?.uid ?? '';

  useEffect(() => {
    if (!me || !uid || me === uid) return;
    let alive = true;
    let stop: Unsubscribe | null = null;

    void watchFriendship(me, uid, (next) => {
      if (alive) setLink(next);
    }).then((unsubscribe) => {
      if (alive) stop = unsubscribe;
      else unsubscribe();
    });

    return () => {
      alive = false;
      stop?.();
      setLink(null);
    };
  }, [me, uid]);

  /** Serverning o'zbekcha sababi ko'rsatiladi: «bloklangan»,
   *  «allaqachon yopilgan» — ularni o'zimiz taxmin qilmaymiz. */
  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (raw) {
      setError((raw as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // O'z profilim: do'stlik ham, chaqiruv ham ma'nosiz.
  if (me === uid) return null;

  if (!account) {
    return (
      <div className="player__invite">
        <button className="btn btn--lg" onClick={() => openPrompt('signIn')}>
          <Swords size={18} />
          So‘zjangga chaqirish
        </button>
        <p className="panel__note">Chaqirish uchun kirish kerak.</p>
      </div>
    );
  }

  // Aloqa hali kelmagan — joyi band qilib turiladi, tugma sakramasin.
  if (!link) return <div className="player__invite player__invite--wait" aria-busy="true" />;

  const request = link.request;
  const mineSent = request?.status === 'pending' && request.fromUid === me;
  const mineGot = request?.status === 'pending' && request.toUid === me;

  return (
    <div className="player__invite">
      {link.friend ? (
        <>
          <button className="btn btn--lg" onClick={onInvite}>
            <Swords size={18} />
            So‘zjangga chaqirish
          </button>
          <button
            className="link"
            disabled={busy}
            onClick={() => void run(() => removeFriend(uid))}
          >
            Do‘stlikdan chiqarish
          </button>
        </>
      ) : mineGot && request ? (
        <>
          <p className="panel__note">
            <strong>{pretty(nickname)}</strong> sizni do‘stlikka chaqirdi.
          </p>
          <div className="player__friend-actions">
            <button
              className="btn"
              disabled={busy}
              onClick={() =>
                void run(() =>
                  respondFriendRequest(request.id, true, account.nickname),
                )
              }
            >
              Qabul qilish
            </button>
            <button
              className="btn btn--ghost"
              disabled={busy}
              onClick={() =>
                void run(() =>
                  respondFriendRequest(request.id, false, account.nickname),
                )
              }
            >
              Rad etish
            </button>
          </div>
        </>
      ) : mineSent ? (
        <>
          <button className="btn btn--lg" disabled>
            <Person size={18} />
            So‘rov yuborildi
          </button>
          {/* Qaytarib olish `friendRemove` orqali: u so'rov hujjatini
              ham o'chiradi, ya'ni o'chiradigan do'stlik yo'q — amalda
              faqat so'rov ketadi. */}
          <button
            className="link"
            disabled={busy}
            onClick={() => void run(() => removeFriend(uid))}
          >
            Qaytarib olish
          </button>
        </>
      ) : (
        <>
          <button
            className="btn btn--lg"
            disabled={busy}
            onClick={() => void run(() => sendFriendRequest(uid, account.nickname))}
          >
            <Person size={18} />
            Do‘stlikka qo‘shish
          </button>
          <p className="panel__note">
            Jangga do‘stlar chaqiradi — avval so‘rov yuboriladi.
          </p>
        </>
      )}

      {error && <p className="form__err">{error}</p>}
    </div>
  );
}
