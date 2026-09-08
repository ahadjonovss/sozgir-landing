/** Profil oynasidagi rasm: ko'rish, qo'yish, almashtirish, o'chirish —
 *  ilovadagi `AvatarEditor` + `AvatarSheet`.
 *
 *  Brauzerda «galereya» va «kamera» bitta fayl tanlash oynasi: telefon
 *  brauzeri o'zi suratga olishni ham taklif qiladi. Rasm brauzerda
 *  kvadratga kesilib, 64 va 256 px JPEG'ga siqiladi va Firestore'ga
 *  yoziladi — server tomonida hech narsa kerak emas. */
import { useEffect, useRef, useState } from 'react';
import { encodeAvatar } from '../lib/avatarImage';
import { readFullAvatar, removeAvatar, saveAvatar, useAvatarThumb } from '../lib/avatars';
import Avatar from './Avatar';

export default function AvatarEditor({ uid, name }: { uid: string; name: string }) {
  const input = useRef<HTMLInputElement>(null);
  const thumb = useAvatarThumb(uid);
  const [full, setFull] = useState('');
  const [busy, setBusy] = useState<'save' | 'remove' | null>(null);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);

  // Katta nusxa faqat shu oyna uchun o'qiladi. Rasm yo'q bo'lsa `full`
  // ishlatilmaydi (pastda `thumb` bo'yicha tanlanadi), shuning uchun uni
  // tozalash shart emas.
  useEffect(() => {
    if (!thumb) return;
    let alive = true;
    void readFullAvatar(uid).then((data) => {
      if (alive) setFull(data);
    });
    return () => {
      alive = false;
    };
  }, [thumb, uid]);

  async function pick(file: File | undefined) {
    if (!file || busy) return;
    setError('');
    setBusy('save');
    try {
      const images = await encodeAvatar(file);
      await saveAvatar(uid, images);
      setFull(images.full);
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : 'Rasmni saqlab bo‘lmadi');
    } finally {
      setBusy(null);
      if (input.current) input.current.value = '';
    }
  }

  async function remove() {
    if (busy) return;
    setConfirm(false);
    setError('');
    setBusy('remove');
    try {
      await removeAvatar(uid);
      setFull('');
    } catch {
      setError('Rasmni o‘chirib bo‘lmadi');
    } finally {
      setBusy(null);
    }
  }

  const hasImage = !!thumb;

  return (
    <div className="avatar-editor">
      <button
        type="button"
        className={`avatar-editor__pick${busy ? ' avatar-editor__pick--busy' : ''}`}
        onClick={() => input.current?.click()}
        disabled={!!busy}
        aria-label={hasImage ? 'Rasmni almashtirish' : 'Rasm qo‘yish'}
      >
        <Avatar name={name} uid={uid} image={thumb ? full || thumb : undefined} size={84} />
        <span className="avatar-editor__badge" aria-hidden="true">
          {busy === 'save' ? '…' : '📷'}
        </span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => void pick(event.target.files?.[0])}
      />

      <div className="avatar-editor__actions">
        <button className="btn btn--sm btn--ghost" onClick={() => input.current?.click()} disabled={!!busy}>
          {busy === 'save' ? 'Rasm saqlanmoqda…' : hasImage ? 'Rasmni almashtirish' : 'Rasm qo‘yish'}
        </button>
        {hasImage && !confirm && (
          <button className="link link--danger" onClick={() => setConfirm(true)} disabled={!!busy}>
            Rasmni o‘chirish
          </button>
        )}
      </div>

      {confirm && (
        <div className="avatar-editor__confirm" role="alertdialog" aria-label="Rasm o‘chirilsinmi?">
          <p>
            <b>Rasm o‘chirilsinmi?</b> Rasm o‘rniga yana ismingizning birinchi harfi ko‘rinadi.
          </p>
          <div className="result__actions">
            <button className="btn btn--sm btn--danger" onClick={() => void remove()}>
              {busy === 'remove' ? 'O‘chirilmoqda…' : 'O‘chirish'}
            </button>
            <button className="btn btn--sm btn--ghost" onClick={() => setConfirm(false)}>
              Bekor qilish
            </button>
          </div>
        </div>
      )}

      {error && <p className="form__err">{error}</p>}

      <p className="avatar-editor__note">
        Rasm hammaga ko‘rinadi: reytingda, bellashuvda va profilingizda. Faqat
        o‘z rasmingizni qo‘ying — nomaqbul rasm shikoyatdan keyin o‘chiriladi
        va hisob cheklanadi.
      </p>
    </div>
  );
}
