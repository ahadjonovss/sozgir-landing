/** Kirgan odamning do'stlari — ro'yxatni kuzatuvchi hook.
 *
 *  Bitta nusxa: ro'yxat bildirishnomalar oynasida ham, keyinchalik
 *  boshqa joyda ham shu yerdan olinadi. Kirilmagan bo'lsa bo'sh —
 *  do'stlar ro'yxatini faqat egasi o'qiydi. */
import { useEffect, useState } from 'react';
import type { Unsubscribe } from '../firebase/live';
import { useAuth } from './auth';
import { inviteRequiresFriends, watchFriends, type Friend } from './friends';

export function useFriends(): Friend[] {
  const { account } = useAuth();
  const uid = account?.uid ?? '';
  const [friends, setFriends] = useState<Friend[]>([]);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    let stop: Unsubscribe | null = null;

    void watchFriends(uid, (list) => {
      if (alive) setFriends(list);
    }).then((unsubscribe) => {
      if (alive) stop = unsubscribe;
      else unsubscribe();
    });

    return () => {
      alive = false;
      stop?.();
    };
  }, [uid]);

  // Chiqilganda ro'yxat render paytida bo'shatiladi: holatni effekt
  // ichida tozalash ortiqcha qayta chizishga olib kelardi.
  return uid ? friends : [];
}

/** Profildan (va reyting qatoridan) chaqirish do'stlik talab qiladimi.
 *
 *  Bayroq serverda (`config/friends`), chunki server ilovadan oldin
 *  chiqadi. O'chiq bo'lsa chaqiruv avvalgidek ishlayveradi. */
export function useInviteGate(): boolean {
  const [on, setOn] = useState(false);

  useEffect(() => {
    let alive = true;
    void inviteRequiresFriends().then((value) => {
      if (alive && value) setOn(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  return on;
}

/** Shu odamga to'g'ridan-to'g'ri chaqiruv yuborsa bo'ladimi.
 *
 *  Cheklov yoqilgan bo'lsa faqat do'stlarga: qolganiga profil orqali
 *  boriladi, u yerda avval so'rov yuboriladi. */
export function useCanInvite(): (uid: string) => boolean {
  const gate = useInviteGate();
  const friends = useFriends();
  return (uid: string) => !gate || friends.some((friend) => friend.uid === uid);
}
