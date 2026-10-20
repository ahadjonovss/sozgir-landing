/** Avatarlar do'koni — ilovadagi `AvatarStore` + `AvatarCache` porti.
 *
 *  Har bir avatar o'zi so'rov yubormaydi — shu yerdan **so'raydi**.
 *  Do'kon qisqa oyna (60 ms) ichida yig'ilgan uid'larni bitta so'rovga
 *  to'playdi (`/v1/web/avatars?uids=`): reytingdagi o'nlab qator bir
 *  so'rovga tushadi. Tartib: xotira → brauzer keshi (3 kun, «rasmi
 *  yo'q» ham keshlanadi) → server.
 *
 *  O'qish ochiq: reyting jadvali va o'yinchi sahifasi kirmasdan
 *  ochiladi, ya'ni avatarlar ham token so'ramasligi kerak. Yozish
 *  esa o'z rasmi — u token bilan va ikki o'lcham bitta so'rovda. */
import { useEffect, useState } from 'react';
import { api } from '../api/client';
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

  let items: unknown;
  try {
    ({ items } = await api.get<{ items?: unknown }>('/v1/public/avatars', {
      query: { uids: batch.join(',') },
      auth: false,
    }));
  } catch {
    // Tarmoq yiqildi yoki kirilmagan — keyingi safar qayta so'raladi.
    return;
  }

  // Rasmi yo'q odam javobga **tushmaydi**, shuning uchun topilganlar
  // avval yig'iladi: qolgani «rasmi yo'q» bo'lib keshlanadi va u ham
  // javob, ya'ni qayta so'ralmaydi.
  const found = new Map<string, string>();
  for (const row of Array.isArray(items) ? items : []) {
    const item = row as { uid?: unknown; thumb?: unknown };
    const uid = String(item.uid ?? '').trim();
    if (uid) found.set(uid, String(item.thumb ?? '').trim());
  }

  const learned: Record<string, string> = {};
  for (const uid of batch) {
    const thumb = found.get(uid) ?? '';
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
  try {
    const { data } = await api.get<{ data?: unknown }>(
      `/v1/public/avatars/${encodeURIComponent(uid)}`,
      { auth: false },
    );
    return typeof data === 'string' ? data.trim() : '';
  } catch {
    return '';
  }
}

/** Ikki o'lchamni birga yozadi — ilovadagi `save` bilan bir xil
 *  maydonlar. Kimning rasmi ekanini server token'dan biladi. */
export async function saveAvatar(uid: string, images: AvatarImages): Promise<void> {
  await api.put('/v1/web/me/avatar', {
    body: { thumb: images.thumb, full: images.full },
  });
  put(uid, images.thumb);
}

export async function removeAvatar(uid: string): Promise<void> {
  await api.delete('/v1/web/me/avatar');
  put(uid, '');
}
