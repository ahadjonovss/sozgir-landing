/** `sozgir.uz/soztop` — so'z yashirish bo'limi.
 *
 *  Ilgari saytda bu yo'lning faqat ikkinchi yarmi bor edi: havolani
 *  bosgan odam o'ynardi, yashiradigan tomon esa ilovada qolardi. Natija
 *  g'alati edi — o'yinni endigina o'ynab chiqqan odamga «endi o'zingiz
 *  yashiring» deyilardi va ro'para kelgani do'kon havolasi bo'lardi.
 *  Endi ikkala tomoni ham shu yerda.
 *
 *  Ilovadagi `ChallengeCreatePage` ning veb ko'rinishi va mantiqi
 *  o'shaniki: so'z **lug'atdan tanlanadi** (`hideWord.ts`), sarlavha
 *  ixtiyoriy, natijada kod va havola chiqadi.
 *
 *  Hisob shart: yashirgan odam kim topganini ko'rishi kerak, ko'rish
 *  esa yozuvni talab qiladi. Mehmonga kirish taklif qilinadi — o'ynash
 *  tomoni esa avvalgidek hisobsiz ham ochiq. */
import { useEffect, useMemo, useState } from 'react';
import { challengeLink } from '../data/site';
import { useAuth } from '../lib/auth';
import {
  closeChallenge,
  createChallenge,
  myChallenges,
  type MyChallenge,
} from '../lib/challenge';
import { MIN_QUERY, hideWords, rankWords, suggestWords } from '../lib/hideWord';
import { toLatin } from '../lib/useScript';
import { lengthOf, normalize, pretty } from '../lib/uz';

/** Bir odamdagi ochiq so'zlar chegarasi — ilovadagi
 *  `ChallengeRules.openMax` ning nusxasi.
 *
 *  Nusxa ataylab: ro'yxat tepasida «beshtadan oshmaydi» deb yozib
 *  turish kerak va tugmani oldindan o'chirish mumkin. Serverda bu
 *  qoida hozircha yo'q (`CHALLENGE_OPEN_MAX` e'lon qilingan, lekin
 *  tekshirilmaydi), ya'ni bu yerdagisi yagona to'siq. */
const OPEN_MAX = 5;

const isOpen = (item: MyChallenge) =>
  item.status === 'open' && (item.expiresAt === 0 || item.expiresAt > Date.now());

/** «5 soat qoldi» — ilovadagi `challengeLeftShort` ning o'zi. */
function leftShort(expiresAt: number): string {
  const left = expiresAt - Date.now();
  if (left <= 0) return 'Muddati tugadi';
  const minutes = Math.floor(left / 60000);
  if (minutes < 1) return 'Muddati tugadi';
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days >= 1) return `${days} kun qoldi`;
  if (hours < 1) return `${minutes} daqiqa qoldi`;
  return `${hours} soat qoldi`;
}

/** Ulashish: iloji bo'lsa tizim oynasi, bo'lmasa nusxa.
 *
 *  `BattlePage` dagi bilan bir xil naqsh — ikkisi bir xil savolga
 *  javob beradi: havolani do'stga qanday yetkazish. */
function useShare() {
  const [copied, setCopied] = useState('');
  async function share(code: string) {
    const text = `So‘zgirda yashirgan so‘zimni topa olasizmi? ${challengeLink(code)}`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(code);
      window.setTimeout(() => setCopied(''), 2000);
    } catch {
      // Bekor qilindi yoki brauzer ruxsat bermadi — jim o'tamiz.
    }
  }
  return { copied, share };
}

/* ── So'z tanlash ───────────────────────────────────────────────────── */

function WordPicker({
  selected,
  onPick,
  onClear,
}: {
  selected: string;
  onPick: (word: string) => void;
  onClear: () => void;
}) {
  const [words, setWords] = useState<string[] | null>(null);
  const [query, setQuery] = useState('');
  const [shuffle, setShuffle] = useState(0);

  useEffect(() => {
    let alive = true;
    hideWords().then(
      (list) => alive && setWords(list),
      () => alive && setWords([])
    );
    return () => {
      alive = false;
    };
  }, []);

  /* Takliflar faqat ro'yxat kelganda va «Boshqalari» bosilganda
     qayta tanlanadi: har chizilishda yangilansa, ro'yxat ko'z
     oldida sakrab turardi. */
  const suggestions = useMemo(
    () => (words === null ? [] : suggestWords(words)),
    [words, shuffle]
  );

  const results = useMemo(
    () => (words === null ? [] : rankWords(query, words)),
    [words, query]
  );

  if (selected) {
    return (
      <div className="hide__picked">
        <span className="hide__picked-label">Tanlangan so‘z</span>
        <strong className="hide__word">{pretty(selected)}</strong>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onClear}>
          Boshqa so‘z
        </button>
      </div>
    );
  }

  const short = lengthOf(query) < MIN_QUERY;

  return (
    <div className="hide__pick">
      <label className="field">
        <span>So‘z qidirish</span>
        <input
          value={pretty(query)}
          onChange={(event) => setQuery(normalize(toLatin(event.target.value)))}
          placeholder="Kamida 2 harf yozing"
          autoComplete="off"
          spellCheck={false}
          data-script="word"
        />
      </label>

      {words === null && <p className="panel__note">Lug‘at yuklanmoqda…</p>}

      {words !== null && short && suggestions.length > 0 && (
        <>
          <div className="hide__row">
            <span className="hide__label">Tasodifiy so‘zlar</span>
            <button
              type="button"
              className="link"
              onClick={() => setShuffle((value) => value + 1)}
            >
              Boshqalari
            </button>
          </div>
          <div className="hide__words">
            {suggestions.map((word) => (
              <button
                key={word}
                type="button"
                className="hide__chip"
                onClick={() => onPick(word)}
              >
                {pretty(word)}
              </button>
            ))}
          </div>
        </>
      )}

      {words !== null && !short && (
        <div className="hide__words">
          {results.map((word) => (
            <button
              key={word}
              type="button"
              className="hide__chip"
              onClick={() => onPick(word)}
            >
              {pretty(word)}
            </button>
          ))}
          {results.length === 0 && (
            /* Topilmagan so'z lug'atda yo'q yoki bosh shakl emas.
               Ikkalasida ham yashirib bo'lmaydi, shuning uchun bu
               yerda taklif qilish yo'li ko'rsatiladi — ilovadagidek. */
            <p className="panel__note">
              «{pretty(query)}» topilmadi. Lug‘atdagi so‘zdan tanlang — yoki{' '}
              <a className="link" href="/lugat">
                lug‘atni ko‘rib chiqing
              </a>
              .
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Yashirilgan so'zlar ro'yxati ───────────────────────────────────── */

function MyList({
  items,
  onClose,
}: {
  items: MyChallenge[];
  onClose: (code: string) => void;
}) {
  const { copied, share } = useShare();

  if (items.length === 0) {
    return (
      <p className="panel__note">
        Hali so‘z yashirmagansiz. Yuqoridan bittasini tanlang —
        havolasini do‘stlaringizga tashlaysiz.
      </p>
    );
  }

  return (
    <ul className="hide__list">
      {items.map((item) => (
        <li key={item.code} className="hide__item">
          <div className="hide__item-main">
            <strong>{item.title || `${item.length} harfli so‘z`}</strong>
            <span className="hide__meta">
              {/* Sanoq ikki sondan: nechta odam o'ynadi va nechtasi
                  topdi. Uchinchisi («topolmadi») ortiqcha — u
                  ayirmaning o'zi. */}
              Kod: {item.code} · {item.plays} o‘ynadi · {item.solved} topdi
              {isOpen(item)
                ? item.expiresAt > 0 && ` · ${leftShort(item.expiresAt)}`
                : ' · yopilgan'}
            </span>
          </div>
          <div className="hide__item-acts">
            {isOpen(item) && (
              <>
                <button
                  type="button"
                  className="btn btn--sm"
                  onClick={() => share(item.code)}
                >
                  {copied === item.code ? 'Nusxalandi' : 'Ulashish'}
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => onClose(item.code)}
                >
                  Yopish
                </button>
              </>
            )}
            <a className="link" href={challengeLink(item.code)}>
              Ko‘rish
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ── Sahifa ─────────────────────────────────────────────────────────── */

export default function HideWordPage() {
  const auth = useAuth();
  const { copied, share } = useShare();

  const [selected, setSelected] = useState('');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [created, setCreated] = useState('');
  const [items, setItems] = useState<MyChallenge[] | null>(null);

  const account = auth.account;

  useEffect(() => {
    if (!account) return setItems(null);
    let alive = true;
    myChallenges().then(
      (list) => alive && setItems(list),
      () => alive && setItems([])
    );
    return () => {
      alive = false;
    };
  }, [account]);

  const openCount = (items ?? []).filter(isOpen).length;
  const full = openCount >= OPEN_MAX;

  async function hide() {
    if (!selected || busy) return;
    setBusy(true);
    setProblem(null);
    try {
      const { code } = await createChallenge({ word: selected, title });
      setCreated(code);
      setSelected('');
      setTitle('');
      setItems(await myChallenges().catch(() => items ?? []));
    } catch (error) {
      // Xato matni serverniki: lug'at keshi eskirgan bo'lsa sabab
      // aynan u aytadi («izohi yo'q», «lug'atda yo'q»).
      setProblem(
        error instanceof Error && error.message
          ? error.message
          : 'So‘zni yashirib bo‘lmadi. Birozdan keyin urinib ko‘ring.'
      );
    } finally {
      setBusy(false);
    }
  }

  async function drop(code: string) {
    setItems((list) =>
      (list ?? []).map((item) =>
        item.code === code ? { ...item, status: 'closed' } : item
      )
    );
    await closeChallenge(code).catch(() => undefined);
  }

  return (
    <section className="oyin">
      <div className="wrap oyin__solo">
        <div className="section__head section__head--center">
          <span className="section__kicker">So‘zTop</span>
          <h1>So‘z yashirish</h1>
          <p className="section__lead">
            Lug‘atdan bitta so‘z tanlang va havolasini do‘stlaringizga
            tashlang. Ular so‘zni oddiy o‘yindagidek topadi: uzunlik + 1
            urinish — siz esa kim necha urinishda topganini ko‘rib turasiz.
          </p>
        </div>

        {!account ? (
          /* Kirish shart: so'z hisobga bog'lanadi va statistikani
             ko'rsatadigan yagona narsa o'sha yozuv. O'ynash tomoni
             esa hisobsiz ham ochiq — shuni aytib qo'yiladi, aks
             holda to'siq butun bo'limga tegishlidek ko'rinadi. */
          <div className="panel panel--call">
            <h3>Yashirish uchun kirish kerak</h3>
            <p className="panel__note">
              So‘z hisobingizga bog‘lanadi — kim topganini shundan
              ko‘rasiz. Do‘stingiz yashirgan so‘zni topish uchun esa
              hisob kerak emas: havolani bosavering.
            </p>
            <button className="btn" onClick={() => auth.openPrompt('signIn')}>
              Kirish
            </button>
          </div>
        ) : (
          <>
            {created ? (
              <div className="panel panel--call" role="status">
                <h3>So‘z yashirildi</h3>
                <p className="panel__note">
                  Havolani yuboring — kim o‘ynaganini quyidagi ro‘yxatda
                  ko‘rasiz. So‘z bir kundan keyin yangi o‘yinchini qabul
                  qilmaydi.
                </p>
                <p className="hide__code">{created}</p>
                <div className="hide__item-acts">
                  <button className="btn" onClick={() => share(created)}>
                    {copied === created ? 'Nusxalandi' : 'Havolani ulashish'}
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => setCreated('')}
                  >
                    Yana yashirish
                  </button>
                </div>
              </div>
            ) : (
              <div className="panel">
                <WordPicker
                  selected={selected}
                  onPick={(word) => {
                    setSelected(word);
                    setProblem(null);
                  }}
                  onClear={() => setSelected('')}
                />

                {selected && (
                  <div className="form">
                    <label className="field">
                      <span>Sarlavha — ixtiyoriy</span>
                      <input
                        value={title}
                        onChange={(event) =>
                          setTitle(event.target.value.slice(0, 60))
                        }
                        placeholder="Masalan: Do‘stlarga sinov"
                        autoComplete="off"
                      />
                    </label>

                    {problem && <p className="form__err">{problem}</p>}
                    {full && (
                      <p className="form__err">
                        Ochiq so‘zlar {OPEN_MAX} tadan oshmaydi — bittasini
                        yoping yoki muddati tugashini kuting.
                      </p>
                    )}

                    <button className="btn" onClick={hide} disabled={busy || full}>
                      {busy ? 'Yashirilmoqda…' : 'Yashirish'}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="panel">
              <h3>Yashirgan so‘zlarim</h3>
              {items === null ? (
                <p className="panel__note">Yuklanmoqda…</p>
              ) : (
                <MyList items={items} onClose={drop} />
              )}
            </div>
          </>
        )}

        <p className="panel__note">
          Do‘stingiz yashirgan so‘z havolasi bormi — uni shunchaki
          brauzerda oching, kirish shart emas.
        </p>
      </div>
    </section>
  );
}
