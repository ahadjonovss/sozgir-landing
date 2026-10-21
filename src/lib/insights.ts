/** Profil raqamlari — «kim ko'rdi», o'zaro hisob va ball tarixi.
 *
 *  Uchalasi ham ilovada bor va saytga yangi ochilgan marshrutlardan
 *  keladi (`/v1/web/me/views`, `/v1/web/profiles/:uid/head-to-head`,
 *  `/v1/web/me/score-history`).
 *
 *  Bitta faylda, chunki uchalasi bir xil narsa: o'yinga ta'sir
 *  qilmaydigan, lekin odamga qiziq bo'lgan raqamlar. Ularning
 *  ekrandagi qismi keyinchalik reklama ortiga olinadi
 *  (`lib/rewarded.ts`) va o'shanda ham **o'qish bu yerda qoladi**:
 *  qulf ma'lumotni olishni emas, uni ko'rsatishni to'sadi. Aks
 *  holda reklama ko'rgan odam yana kutib o'tirardi.
 *
 *  Xato yutiladi: bu raqamlarning birortasi ham sahifaning ishlashi
 *  uchun shart emas. Kelmasa kartochka o'zi chizilmaydi. */
import { api } from '../api/client';

/* ── Meni kim ko'rdi ────────────────────────────────────────────── */

export interface Viewer {
  uid: string;
  nickname: string | null;
  /** Qachon ochgani — millisekundda. */
  at: number;
}

export interface Views {
  /** Nechta **odam** ochgani. */
  viewers: number;
  /** Jami nechta ochilish: bir odam bir necha marta kirishi mumkin. */
  opens: number;
  /** Ro'yxat — faqat so'ralganda keladi. */
  items: Viewer[];
}

export const EMPTY_VIEWS: Views = { viewers: 0, opens: 0, items: [] };

/** [withList] berilsa ro'yxat ham keladi.
 *
 *  Ikkita so'rov emas, bitta: sarlavhadagi son bilan ro'yxat bir
 *  paytda kelsa kartochka sakramaydi. */
export async function loadViews(withList = false, limit = 20): Promise<Views> {
  try {
    const data = await api.get<{
      viewers?: unknown;
      opens?: unknown;
      items?: unknown;
    }>('/v1/web/me/views', {
      query: withList ? { viewers: 'true', limit } : undefined,
    });

    const rows = Array.isArray(data.items) ? data.items : [];
    return {
      viewers: Number(data.viewers ?? 0) || 0,
      opens: Number(data.opens ?? 0) || 0,
      items: rows
        .map((row) => {
          const item = row as {
            viewer_uid?: unknown;
            nickname?: unknown;
            viewed_at?: unknown;
          };
          return {
            uid: String(item.viewer_uid ?? '').trim(),
            nickname:
              typeof item.nickname === 'string' && item.nickname.trim()
                ? item.nickname
                : null,
            at: Date.parse(String(item.viewed_at ?? '')) || 0,
          };
        })
        .filter((viewer) => viewer.uid),
    };
  } catch {
    return EMPTY_VIEWS;
  }
}

/* ── Ikkovimizning hisobimiz ────────────────────────────────────── */

export interface HeadToHead {
  played: number;
  wins: number;
  draws: number;
  /** Shu raqib bilan o'ynab yutilgan (yoki yo'qotilgan) aqcha. */
  aqcha: number;
  /** Oxirgi janglar: `w`/`l`/`d`, eng yangisi boshida. */
  recent: string;
}

/** Mag'lubiyat — qolgani. Server uni alohida bermaydi va bermasligi
 *  ham to'g'ri: uchta sondan to'rtinchisi o'zi chiqadi. */
export const lossesOf = (record: HeadToHead): number =>
  Math.max(0, record.played - record.wins - record.draws);

export async function loadHeadToHead(uid: string): Promise<HeadToHead | null> {
  try {
    const data = await api.get<Record<string, unknown>>(
      `/v1/web/profiles/${encodeURIComponent(uid)}/head-to-head`,
    );
    const played = Number(data.played ?? 0) || 0;
    // Hech qachon o'ynalmagan bo'lsa kartochka umuman chizilmaydi:
    // «0 : 0» hech narsa aytmaydi.
    if (played <= 0) return null;
    return {
      played,
      wins: Number(data.wins ?? 0) || 0,
      draws: Number(data.draws ?? 0) || 0,
      aqcha: Number(data.aqcha ?? 0) || 0,
      recent: typeof data.recent === 'string' ? data.recent : '',
    };
  } catch {
    return null;
  }
}

/* ── Kunlik ball tarixi ─────────────────────────────────────────── */

export interface DayScore {
  /** Kun — `YYYY-MM-DD`. */
  day: string;
  points: number;
}

export async function loadScoreHistory(count = 30): Promise<DayScore[]> {
  try {
    const data = await api.get<{ items?: unknown }>('/v1/web/me/score-history', {
      query: { count },
    });
    const rows = Array.isArray(data.items) ? data.items : [];
    return rows
      .map((row) => {
        const item = row as { day?: unknown; points?: unknown };
        return {
          day: String(item.day ?? '').slice(0, 10),
          points: Number(item.points ?? 0) || 0,
        };
      })
      .filter((row) => row.day);
  } catch {
    return [];
  }
}
