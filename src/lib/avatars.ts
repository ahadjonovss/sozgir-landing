/** Avatarlar do'koni — ilovadagi `AvatarStore` + `AvatarCache` porti.
 *
 *  Har bir avatar o'zi so'rov yubormaydi — shu yerdan **so'raydi**.
 *  Do'kon qisqa oyna (60 ms) ichida yig'ilgan uid'larni bitta
 *  `batchGet` so'roviga to'playdi: reytingdagi o'nlab qator bir so'rovga
 *  tushadi. Tartib: xotira → brauzer keshi (3 kun, «rasmi yo'q» ham
 *  keshlanadi) → Firestore. Hujjatlar ochiq, shuning uchun SDK kerak emas.
 *
 *  Yozish (o'z rasmi) SDK orqali: ikki hujjat bitta batch'da. */
import { useEffect, useState } from 'react';
import { client } from '../firebase/client';
import { PATHS } from '../firebase/paths';
import { batchGetDocs, readDoc } from '../firebase/rest';
import type { AvatarImages } from './avatarImage';

const CACHE_KEY = 'sozgir.avatars';
const TTL_MS = 3 * 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 200;
const BATCH_MS = 60;

type CacheRow = { t: number; v: string };

function readCache(): Record<string, CacheRow> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}') as Record<string, CacheRow>;
  } catch {
    return {};
  }
}

function writeCache(rows: Record<string, CacheRow>): void {
  // Chegaradan oshsa eng eskilari tashlanadi — kesh bir necha yuz KB dan
  // oshmasin.
  const keys = Object.keys(rows);
  if (keys.length > MAX_ENTRIES) {
    keys.sort((a, b) => rows[a].t - rows[b].t);
    for (const key of keys.slice(0, keys.length - MAX_ENTRIES)) delete rows[key];
  }
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(rows));
  } catch {
    // kesh shart emas
  }
}

/** Xotira: kalit bor, qiymati `''` — bu odamning rasmi yo'q. */
const memory = new Map<string, string>();
const pending = new Set<string>();
const listeners = new Set<() => void>();
let timer: number | null = null;

function notify(): void {
  for (const listener of listeners) listener();
}

function fromCache(uid: string): string | null {
  const row = readCache()[uid];
  if (!row || Date.now() - row.t > TTL_MS) return null;
  return row.v;
}

function remember(entries: Record<string, string>): void {
  const rows = readCache();
  const now = Date.now();
  for (const [uid, value] of Object.entries(entries)) rows[uid] = { t: now, v: value };
  writeCache(rows);
}

async function flush(): Promise<void> {
  timer = null;
  const batch = [...pending];
  pending.clear();
  if (batch.length === 0) return;

  const found = await batchGetDocs(
    batch.map((uid) => `${PATHS.avatars}/${uid}`),
    { fields: ['thumb'] },
  );
  const learned: Record<string, string> = {};
  for (const uid of batch) {
    const doc = found[`${PATHS.avatars}/${uid}`];
    if (doc === undefined) continue; // tarmoq yiqildi — keyingi safar qayta
    const thumb = typeof doc?.thumb === 'string' ? doc.thumb.trim() : '';
    memory.set(uid, thumb);
    learned[uid] = thumb;
  }
  if (Object.keys(learned).length > 0) {
    remember(learned);
    notify();
  }
}

/** Rasmni so'raydi; bir uid uchun necha marta chaqirilsa ham bitta so'rov. */
export function requestAvatar(uid: string): void {
  const id = uid.trim();
  if (!id || memory.has(id) || pending.has(id)) return;
  const cached = fromCache(id);
  if (cached !== null) {
    memory.set(id, cached);
    return;
  }
  pending.add(id);
  timer ??= window.setTimeout(() => void flush(), BATCH_MS);
}

export function thumbOf(uid: string): string {
  return memory.get(uid) ?? '';
}

/** O'z rasmi yozilgach hamma joyda darhol yangilanadi. */
function put(uid: string, thumb: string): void {
  memory.set(uid, thumb);
  remember({ [uid]: thumb });
  notify();
}

/** Komponent uchun: kichik nusxa (base64) yoki `''`. */
export function useAvatarThumb(uid: string | undefined): string {
  const [, bump] = useState(0);

  useEffect(() => {
    if (!uid) return;
    const listener = () => bump((value) => value + 1);
    listeners.add(listener);
    requestAvatar(uid);
    // Kesh sinxron o'qilgan bo'lishi mumkin — birinchi kadrda ham rasm
    // joyida bo'lsin.
    if (memory.has(uid)) listener();
    return () => {
      listeners.delete(listener);
    };
  }, [uid]);

  return uid ? thumbOf(uid) : '';
}

/** Profil oynasidagi katta nusxa. Yo'q bo'lsa `''`. */
export async function readFullAvatar(uid: string): Promise<string> {
  const doc = await readDoc(
    `${PATHS.avatars}/${uid}/${PATHS.avatarSizes}/${PATHS.avatarFull}`,
    { fields: ['data'] },
  );
  return typeof doc?.data === 'string' ? doc.data.trim() : '';
}

/** Ikki o'lchamni birga yozadi — ilovadagi `save` bilan bir xil maydonlar. */
export async function saveAvatar(uid: string, images: AvatarImages): Promise<void> {
  const { db } = await client();
  const { doc, serverTimestamp, writeBatch } = await import('firebase/firestore/lite');
  const batch = writeBatch(db);
  batch.set(doc(db, PATHS.avatars, uid), { thumb: images.thumb, updatedAt: serverTimestamp() });
  batch.set(doc(db, PATHS.avatars, uid, PATHS.avatarSizes, PATHS.avatarFull), {
    data: images.full,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
  put(uid, images.thumb);
}

export async function removeAvatar(uid: string): Promise<void> {
  const { db } = await client();
  const { doc, writeBatch } = await import('firebase/firestore/lite');
  const batch = writeBatch(db);
  batch.delete(doc(db, PATHS.avatars, uid));
  batch.delete(doc(db, PATHS.avatars, uid, PATHS.avatarSizes, PATHS.avatarFull));
  await batch.commit();
  put(uid, '');
}
