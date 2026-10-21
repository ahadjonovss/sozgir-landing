/** Reklama ortidagi ma'lumot — xira qatlam va «Ko'rish» tugmasi.
 *
 *  Ichidagi **chiziladi**, faqat o'qilmaydi: odam nima ochilishini
 *  ko'rib turadi. Bo'sh joy yoki «yopiq» degan yozuv o'rnida xira
 *  ro'yxat turgani halolroq ham, qiziqroq ham — va'da aniq.
 *
 *  Qulf bir necha holatda **umuman chizilmaydi** va ma'lumot
 *  o'zidek ochiq qoladi:
 *
 *   * blok sozlanmagan bo'lsa — reklama yo'q joyda qulf bo'sh
 *     va'da bo'lardi;
 *   * qo'llagan va tasdiqlangan hisobda — ular buni pul bilan
 *     olgan;
 *   * allaqachon ochilgan bo'lsa (muddati ichida).
 *
 *  Aniq matn chaqiruvchidan keladi: «ro'yxatni ko'rish» bilan
 *  «hisobni ko'rish» bir xil emas va umumiy «Ochish» ikkalasini ham
 *  noaniq qilib qo'yardi. */
import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../lib/auth';
import { freeFor, unlocked, watchFor, type Placement } from '../lib/rewarded';

export default function Locked({
  placement,
  subject,
  label,
  children,
}: {
  placement: Placement;
  /** Mukofot nimaga tegishli — raqib yoki qator. Berilmasa butun
   *  joylashuvga. */
  subject?: string;
  /** Tugmadagi matn: «Ro'yxatni ko'rish» kabi. */
  label: string;
  children: ReactNode;
}) {
  const { account } = useAuth();
  const [open, setOpen] = useState(() => unlocked(placement, subject));
  const [busy, setBusy] = useState(false);
  /** Tekshiruv tugamaguncha qulf **chizilmaydi**: aks holda qo'llagan
   *  odam bir zum qulfni ko'rib, keyin u yo'qolardi. */
  const [free, setFree] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    void freeFor(placement, account?.uid).then((value) => {
      if (alive) setFree(value);
    });
    return () => {
      alive = false;
    };
  }, [account?.uid, placement]);

  useEffect(() => {
    setOpen(unlocked(placement, subject));
  }, [placement, subject]);

  if (open || free === null || free) return <>{children}</>;

  async function watch() {
    if (busy) return;
    setBusy(true);
    await watchFor(placement, subject);
    setOpen(true);
    setBusy(false);
  }

  return (
    <div className="locked">
      {/* `aria-hidden`: xira matn o'qish uchun emas, ko'rish uchun.
          Ekran o'quvchisi uni o'qib chalkashtirmasin. */}
      <div className="locked__veil" aria-hidden="true">
        {children}
      </div>
      <button className="btn btn--sm locked__btn" onClick={() => void watch()} disabled={busy}>
        {busy ? 'Ochilmoqda…' : label}
      </button>
    </div>
  );
}
