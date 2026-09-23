/** O'yinchi nomi va tasdiq belgisi.
 *
 *  Belgi **nom turgan har joyda** chiqadi: jadvalda, jangda, tarixda,
 *  profilda. Shuning uchun nom ham, belgi ham bitta komponentda —
 *  yangi ro'yxat qo'shilganda uni yana o'n joyga qo'lda qo'shish
 *  kerak bo'lmasin.
 *
 *  Jadvalda belgi shunchaki rasm: bosilsa qator havolasi ochilishi
 *  kerak, tugma ichida tugma bo'lmaydi. Profilda esa u bosiladi va
 *  oyna ochiladi — «bu kim?» degan savol aynan o'sha yerda tug'iladi.
 *  Egasining o'zi bosgan bo'lsa oyna boshqacha: u belgisining nimaligini
 *  so'ramaydi, unga aytiladigan gap boshqa (ilovadagi
 *  `VerifiedThanksSheet`). */
import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useDonorMark } from '../lib/donorMark';
import { VERIFIED, useVerified } from '../lib/verified';
import { pretty } from '../lib/uz';
import Modal from './Modal';
import { Person } from './Icons';

/** Homiy muhri — ism yonidagi kichik belgi.
 *
 *  Tasdiq belgisi bilan bir qatorda turadi, lekin boshqa narsani
 *  aytadi: tasdiq — «bu o'sha odam», muhr — «bu odam loyihani
 *  qo'llagan». Ro'yxatlarda bosilmaydi: qator bosilsa profil ochilishi
 *  kerak, tugma ichida tugma bo'lmaydi. */
export function DonorMarkIcon({
  uid,
  size = 15,
}: {
  uid: string | null | undefined;
  size?: number;
}) {
  const mark = useDonorMark(uid);
  if (!mark) return null;
  return (
    <img
      className="donor-mark"
      src={`/muhr/${mark.id}.png`}
      alt={mark.label}
      title={`${mark.label} — ${mark.story}`}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
    />
  );
}

/** Faqat belgi — nomi boshqa joyda chizilgan bo'lsa. */
export function VerifiedMark({
  uid,
  size = 16,
}: {
  uid: string | null | undefined;
  size?: number;
}) {
  const verified = useVerified(uid);
  if (!verified) return null;
  return (
    <img
      className="verified"
      src="/verified.png"
      alt={VERIFIED.title}
      title={VERIFIED.title}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
    />
  );
}

/** Profildagi belgi: bosilsa oyna ochiladi. */
export function VerifiedBadge({
  uid,
  size = 22,
}: {
  uid: string | null | undefined;
  size?: number;
}) {
  const verified = useVerified(uid);
  const { account } = useAuth();
  const [open, setOpen] = useState(false);
  const mine = !!uid && account?.uid === uid;

  if (!verified) return null;

  return (
    <>
      <button
        className="verified-badge"
        type="button"
        aria-label={`${VERIFIED.title} haqida`}
        onClick={() => setOpen(true)}
      >
        <img
          className="verified"
          src="/verified.png"
          alt={VERIFIED.title}
          width={size}
          height={size}
          decoding="async"
        />
      </button>
      {open && <VerifiedSheet mine={mine} onClose={() => setOpen(false)} />}
    </>
  );
}

/** Belgining izohi.
 *
 *  Ikki ko'rinishi bor va ikkalasi bitta oynada: begona odam «bu nima?»
 *  deb so'raydi, egasi esa buni biladi — unga nishon nima berishi
 *  aytiladi. Imtiyozlar bittalab sanaladi: «premium» so'zining o'zi
 *  nimadan ozod bo'lganini aytmaydi. */
function VerifiedSheet({ mine, onClose }: { mine: boolean; onClose: () => void }) {
  return (
    <Modal title={mine ? VERIFIED.thanksTitle : VERIFIED.title} onClose={onClose}>
      <div className="verified-sheet">
        <span className="verified-sheet__glow" aria-hidden="true">
          <img src="/verified.png" alt="" width={76} height={76} decoding="async" />
        </span>

        <p className="verified-sheet__lead">
          {mine ? VERIFIED.thanksBody : VERIFIED.body}
        </p>

        {mine ? (
          <>
            <p className="verified-sheet__perk">
              <Person size={18} />
              {VERIFIED.thanksPerk}
            </p>
            <ul className="verified-sheet__perks">
              {VERIFIED.perks.map((perk) => (
                <li key={perk}>{perk}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="panel__note">{VERIFIED.note}</p>
        )}
      </div>
    </Modal>
  );
}

/** Nom va uning yonidagi belgi — jadval, jang va tarix uchun. */
export default function PlayerName({
  uid,
  name,
  size = 16,
}: {
  uid: string | null | undefined;
  name: string;
  size?: number;
}) {
  return (
    <>
      {pretty(name)}
      <VerifiedMark uid={uid} size={size} />
      <DonorMarkIcon uid={uid} size={size - 1} />
    </>
  );
}
