/** Qo'llab-quvvatlash — ilovadagi donat bo'limining sayt ko'rinishi.
 *
 *  Ilovada bu bosh ekrandagi karta va undan ochiladigan oyna; saytda esa
 *  tanishtiruv sahifasidagi bo'lim va `/qollab` manzili. Ma'lumot bir xil
 *  joydan keladi (`app/support`, `donations`), to'lovni ham o'sha
 *  `donationCreate` funksiyasi ochadi — ya'ni telefonda va saytda
 *  qo'shilgan hissa bitta ro'yxatda ko'rinadi.
 *
 *  Hisob nega kerak: donat ismingiz bilan ro'yxatga tushadi va funksiya
 *  uni hisobga bog'laydi. Shuning uchun kirmagan odamga avval kirish
 *  taklif qilinadi — o'yinning o'zi esa hisobsiz ham o'ynaladi. */
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { functionError } from '../firebase/functions';
import {
  balanceHint,
  createDonation,
  DONATION_MAX,
  DONATION_MIN,
  donationPhrase,
  EMPTY_BALANCE,
  formatSum,
  loadBalance,
  loadDonations,
  type Donation,
  type SupportBalance,
} from '../lib/support';
import { pretty } from '../lib/uz';
import { links, playerLink } from '../data/site';
import { DONOR_TIERS, donorLabel, donorTier, forgetDonorTotals, nextDonorTier } from '../lib/donor';
import Modal from './Modal';

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
              {mine && <b className="donor__me">Bu siz</b>}
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
      const payUrl = await createDonation({ amount: value, nickname });
      // Yig'indi keshi eskiradi: qaytib kelganda yangi daraja ko'rinsin.
      forgetDonorTotals();
      // To'lov sahifasi o'sha oynada ochiladi: inPAY tugagach `/donat`
      // ga qaytaradi va u yerda natija ko'rinadi.
      window.location.href = payUrl;
    } catch (cause) {
      setError(functionError(cause));
      setBusy(false);
    }
  }

  // Tayyor summalar — darajalar pastdan yuqoriga.
  const presets = [...DONOR_TIERS].reverse();

  return (
    <div className="form donate">
      <div className="donate__presets" role="group" aria-label="Tayyor summalar">
        {presets.map((level) => (
          <button
            key={level.tier}
            type="button"
            className={`donate__preset donate__preset--${level.tier}${
              value === level.min ? ' donate__preset--on' : ''
            }`}
            onClick={() => {
              setAmount(String(level.min));
              setError('');
            }}
          >
            <i aria-hidden="true" />
            <strong>{formatSum(level.min)}</strong>
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

/** Donat oynasi — bosh sahifadagi bo'limdan. */
function DonateModal({
  nickname,
  signedIn,
  onClose,
  onSignIn,
  onRegister,
}: {
  nickname: string;
  signedIn: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onRegister: () => void;
}) {
  return (
    <Modal
      title="Hissa qo‘shish"
      lead="Ilova bepul — qo‘llab-quvvatlasangiz, rivojlanishda davom etamiz."
      onClose={onClose}
    >
      <DonateForm
        nickname={nickname}
        signedIn={signedIn}
        onSignIn={onSignIn}
        onRegister={onRegister}
      />
    </Modal>
  );
}

/** Bosh sahifadagi bo'lim. To'liq sahifa — `SupportPage.tsx` (`/qollab`). */
export default function Support() {
  const { account, nickname, openPrompt } = useAuth();
  const [balance, setBalance] = useState<SupportBalance | null>(null);
  const [donations, setDonations] = useState<Donation[] | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [next, list] = await Promise.all([loadBalance(), loadDonations()]);
      if (!alive) return;
      setBalance(next);
      setDonations(list);
    })();
    return () => {
      alive = false;
    };
    // Kirgandan keyin ro'yxat qayta o'qiladi: o'z hissasi ajratib
    // ko'rsatilishi uchun `uid` kerak.
  }, [account?.uid]);

  const state = balance ?? EMPTY_BALANCE;

  // Adminka bo'limni yopib qo'yishi mumkin — u holda saytda ham chiqmaydi.
  if (balance && !state.visible) return null;

  return (
    <section className="section support" id="qollab">
      <div className="wrap">
        <div className="section__head reveal">
          <span className="section__kicker">Qo‘llab-quvvatlash</span>
          <h2>Loyihani hamjamiyat ko‘taradi</h2>
          <p className="section__lead">
            Ilova ichi xaridlari yo‘q, obuna yo‘q. Yig‘ilgan pul loyihani
            rivojlantirishga ketadi, qolgani — muallifga bir piyola choy puli.
            Hisob esa ochiq turadi.
          </p>
        </div>

        <div className="support__grid reveal">
          <div className="panel support__card">
            <Balance balance={state} />
            <button className="btn btn--lg" onClick={() => setOpen(true)}>
              Hissa qo‘shish
            </button>
            <p className="panel__note">
              To‘lov Payme, Click yoki karta orqali. Telefondagi ilovada ham
              shu ro‘yxat ko‘rinadi. Homiylik darajalari va top donatchilar —{' '}
              <a className="link" href={links.donate}>
                to‘liq sahifada
              </a>
              .
            </p>
          </div>

          <div className="panel support__donors">
            <div className="panel__head">
              <h3>Qo‘llab-quvvatlaganlar</h3>
            </div>
            <Donors donations={donations} uid={account?.uid} />
          </div>
        </div>
      </div>

      {open && (
        <DonateModal
          nickname={nickname}
          signedIn={!!account}
          onClose={() => setOpen(false)}
          onSignIn={() => {
            setOpen(false);
            openPrompt('signIn');
          }}
          onRegister={() => {
            setOpen(false);
            openPrompt('register');
          }}
        />
      )}
    </section>
  );
}
