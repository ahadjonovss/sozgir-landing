/** Qo'llab-quvvatlash — donat bo'lagi, `/qollab` sahifasi uchun.
 *
 *  Bu yerda bo'lakchalar turadi: hisob, hissa qo'shganlar ro'yxati va
 *  to'lov shakli. Ularni `SupportPage` yig'adi. Bosh sahifada donat
 *  bo'limi yo'q — u yerda u javob beradigan savol yo'q edi va
 *  sahifani uzaytirardi; qolgani hammasi `/qollab` da.
 *
 *  Ma'lumot ilova bilan bir xil joydan keladi (`app/support`,
 *  `donations`), to'lovni ham o'sha `donationCreate` funksiyasi
 *  ochadi — ya'ni telefonda va saytda qo'shilgan hissa bitta
 *  ro'yxatda ko'rinadi.
 *
 *  Hisob nega kerak: donat ismingiz bilan ro'yxatga tushadi va funksiya
 *  uni hisobga bog'laydi. Shuning uchun kirmagan odamga avval kirish
 *  taklif qilinadi — o'yinning o'zi esa hisobsiz ham o'ynaladi. */
import { useState } from 'react';
import { apiError } from '../api/errors';
import {
  balanceHint,
  createDonation,
  DONATION_MAX,
  DONATION_MIN,
  donationPhrase,
  formatSum,
  type Donation,
  type SupportBalance,
} from '../lib/support';
import { pretty } from '../lib/uz';
import { playerLink } from '../data/site';
import { DONOR_TIERS, donorLabel, donorTier, forgetDonorTotals, nextDonorTier } from '../lib/donor';
import { DonorBadge } from './Units';
import YouTag from './YouTag';

export function Balance({ balance }: { balance: SupportBalance }) {
  return (
    <div className="support__balance">
      <span className="support__label">Loyiha ishlab topdi</span>
      <strong className="support__sum">
        {balance.earned > 0 ? (
          <>
            {formatSum(balance.earned)} <small>so‘m</small>
          </>
        ) : (
          'Hali ishlab topilmadi'
        )}
      </strong>
      <span className="support__hint">{balanceHint(balance.earned)}</span>
      {balance.count > 0 && (
        <span className="support__count">
          {balance.count} ta hissa qo‘shildi
        </span>
      )}
    </div>
  );
}

export function Donors({ donations, uid }: { donations: Donation[] | null; uid?: string }) {
  if (donations === null) return <p className="panel__note">Yuklanmoqda…</p>;

  if (donations.length === 0) {
    return (
      <p className="panel__note">
        Hozircha bo‘sh — birinchi bo‘lishingiz mumkin.
      </p>
    );
  }

  return (
    <ul className="donors">
      {donations.map((donation, index) => {
        const mine = !!donation.uid && donation.uid === uid;
        return (
          <li key={`${donation.uid ?? donation.name}-${index}`} className={`donor${mine ? ' donor--me' : ''}`}>
            <span className="donor__mark" aria-hidden="true">
              ♥
            </span>
            <span className="donor__text">
              {donation.uid ? (
                <a className="donor__link" href={playerLink(donation.uid)}>
                  {pretty(donationPhrase(donation, index))}
                </a>
              ) : (
                pretty(donationPhrase(donation, index))
              )}
              {mine && <YouTag />}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Summa tanlash va to'lovga o'tish — oynada ham (bosh sahifa), donat
 *  sahifasida ham bitta shakl.
 *
 *  Tayyor summalar homiylik darajalarining chegaralari: odam qancha
 *  qo'shsa qaysi daraja bo'lishini tanlash paytida ko'radi. Kirilgan
 *  bo'lsa va hissasi ma'lum bo'lsa, natija joriy yig'indi bilan
 *  hisoblanadi («shu hissa bilan Boyvachcha bo'lasiz»). */
export function DonateForm({
  nickname,
  signedIn,
  current = null,
  onSignIn,
  onRegister,
}: {
  nickname: string;
  signedIn: boolean;
  /** Joriy yig'indi (so'm); noma'lum bo'lsa `null`. */
  current?: number | null;
  onSignIn: () => void;
  onRegister: () => void;
}) {
  const [amount, setAmount] = useState(String(DONOR_TIERS[DONOR_TIERS.length - 2].min));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const value = Number(amount.replace(/[^0-9]/g, '')) || 0;
  const valid = value >= DONATION_MIN && value <= DONATION_MAX;
  const after = donorTier((current ?? 0) + value);
  const now = current === null ? null : donorTier(current);

  async function pay() {
    if (!valid || busy) return;
    setBusy(true);
    setError('');
    try {
      const payUrl = await createDonation({ amount: value });
      // Yig'indi keshi eskiradi: qaytib kelganda yangi daraja ko'rinsin.
      forgetDonorTotals();
      // To'lov sahifasi o'sha oynada ochiladi: inPAY tugagach `/donat`
      // ga qaytaradi va u yerda natija ko'rinadi.
      window.location.href = payUrl;
    } catch (cause) {
      setError(apiError(cause));
      setBusy(false);
    }
  }

  // Tayyor summalar — darajalar pastdan yuqoriga.
  //
  // Eng past darajaning chegarasi (5 000) eng kam donatdan past, ya'ni uni
  // o'z holicha qo'ysak tugma serverdan xato olib qaytardi. Shuning uchun
  // summa ko'tariladi — daraja o'sha-o'sha qoladi.
  const presets = [...DONOR_TIERS].reverse().map((level) => ({
    ...level,
    amount: Math.max(level.min, DONATION_MIN),
  }));

  return (
    <div className="form donate">
      <div className="donate__presets" role="group" aria-label="Tayyor summalar">
        {presets.map((level) => (
          <button
            key={level.tier}
            type="button"
            className={`donate__preset donate__preset--${level.tier}${
              value === level.amount ? ' donate__preset--on' : ''
            }`}
            onClick={() => {
              setAmount(String(level.amount));
              setError('');
            }}
          >
            <DonorBadge tier={level.tier} size={24} />
            <strong>{formatSum(level.amount)}</strong>
            <span>{level.label}</span>
          </button>
        ))}
      </div>

      <label className="field">
        <span>Yoki o‘z summangiz (so‘m)</span>
        <input
          inputMode="numeric"
          value={amount}
          onChange={(event) => {
            setAmount(event.target.value.replace(/[^0-9 ]/g, ''));
            setError('');
          }}
          maxLength={9}
        />
      </label>

      {!valid && value > 0 && (
        <p className="support__error">
          {value < DONATION_MIN
            ? `Eng kami ${formatSum(DONATION_MIN)} so‘m`
            : 'Summa juda katta'}
        </p>
      )}
      {error && <p className="support__error">{error}</p>}

      {/* Natija: shu hissa bilan qaysi daraja. */}
      {valid && after && (
        <p className={`donate__result donate__result--${after}`}>
          <i aria-hidden="true" />
          {now && now === after
            ? `Darajangiz «${donorLabel(after)}» bo‘lib qoladi${
                nextDonorTier((current ?? 0) + value)
                  ? `, «${nextDonorTier((current ?? 0) + value)!.label}» gacha ${formatSum(
                      nextDonorTier((current ?? 0) + value)!.min - (current ?? 0) - value,
                    )} so‘m qoladi`
                  : ''
              }`
            : `Shu hissa bilan «${donorLabel(after)}» bo‘lasiz`}
        </p>
      )}
      {valid && !after && (
        <p className="donate__result">
          <i aria-hidden="true" />
          Homiylik darajasi {formatSum(DONOR_TIERS[DONOR_TIERS.length - 1].min)} so‘mdan boshlanadi — lekin har bir so‘m loyihaga ketadi.
        </p>
      )}

      {signedIn ? (
        <>
          <button className="btn btn--lg" onClick={pay} disabled={!valid || busy}>
            {busy ? 'To‘lov ochilmoqda…' : `${formatSum(value)} so‘m qo‘shish`}
          </button>
          <p className="panel__note">
            Ro‘yxatda <b>{pretty(nickname)}</b> nomi bilan chiqasiz. To‘lov
            Payme, Click yoki karta orqali — to‘lagach hisob o‘zi yangilanadi.
          </p>
        </>
      ) : (
        <>
          <p className="panel__note">
            Hissangiz ismingiz bilan ro‘yxatda chiqadi va hisobingizga
            bog‘lanadi — shuning uchun avval kirish kerak.
          </p>
          <div className="result__actions donate__gate">
            <button className="btn" onClick={onSignIn}>
              Kirish
            </button>
            <button className="btn btn--ghost" onClick={onRegister}>
              Hisob ochish
            </button>
          </div>
        </>
      )}
    </div>
  );
}
