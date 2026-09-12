/** O'yinchining ochiq profili — `/oyinchi/{uid}`, ilovadagi
 *  `PublicProfilePage` ning veb ko'rinishi.
 *
 *  Reytingdan, jang natijasidan va donatchilar ro'yxatidan ochiladi —
 *  o'yinchi ismini bosgan odam «bu kim va qanday o'ynaydi» degan savolga
 *  javob oladi va darrov «unda o'ynaymiz» deya oladi: «So'zjangga
 *  chaqirish» sarlavhaning ostida turadi.
 *
 *  Faqat ochiq ma'lumot: umumiy ball, bugungi kunlik natija, bellashuv
 *  reytingi va loyihaga hissasi. Ketma-ketlik va urinishlar taqsimoti
 *  yo'q — ular shaxsiy hujjatda turadi va begonaga ochiq emas. */
import { useEffect, useState } from 'react';
import { links } from '../data/site';
import { useAuth } from '../lib/auth';
import { recordProfileView } from '../lib/profileViews';
import { isEmptyProfile, loadPublicProfile, type PublicProfile } from '../lib/publicProfile';
import { routeParam } from '../lib/useRoute';
import { pretty } from '../lib/uz';
import { formatSum } from '../lib/support';
import { donorTier } from '../lib/donor';
import DonorChip from './DonorChip';
import Avatar from './Avatar';
import BattleStats from './BattleStats';
import { ChevronLeft, Heart, Person, Swords, Trophy } from './Icons';
import SendInvite, { type InviteTarget } from './SendInvite';

type State =
  | { kind: 'loading' }
  | { kind: 'failed' }
  | { kind: 'ready'; profile: PublicProfile };

export default function PlayerPage() {
  const uid = routeParam();
  const { account, openPrompt } = useAuth();
  /** Yuklangan natija kimniki — manzil almashganda (`/oyinchi/a` →
   *  `/oyinchi/b`) eski profil yangi ism ostida ko'rinib qolmasin. */
  const [loaded, setLoaded] = useState<{ uid: string; result: State } | null>(null);
  const [target, setTarget] = useState<InviteTarget | null>(null);

  const state: State = !uid
    ? { kind: 'failed' }
    : loaded?.uid === uid
      ? loaded.result
      : { kind: 'loading' };

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    loadPublicProfile(uid)
      .then((profile) => {
        if (alive) setLoaded({ uid, result: { kind: 'ready', profile } });
      })
      .catch(() => {
        if (alive) setLoaded({ uid, result: { kind: 'failed' } });
      });
    return () => {
      alive = false;
    };
  }, [uid]);

  /* Profil ochilgani qayd etiladi: hujjat yaratilganda Cloud Function
     egasiga push xabar yuboradi (birinchi ko'rishda, soatiga bir marta).
     Ilovadagi bilan bir xil yozuv — saytdan kelgan tashrif ham sanaladi.
     Mehmon yoza olmaydi, o'z profilini ochish esa sanalmaydi. */
  const viewerUid = account?.uid;
  useEffect(() => {
    if (!uid || !viewerUid) return;
    void recordProfileView({ ownerUid: uid, viewerUid });
  }, [uid, viewerUid]);

  const isMe = !!account && account.uid === uid;
  const profile = state.kind === 'ready' ? state.profile : null;
  const name = pretty(profile?.nickname || 'O‘yinchi');

  const invite = () => {
    // Jang hisobga bog'lanadi, shuning uchun mehmon avval kiradi.
    if (!account) {
      openPrompt('signIn');
      return;
    }
    setTarget({ uid, nickname: profile?.nickname || 'O‘yinchi', kind: 'profile' });
  };

  return (
    <section className="oyin player">
      <div className="wrap player__wrap">
        <a className="player__back" href={links.play}>
          <ChevronLeft size={18} />
          Reyting
        </a>

        {state.kind === 'failed' && (
          <p className="panel__note player__msg">
            Profilni o‘qib bo‘lmadi. Internet aloqasini tekshirib, qayta urinib ko‘ring.
          </p>
        )}

        {state.kind === 'loading' && (
          <div className="player__skeleton" aria-busy="true" aria-label="Yuklanmoqda">
            <i style={{ height: 196 }} />
            <i style={{ height: 104 }} />
            <i style={{ height: 84 }} />
            <i style={{ height: 180 }} />
          </div>
        )}

        {profile && (
          <>
            <header className="panel player__head">
              <Avatar name={name} uid={profile.uid} size={72} />
              <h1 className="player__name">{name}</h1>
              {/* Daraja yorlig'i bu yerda takrorlanmaydi — u bellashuv
                  kartochkasining o'zida turadi. */}
              <div className="player__chips">
                {isMe && (
                  <span className="versus__chip player__chip--me">
                    <Person size={13} />
                    Bu siz
                  </span>
                )}
                {profile.scoreRank !== null && (
                  <span className="versus__tag">
                    <Trophy size={13} /> Umumiy reytingda №{profile.scoreRank}
                  </span>
                )}
                {donorTier(profile.donated) && (
                  <DonorChip tier={donorTier(profile.donated)!} className="versus__chip" />
                )}
              </div>
            </header>

            {/* Chaqiruv sarlavhaning ostida. Profil bo'sh bo'lsa ham chaqirsa
                bo'ladi: jang o'ynamagan odam aynan shu yo'l bilan birinchi
                jangiga tortiladi. */}
            {!isMe && (
              <div className="player__invite">
                <button className="btn btn--lg" onClick={invite}>
                  <Swords size={18} />
                  So‘zjangga chaqirish
                </button>
                <p className="panel__note">
                  Raqibga xabar boradi. Qabul qilsa, jang darhol boshlanadi.
                </p>
              </div>
            )}

            {isEmptyProfile(profile) ? (
              <p className="panel panel__note player__msg">
                Bu o‘yinchi hali natija yozmagan — birinchi ballini kutamiz
              </p>
            ) : (
              <>
                <div className="player__score">
                  <span className="player__score-label">Umumiy ball</span>
                  <strong>{profile.totalScore}</strong>
                  <span className="player__score-label">
                    {profile.wordsFound} topilgan so‘z
                  </span>
                </div>

                <Block title="Bugungi kunlik">
                  {profile.today === null ? (
                    <Empty text="Bugun hali o‘ynamagan" />
                  ) : !profile.today.won ? (
                    <Empty text="Bugun so‘zni topmagan" />
                  ) : (
                    <ul className="metrics metrics--cells">
                      <li>
                        <strong>№{profile.today.number}</strong>
                        <span>Kunlik</span>
                      </li>
                      <li className="metrics__cell--accent">
                        <strong>{profile.today.points}</strong>
                        <span>Ball</span>
                      </li>
                      <li>
                        <strong>{profile.today.attempts}</strong>
                        <span>urinish</span>
                      </li>
                    </ul>
                  )}
                </Block>

                {/* Kartochka o'z sarlavhasi, g'alaba foizi va ketma-ketligi
                    bilan keladi — ular takrorlanmaydi; yoniga faqat durang
                    va jadvaldagi o'rin qo'shiladi. */}
                {profile.battle === null ? (
                  <Block title="Bellashuv reytingi">
                    <Empty text="Hali bellashuvda o‘ynamagan" />
                  </Block>
                ) : (
                  <div className="player__block">
                    <BattleStats uid={profile.uid} />
                    <ul className="metrics metrics--cells metrics--two">
                      <li>
                        <strong>{profile.battle.draws}</strong>
                        <span>Durang</span>
                      </li>
                      {profile.battleRank !== null && (
                        <li>
                          <strong>№{profile.battleRank}</strong>
                          <span>Bellashuv jadvalida</span>
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {profile.donated > 0 && (
                  <Block title="Loyihaga hissasi">
                    <div className="panel player__support">
                      <Heart size={18} />
                      <div>
                        <strong>{formatSum(profile.donated)} so‘m</strong>
                        <span>{profile.donations} marta</span>
                      </div>
                    </div>
                  </Block>
                )}
              </>
            )}

            <p className="panel__note player__private">
              Shaxsiy statistika faqat egasiga ko‘rinadi
            </p>
          </>
        )}
      </div>

      {target && <SendInvite target={target} onClose={() => setTarget(null)} />}
    </section>
  );
}

/** Sarlavha va uning ostidagi mazmun. */
function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="player__block">
      <span className="panel__label">{title}</span>
      {children}
    </div>
  );
}

/** Bo'sh bo'lim: joy bo'sh qolmaydi, sababi yozib qo'yiladi. */
function Empty({ text }: { text: string }) {
  return <p className="panel panel__note player__empty">{text}</p>;
}
