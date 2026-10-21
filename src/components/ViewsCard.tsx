/** «Profilingizni kim ochdi» — o'yin sahifasining yon ustunida.
 *
 *  Ilovadagi ko'rishlar ro'yxatining sayt tarafdagi juftligi. Sarlavha
 *  ikki sondan iborat: nechta **odam** ochgani va jami nechta
 *  ochilish. Ikkisi bir xil emas — bir odam profilni bir necha marta
 *  ochishi mumkin va aynan shu farq qiziq.
 *
 *  Ro'yxat sanoqdan **alohida** so'raladi: sarlavhadagi songa u kerak
 *  emas va uni har ochilishda tortib kelishning ma'nosi yo'q.
 *
 *  Hisobsiz odamga umuman chizilmaydi: ko'rishlar hisobga yoziladi. */
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { EMPTY_VIEWS, loadViews, type Views } from '../lib/insights';
import { pretty } from '../lib/uz';
import Avatar from './Avatar';
import PlayerName from './PlayerName';

/** Ro'yxatda shuncha qator. */
const SHOWN = 8;

/** «Bugun», «kecha», «3 kun oldin» — aniq sana shart emas.
 *
 *  Ro'yxat yangi ochilishlar haqida va ularda «qachonligi» emas,
 *  «yaqindami» muhim. */
function ago(at: number): string {
  if (at <= 0) return '';
  const days = Math.floor((Date.now() - at) / 86_400_000);
  if (days <= 0) return 'bugun';
  if (days === 1) return 'kecha';
  if (days < 30) return `${days} kun oldin`;
  const months = Math.floor(days / 30);
  return `${months} oy oldin`;
}

export default function ViewsCard() {
  const { account } = useAuth();
  const [views, setViews] = useState<Views>(EMPTY_VIEWS);

  useEffect(() => {
    if (!account) return setViews(EMPTY_VIEWS);
    let alive = true;
    void loadViews(true, SHOWN).then((next) => {
      if (alive) setViews(next);
    });
    return () => {
      alive = false;
    };
  }, [account?.uid]);

  // Hisobsiz odamda ham, hali hech kim ochmagan profilda ham
  // kartochka chizilmaydi: bo'sh ro'yxat ustunni uzaytiradi, xolos.
  if (!account || views.viewers === 0) return null;

  return (
    <div className="panel views">
      <div className="panel__head">
        <h3>Profilingizni ko‘rdi</h3>
        <span className="panel__tag">{views.viewers}</span>
      </div>

      <p className="panel__note">
        {views.viewers} kishi, jami {views.opens} marta ochilgan.
      </p>

      {views.items.length > 0 && (
        <ul className="views__list">
          {views.items.map((viewer, index) => (
            <li key={`${viewer.uid}-${index}`}>
              <Avatar
                name={pretty(viewer.nickname ?? 'Mehmon')}
                uid={viewer.uid}
                size={28}
              />
              <PlayerName uid={viewer.uid} name={pretty(viewer.nickname ?? 'Mehmon')} size={13} />
              <span className="views__when">{ago(viewer.at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
