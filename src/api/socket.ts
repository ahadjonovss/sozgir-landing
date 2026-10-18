/** Jonli jang kanali.
 *
 *  Ilovadagi `BattleSocket` ning ko'zgusi. Firestore'da har yurish
 *  hujjat yozuvi edi va uni kuzatayotgan har o'yinchiga yetkazish
 *  alohida o'qish bo'lib hisoblanardi — uch daqiqalik jangda bu
 *  yuzlab amal. Socket'da esa ochiq kanal bo'ylab bitta paket.
 *
 *  Uzilish **odatiy hol** deb qaraladi: yorliq fonga o'tganda brauzer
 *  kanalni o'ldirishi mumkin, tarmoq ham almashadi. Jang holati
 *  ulanishda emas, serverdagi xonada turadi — qaytib kirgan
 *  o'yinchining balli saqlanadi. */
import { client } from '../firebase/client';
import { SOCKET_URL } from './config';

export interface SocketEvent {
  type: string;
  /** So'rov belgisi — javob qaysi so'zga tegishli ekanini aytadi. */
  id?: string | null;
  uid?: string;
  total?: number;
  score?: number;
  accepted?: boolean;
  reason?: string;
  [key: string]: unknown;
}

/** Server autentifikatsiya sababli yopganda yuboradigan kod. */
const UNAUTHENTICATED = 4401;

const MAX_BACKOFF = 30_000;

export class BattleSocket {
  private socket: WebSocket | null = null;
  private battleId: string | null = null;
  private closed = false;
  private retry: ReturnType<typeof setTimeout> | null = null;

  /** Qayta ulanish kechikishi — har urinishda ikkilanadi. Darhol
   *  qayta urinish tarmoq tiklanmagan bo'lsa serverni bekorga band
   *  qiladi. */
  private backoff = 1000;

  /** Javob kutayotgan so'rovlar: belgi → kutuvchi. */
  private waiting = new Map<
    string,
    { resolve: (event: SocketEvent) => void; reject: (error: Error) => void }
  >();
  private nextId = 0;

  private listeners = new Set<(event: SocketEvent) => void>();
  private errorListeners = new Set<(error: Error) => void>();

  on(listener: (event: SocketEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onError(listener: (error: Error) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  /** Jangga ulanadi. Avvalgi ulanish bo'lsa yopiladi. */
  async join(battleId: string): Promise<void> {
    this.battleId = battleId;
    this.closed = false;
    await this.connect();
  }

  private async connect(): Promise<void> {
    if (this.closed) return;

    const { auth } = await client();
    const user = auth.currentUser;
    const token = user === null ? null : await user.getIdToken();
    if (token === null) {
      this.scheduleRetry();
      return;
    }

    // Token so'rov satrida: WebSocket qo'l berishda sarlavha qo'shib
    // bo'lmaydi.
    let socket: WebSocket;
    try {
      socket = new WebSocket(`${SOCKET_URL}?token=${encodeURIComponent(token)}`);
    } catch {
      this.scheduleRetry();
      return;
    }
    this.socket = socket;

    socket.addEventListener('open', () => {
      const id = this.battleId;
      if (id !== null) this.send({ type: 'join', battleId: id });
      // Ulanish tiklandi — kechikish boshiga qaytadi.
      this.backoff = 1000;
    });

    socket.addEventListener('message', (event) => this.onMessage(event.data));
    socket.addEventListener('close', (event) => this.onDone(event.code));
    socket.addEventListener('error', () => {
      // `close` baribir keladi — qayta ulanish o'sha yerda hal bo'ladi.
    });
  }

  private onMessage(raw: unknown): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(String(raw));
    } catch {
      // Buzuq kadr uchun ulanish uzilmaydi: bitta xato paket butun
      // jangni to'xtatmasligi kerak.
      return;
    }
    if (typeof parsed !== 'object' || parsed === null) return;

    const event = parsed as SocketEvent;
    if (typeof event.type !== 'string') return;

    // Belgisi bor javob — kutayotgan so'rovga beriladi va umumiy
    // oqimga chiqmaydi: uni `submitWord` qaytaradi.
    const id = event.id;
    if (typeof id === 'string') {
      const waiter = this.waiting.get(id);
      if (waiter !== undefined) {
        this.waiting.delete(id);
        waiter.resolve(event);
        return;
      }
    }

    for (const listener of [...this.listeners]) listener(event);
  }

  private onDone(code: number): void {
    this.socket = null;
    if (this.closed) return;

    /*
     * Token yaroqsiz — qayta ulanish foydasiz: keyingi urinishda ham
     * o'sha token yuboriladi va server yana yopadi. Cheksiz aylanish
     * serverni bekorga band qiladi.
     *
     * Sahifa xatoni ko'radi va odam qaytadan kirishi mumkin; yangi
     * `join` chaqiruvi yangi token bilan boradi.
     */
    if (code === UNAUTHENTICATED) {
      this.closed = true;
      const error = new Error('Kirish tasdiqlanmadi');
      for (const listener of [...this.errorListeners]) listener(error);
      return;
    }

    this.scheduleRetry();
  }

  private scheduleRetry(): void {
    if (this.retry !== null) clearTimeout(this.retry);
    this.retry = setTimeout(() => void this.connect(), this.backoff);
    this.backoff = Math.min(this.backoff * 2, MAX_BACKOFF);
  }

  private send(message: Record<string, unknown>): void {
    const socket = this.socket;
    if (socket === null || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(message));
  }

  /** G'unchada so'z topshiradi va javobni kutadi.
   *
   *  Ball **serverda** hisoblanadi. Javob belgisi bilan bog'lanadi:
   *  tez yozilganda bir nechta so'z yo'lda bo'lishi mumkin va javoblar
   *  tartibi kafolatlanmaydi.
   *
   *  Javob kelmasa xato beriladi — sahifa «qabul qilinmadi» deb
   *  ko'rsatadi va odam qayta urinadi. Jim yutilsa, u so'z
   *  yo'qolganini bilmay qolardi. */
  submitWord(word: string, timeout = 8000): Promise<SocketEvent> {
    const id = String(this.nextId++);

    return new Promise<SocketEvent>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.waiting.delete(id);
        reject(new Error("So'z yuborilmadi"));
      }, timeout);

      this.waiting.set(id, {
        resolve: (event) => {
          clearTimeout(timer);
          resolve(event);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      });

      this.send({ type: 'word', id, payload: { word } });
    });
  }

  /** «Men tugatdim» — jang yakuni serverda hal bo'ladi. */
  finish(): void {
    this.send({ type: 'finish' });
  }

  dispose(): void {
    this.closed = true;
    if (this.retry !== null) clearTimeout(this.retry);
    this.retry = null;

    // Kutayotganlar osilib qolmaydi: sahifa yopilganda ularning
    // va'dasi hech qachon tugamasdi.
    for (const waiter of this.waiting.values()) {
      waiter.reject(new Error('Kanal yopildi'));
    }
    this.waiting.clear();

    this.socket?.close();
    this.socket = null;
    this.listeners.clear();
    this.errorListeners.clear();
  }
}
