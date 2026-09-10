/** Qo'llab-quvvatlash sahifasi — `/qollab`.
 *
 *  Bosh sahifadagi bo'lim qisqa: hisob, tugma va oxirgi donatlar. Bu
 *  sahifa esa to'liq: chapda **hissa qo'shish shakli** (oyna emas —
 *  sahifaga shuning uchun kelingan) va homiylik darajalari, o'ngda
 *  loyiha hisobi, top donatchilar va oxirgilari. Kirgan odam o'z
 *  hissasini, darajasini va keyingi darajagacha qolgan yo'lni ko'radi —
 *  donatga sabab shu yerda. */
import { useEffect, useState } from 'react';
import { playerLink } from '../data/site';
import { useAuth } from '../lib/auth';
import {
  DONOR_TIERS,
  donorLabel,
  donorProgress,
  donorTier,
  nextDonorTier,
  useDonorTotal,
} from '../lib/donor';
import {
  EMPTY_BALANCE,
  formatSum,
  loadBalance,
  loadDonations,
  loadTopDonors,
  type Donation,
  type SupportBalance,
  type TopDonor,
} from '../lib/support';
import { pretty } from '../lib/uz';
import Avatar from './Avatar';
import DonorChip from './DonorChip';
import { Heart } from './Icons';
import { Balance, DonateForm, Donors } from './Support';

/** Har darajaning qisqa izohi — ro'yxatda. */
const TIER_NOTES: Record<string, string> = {
  saxovatpesha: 'Avatar atrofida bronza halqa',
  boyvachcha: 'Kumush halqa',
  eskiBoylardan: 'Oltin halqa',
  zodagon: 'Binafsha halqa va nur',
  oqsuyak: 'Marvarid halqa, eng kuchli nur',
};

/** Kirgan odamning hissasi: yig'indi, daraja, keyingisigacha yo'l. */
function Mine({ uid, name }: { uid: string; name: string }) {
  const total = useDonorTotal(uid);
  if (total === null) return <div className="sp__me sp__me--loading" aria-busy="true" />;
  const tier = donorTier(total);
  const next = nextDonorTier(total);

  return (
    <div className="sp__me">
      <Avatar name={name} uid={uid} size={56} />
      <div className="sp__me-text">
        <span className="support__label">Sizning hissangiz</span>
        <strong className="sp__me-sum">
          {total > 0 ? `${formatSum(total)} so‘m` : 'Hali yo‘q'}
        </strong>
        {tier && (
          <div className="sp__me-row">
            <DonorChip tier={tier} />
          </div>
        )}
        {next && (
          <>
            <span className="sp__track" aria-hidden="true">
              <i style={{ width: `${Math.round(donorProgress(total) * 100)}%` }} />
            </span>
            <span className="sp__me-note">
              «{next.label}» gacha {formatSum(next.min - total)} so‘m
            </span>
          </>
        )}
        {!next && <span className="sp__me-note">Eng yuqori homiylik darajasi</span>}
      </div>
    </div>
  );
}

function Tiers() {
  return (
    <ol className="sp__tiers">
      {[...DONOR_TIERS].reverse().map((level) => (
        <li key={level.tier} className={`sp__tier sp__tier--${level.tier}`}>
          <i className="sp__tier-ring" aria-hidden="true" />
          <div className="sp__tier-text">
            <strong>{level.label}</strong>
            <span>{TIER_NOTES[level.tier]}</span>
          </div>
          <b className="sp__tier-sum">{formatSum(level.min)} so‘m</b>
        </li>
      ))}
    </ol>
  );
}

function Top({ donors, uid }: { donors: TopDonor[] | null; uid?: string }) {
  if (donors === null) return <p className="panel__note">Yuklanmoqda…</p>;
  if (donors.length === 0) {
    return <p className="panel__note">Hozircha bo‘sh — birinchi bo‘lishingiz mumkin.</p>;
  }
  return (
    <ol className="ranks">
      {donors.map((donor, index) => {
        const tier = donorTier(donor.total);
        const who = (
          <>
            <Avatar name={donor.name} uid={donor.uid} size={28} />
            <span className="rank__name">{pretty(donor.name)}</span>
          </>
        );
        return (
          <li
            key={donor.uid ?? `${donor.name}-${index}`}
            className={`rank sp__top${donor.uid && donor.uid === uid ? ' rank--me' : ''}`}
          >
            <span className="rank__place">{index + 1}</span>
            {donor.uid ? (
              <a className="rank__who" href={playerLink(donor.uid)}>
                {who}
              </a>
            ) : (
              <span className="rank__who">{who}</span>
            )}
            <span className="rank__meta">{tier ? donorLabel(tier) : `${donor.count} marta`}</span>
            <span className="rank__points">{formatSum(donor.total)}</span>
          </li>
        );
      })}
    </ol>
  );
}

export default function SupportPage() {
  const { account, nickname, openPrompt } = useAuth();
  const [balance, setBalance] = useState<SupportBalance | null>(null);
  const [donations, setDonations] = useState<Donation[] | null>(null);
  const [top, setTop] = useState<TopDonor[] | null>(null);
  const total = useDonorTotal(account?.uid);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [next, list, best] = await Promise.all([
        loadBalance(),
        loadDonations(8),
        loadTopDonors(5),
      ]);
      if (!alive) return;
      setBalance(next);
      setDonations(list);
      setTop(best);
    })();
    return () => {
      alive = false;
    };
  }, [account?.uid]);

  const state = balance ?? EMPTY_BALANCE;

  // Adminka bo'limni yopib qo'yishi mumkin.
  if (balance && !state.visible) {
    return (
      <section className="section">
        <div className="wrap">
          <p className="panel__note">Bu bo‘lim hozircha yopiq.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section support support--page sp">
      <div className="wrap">
        <div className="section__head sp__head">
          <span className="section__kicker">Qo‘llab-quvvatlash</span>
          <h1>Loyihani hamjamiyat ko‘taradi</h1>
          <p className="section__lead">
            Ilova ichi xaridlari yo‘q, obuna yo‘q. Yig‘ilgan pul loyihani
            rivojlantirishga ketadi, hisob ochiq turadi. Qo‘llaganlar
            o‘yinda ajralib turadi — homiylik darajasi bilan.
          </p>
        </div>

        <div className="sp__grid">
          <div className="sp__main">
            <div className="panel sp__hero">
              {account ? (
                <Mine uid={account.uid} name={account.nickname} />
              ) : (
                <div className="sp__me sp__me--guest">
                  <span className="sp__me-heart" aria-hidden="true">
                    <Heart size={22} />
                  </span>
                  <div className="sp__me-text">
                    <strong className="sp__me-sum">Hissa qo‘shing</strong>
                    <span className="sp__me-note">
                      Donat qilganlar avatar halqasi va daraja chipi bilan
                      ajralib turadi — reytingda, jangda, profilda.
                    </span>
                  </div>
                </div>
              )}

              <DonateForm
                nickname={nickname}
                signedIn={!!account}
                current={account ? total : null}
                onSignIn={() => openPrompt('signIn')}
                onRegister={() => openPrompt('register')}
              />
            </div>

            <div className="panel">
              <div className="panel__head">
                <h3>Homiylik darajalari</h3>
                <span className="panel__tag">Umumiy summadan</span>
              </div>
              <Tiers />
              <p className="panel__note">
                Halqa va chip hamma joyda ko‘rinadi: reyting jadvali, jang
                afishasi, natija va profil. Telefondagi ilovada ham.
              </p>
            </div>
          </div>

          <aside className="sp__side">
            <div className="panel support__card">
              <Balance balance={state} />
            </div>

            <div className="panel">
              <div className="panel__head">
                <h3>Top donatchilar</h3>
                <span className="panel__tag">Yig‘indi bo‘yicha</span>
              </div>
              <Top donors={top} uid={account?.uid} />
            </div>

            <div className="panel support__donors">
              <div className="panel__head">
                <h3>Oxirgilari</h3>
              </div>
              <Donors donations={donations} uid={account?.uid} />
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
