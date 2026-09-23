/** Muhr tanlash — homiyning ism yonidagi belgisi.
 *
 *  Ilovadagi muhr varag'ining veb ko'rinishi: o'n ikki muhr, darajasi
 *  yetgani tanlanadi, qolgani qulfda turadi va qaysi darajada
 *  ochilishini aytadi. Nishonlardan farqi shu — muhr ishlab olinmaydi,
 *  **tanlanadi**: qaysi birini qo'yish odamning o'z ishi.
 *
 *  Bir vaqtda bittasi turadi: ikkitasi ism yonida yonma-yon turgan
 *  zahoti ism o'qilmay qoladi. Shuning uchun bosilgan muhr avvalgisini
 *  almashtiradi, qayta bosilsa esa olib tashlanadi.
 *
 *  Yozuv serverga boradi (`donors/{uid}.mark`) va qoida uni yana bir
 *  bor tekshiradi: darajasi yetmagan muhr yozilmaydi. */
import { useState } from 'react';
import { donorLabel, useDonorTier } from '../lib/donor';
import { MARKS, chooseMark, unlockedBy, useDonorMark } from '../lib/donorMark';

export default function DonorMarks({ uid }: { uid: string }) {
  const tier = useDonorTier(uid);
  const current = useDonorMark(uid);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const pick = async (id: string) => {
    if (busy) return;
    setBusy(id);
    setError(false);
    try {
      // Bosilgan muhr allaqachon turgan bo'lsa — olib tashlanadi.
      await chooseMark(uid, current?.id === id ? '' : id);
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="panel">
      <div className="panel__head">
        <h3>Muhr</h3>
        <span className="panel__tag">{current ? current.label : 'Tanlanmagan'}</span>
      </div>
      <p className="panel__note">
        Muhr ismingiz yonida turadi — reytingda, jangda va profilda.
        Darajangiz yetgani tanlanadi; qayta bossangiz olib tashlanadi.
      </p>

      <ul className="marks">
        {MARKS.map((mark) => {
          const open = unlockedBy(mark, tier);
          const on = current?.id === mark.id;
          return (
            <li key={mark.id}>
              <button
                type="button"
                className={`mark${on ? ' mark--on' : ''}${open ? '' : ' mark--off'}`}
                disabled={!open || busy !== null}
                aria-pressed={on}
                onClick={() => void pick(mark.id)}
              >
                <img
                  src={`/muhr/${mark.id}.png`}
                  alt=""
                  width={34}
                  height={34}
                  loading="lazy"
                  decoding="async"
                />
                <strong>{mark.label}</strong>
                {/* Ochiq muhrda izoh, qulflanganida esa qaysi darajada
                    ochilishi — ikkovi bir joyda turadi. */}
                <span>{open ? mark.story : `«${donorLabel(mark.minTier)}» dan`}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {error && (
        <p className="form__err">Muhr saqlanmadi. Birozdan keyin urinib ko‘ring.</p>
      )}
    </div>
  );
}
