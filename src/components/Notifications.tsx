/** Bildirishnomalar va do'stlar — sarlavhadagi qo'ng'iroq va ikki
 *  varaqli oyna (ilovadagi `NotificationsButton` va
 *  `NotificationsPage`).
 *
 *  Qo'ng'iroq faqat kirgan odamda turadi: ro'yxatning o'zi hisobga
 *  bog'langan. Yangi narsa kelganda tugma qizaradi va sanoq belgining
 *  ichida yoziladi; «qayergacha ko'rilgani» brauzerda, **vaqt bo'yicha**
 *  saqlanadi (`notifications.ts`).
 *
 *  Qatorga javob berilishi bilan u ro'yxatdan o'zi ketadi: ro'yxat
 *  alohida kolleksiyadan emas, manbalarning o'zidan yig'iladi. */
import { useState } from 'react';
import { callFunction } from '../firebase/functions';
import { showBattle } from '../lib/activeBattle';
import { useAuth } from '../lib/auth';
import { gameOf, inviteSource } from '../lib/battle';
import { playerLink } from '../data/site';
import { removeFriend, respondFriendRequest } from '../lib/friends';
import { useFriends } from '../lib/useFriends';
import { useNotifications, type NotificationItem } from '../lib/notifications';
import Avatar from './Avatar';
import { Bell, Person, Swords } from './Icons';
import Modal from './Modal';
import PlayerName from './PlayerName';

/** Qachonligi — «2 daqiqa oldin» kabi qisqa yozuv. */
function ago(at: number): string {
  if (!at) return 'hozir';
  const minutes = Math.round((Date.now() - at) / 60000);
  if (minutes < 1) return 'hozir';
  if (minutes < 60) return `${minutes} daqiqa oldin`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} soat oldin`;
  return `${Math.round(hours / 24)} kun oldin`;
}

export default function Notifications() {
  const { account } = useAuth();
  const [open, setOpen] = useState(false);
  const notifications = useNotifications(account?.uid);

  if (!account) return null;

  const { items, fresh, see } = notifications;

  return (
    <>
      <button
        className="icon-btn bell"
        onClick={() => {
          setOpen(true);
          // Ochilishi bilan «ko'rilgan» deb belgilanadi: ro'yxat
          // ko'rsatilgandan keyin qizil nuqta turishining ma'nosi yo'q.
          see();
        }}
        aria-label={fresh > 0 ? `Bildirishnomalar — ${fresh} yangi` : 'Bildirishnomalar'}
        title="Bildirishnomalar va do‘stlar"
      >
        <Bell size={18} />
        {fresh > 0 && <i className="bell__count">{fresh > 9 ? '9+' : fresh}</i>}
      </button>

      {open && (
        <Modal title="Xabarlar" onClose={() => setOpen(false)}>
          <Sheet items={items} onClose={() => setOpen(false)} />
        </Modal>
      )}
    </>
  );
}

/** Oyna ichi: ikki varaq — xabarlar va do'stlar ro'yxati. */
function Sheet({ items, onClose }: { items: NotificationItem[]; onClose: () => void }) {
  const [tab, setTab] = useState<'news' | 'friends'>('news');
  const friends = useFriends();

  return (
    <div className="notes">
      <div className="play__modes" role="tablist" aria-label="Bo‘lim">
        <button
          role="tab"
          aria-selected={tab === 'news'}
          className={`play__mode${tab === 'news' ? ' play__mode--on' : ''}`}
          onClick={() => setTab('news')}
        >
          Xabarlar{items.length > 0 ? ` (${items.length})` : ''}
        </button>
        <button
          role="tab"
          aria-selected={tab === 'friends'}
          className={`play__mode${tab === 'friends' ? ' play__mode--on' : ''}`}
          onClick={() => setTab('friends')}
        >
          Do‘stlar{friends.length > 0 ? ` (${friends.length})` : ''}
        </button>
      </div>

      {tab === 'news' ? (
        items.length === 0 ? (
          <p className="panel__note">
            Hozircha xabar yo‘q. Do‘stlik so‘rovlari va jangga chaqiruvlar shu
            yerda chiqadi.
          </p>
        ) : (
          <ul className="notes__list">
            {items.map((item) => (
              <Row key={`${item.kind}-${item.id}`} item={item} onDone={onClose} />
            ))}
          </ul>
        )
      ) : friends.length === 0 ? (
        <p className="panel__note">
          Do‘stlar yo‘q. O‘yinchining profilidan «Do‘stlikka qo‘shish» bosing —
          jangga do‘stlar chaqiriladi.
        </p>
      ) : (
        <ul className="notes__list">
          {friends.map((friend) => (
            <li key={friend.uid} className="note">
              <a className="note__who" href={playerLink(friend.uid)}>
                <Avatar name={friend.nickname} uid={friend.uid} size={34} />
                <span className="note__text">
                  <strong>
                    <PlayerName uid={friend.uid} name={friend.nickname} size={14} />
                  </strong>
                  <em>Do‘st</em>
                </span>
              </a>
              <button
                className="link"
                onClick={() => void removeFriend(friend.uid).catch(() => undefined)}
              >
                Chiqarish
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Bitta xabar: do'stlik so'rovi, qabul qilingani yoki jang chaqiruvi. */
function Row({ item, onDone }: { item: NotificationItem; onDone: () => void }) {
  const { account } = useAuth();
  const [busy, setBusy] = useState(false);
  const [gone, setGone] = useState(false);

  if (gone || !account) return null;

  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      // Javob berilgan qator manbadan ham ketadi, lekin kuzatuv javobi
      // kelguncha uni ekranda ushlab turishning ma'nosi yo'q.
      setGone(true);
    } catch {
      setBusy(false);
    }
  };

  const accept = () =>
    run(async () => {
      const reply = await callFunction<{ battleId?: string }>('battleInviteAccept', {
        inviteId: item.id,
        nickname: account.nickname,
      });
      // Chaqiruvning o'zi qaysi o'yin ekanini aytadi: g'uncha jangi
      // So'zjang ekranida ochilsa, taxta bo'sh turib qolardi.
      if (reply.battleId) showBattle(gameOf(item.invite?.game ?? 'soztop'), reply.battleId);
      onDone();
    });

  return (
    <li className="note">
      <a className="note__who" href={playerLink(item.who)}>
        <Avatar name={item.nickname} uid={item.who} size={34} />
        <span className="note__text">
          <strong>
            <PlayerName uid={item.who} name={item.nickname} size={14} />
          </strong>
          <em>
            {item.kind === 'friendRequest'
              ? 'Do‘stlikka chaqirdi'
              : item.kind === 'friendAccepted'
                ? 'So‘rovingizni qabul qildi'
                : `${item.invite?.game === 'guncha' ? 'G‘uncha jangiga' : 'Jangga'} chaqirdi · ${inviteSource(item.invite?.kind ?? 'rematch')}`}
            {' · '}
            {ago(item.at)}
          </em>
        </span>
      </a>

      {item.kind === 'friendRequest' && (
        <span className="note__actions">
          <button
            className="btn btn--sm"
            disabled={busy}
            onClick={() =>
              void run(() => respondFriendRequest(item.id, true, account.nickname))
            }
          >
            <Person size={14} />
            Qabul
          </button>
          <button
            className="btn btn--sm btn--ghost"
            disabled={busy}
            onClick={() =>
              void run(() => respondFriendRequest(item.id, false, account.nickname))
            }
          >
            Rad
          </button>
        </span>
      )}

      {item.kind === 'battleInvite' && (
        <span className="note__actions">
          <button className="btn btn--sm" disabled={busy} onClick={() => void accept()}>
            <Swords size={14} />
            {busy ? 'Ochilmoqda…' : 'Qabul'}
          </button>
          <button
            className="btn btn--sm btn--ghost"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await callFunction('battleInviteDecline', { inviteId: item.id });
              })
            }
          >
            Rad
          </button>
        </span>
      )}
    </li>
  );
}
