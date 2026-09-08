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
  PRESETS,
  type Donation,
  type SupportBalance,
} from '../lib/support';
import { pretty } from '../lib/uz';
import Modal from './Modal';

function Balance({ balance }: { balance: SupportBalance }) {
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

function Donors({ donations, uid }: { donations: Donation[] | null; uid?: string }) {
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
              {pretty(donationPhrase(donation, index))}
              {mine && <b className="donor__me">Bu siz</b>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Donat oynasi: summa tanlash va to'lovga o'tish. */
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
  const [amount, setAmount] = useState(String(PRESETS[1]));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const value = Number(amount.replace(/[^0-9]/g, '')) || 0;
  const valid = value >= DONATION_MIN && value <= DONATION_MAX;

  async function pay() {
    if (!valid || busy) return;
    setBusy(true);
    setError('');
    try {
      const payUrl = await createDonation({ amount: value, nickname });
      // To'lov sahifasi o'sha oynada ochiladi: inPAY tugagach `/donat`
      // ga qaytaradi va u yerda natija ko'rinadi.
      window.location.href = payUrl;
    } catch (cause) {
      setError(functionError(cause));
      setBusy(false);
    }
  }

  return (
    <Modal
      title="Hissa qo‘shish"
      lead="Ilova bepul — qo‘llab-quvvatlasangiz, rivojlanishda davom etamiz."
      onClose={onClose}
    >
      {!signedIn ? (
        <div className="form">
          <p className="panel__note">
            Hissangiz ismingiz bilan ro‘yxatda chiqadi va hisobingizga
            bog‘lanadi — shuning uchun avval kirish kerak. So‘ztopni esa
            kirmasdan ham o‘ynash mumkin.
          </p>
          <div className="result__actions">
            <button className="btn btn--sm" onClick={onSignIn}>
              Kirish
            </button>
            <button className="btn btn--sm btn--ghost" onClick={onRegister}>
              Hisob ochish
            </button>
          </div>
        </div>
      ) : (
        <div className="form">
          <div className="support__presets" role="group" aria-label="Tayyor summalar">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`chip${value === preset ? ' chip--on' : ''}`}
                onClick={() => {
                  setAmount(String(preset));
                  setError('');
                }}
              >
                {formatSum(preset)}
              </button>
            ))}
          </div>

          <label className="field">
            <span>Summa (so‘m)</span>
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

          <p className="panel__note">
            Ro‘yxatda <b>{pretty(nickname)}</b> nomi bilan chiqasiz. To‘lov
            Payme, Click yoki karta orqali — to‘lagach hisob o‘zi yangilanadi.
          </p>

          <button className="btn btn--lg" onClick={pay} disabled={!valid || busy}>
            {busy ? 'To‘lov ochilmoqda…' : `${formatSum(value)} so‘m qo‘shish`}
          </button>
        </div>
      )}
    </Modal>
  );
}

export default function Support({ page = false }: { page?: boolean }) {
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
  if (balance && !state.visible) {
    return page ? (
      <section className="section">
        <div className="wrap">
          <p className="panel__note">Bu bo‘lim hozircha yopiq.</p>
        </div>
      </section>
    ) : null;
  }

  return (
    <section className={`section support${page ? ' support--page' : ''}`} id="qollab">
      <div className="wrap">
        {/* Alohida sahifada nom ramkadagi sarlavhada turadi —
            ikki marta yozilmasin. */}
        <div className="section__head reveal">
          {!page && (
            <>
              <span className="section__kicker">Qo‘llab-quvvatlash</span>
              <h2>Loyihani hamjamiyat ko‘taradi</h2>
            </>
          )}
          <p className="section__lead">
            Ilova ichi xaridlari yo‘q, obuna yo‘q. Yig‘ilgan pul lug‘atni
            kengaytirishga va serverga ketadi — hisob esa ochiq turadi.
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
              shu ro‘yxat ko‘rinadi.
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
