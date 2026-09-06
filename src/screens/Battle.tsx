import { useState } from 'react';
import { isBattleCode } from '../lib/deeplink';
import { navigate } from '../lib/router';
import OpenInApp from '../components/OpenInApp';
import Screen from '../components/Screen';

const POINTS = [
  'Do‘stingizga kod yuborasiz — u 24 soat ichida o‘ynaydi',
  'Tezkor jang: reytingi yaqin tasodifiy raqib',
  'Raqibning kataklari harfsiz — faqat ranglar ko‘rinadi',
  'Har jangdan keyin reyting raqib kuchiga qarab o‘zgaradi',
];

/** So'zjang. O'yinning o'zi ilovada — jang haqiqiy vaqtda ketadi va
 *  hisob talab qiladi. Sayt esa chaqiruv havolasining «yerga tushish
 *  joyi»: kod ko'rinadi va ilova ochiladi. */
export default function Battle({ code }: { code?: string }) {
  const [input, setInput] = useState('');
  const valid = isBattleCode(input);

  if (code) {
    return (
      <Screen
        title="So‘zjang"
        subtitle="Sizni jangga chaqirdilar"
        back="/"
        documentTitle={`Jang · ${code}`}
      >
        <div className="stack" style={{ paddingTop: 20 }}>
          <div className="code-box">{code}</div>
          <p className="prose">
            Bu chaqiruv <strong>So‘zgir</strong> ilovasida ochiladi. Ilova
            o‘rnatilgan bo‘lsa havola o‘zi unga tushadi; bo‘lmasa ilovani
            o‘rnatib, «So‘zjang → Kodga qo‘shilish» oynasiga shu kodni
            kiriting.
          </p>
          <OpenInApp path={`/jang/${code}`} label="Jangga qo‘shilish" />
          <div className="card card--tone" style={{ ['--tone' as string]: 'var(--accent)' }}>
            <div className="card__title">Jang qanday ketadi</div>
            <ul className="bullets" style={{ ['--tone' as string]: 'var(--accent)' }}>
              {POINTS.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </div>
      </Screen>
    );
  }

  return (
    <Screen title="So‘zjang" subtitle="Do‘st bilan bellashing" back="/">
      <div className="stack" style={{ paddingTop: 20 }}>
        <div className="card card--tone" style={{ ['--tone' as string]: 'var(--accent)' }}>
          <div className="card__title">Bir so‘z, ikki o‘yinchi</div>
          <p className="prose">
            Kim kamroq urinishda topsa — o‘sha yutadi. Jang ikkalangiz uchun
            birga boshlanadi va natija reytingga yoziladi.
          </p>
          <ul className="bullets" style={{ ['--tone' as string]: 'var(--accent)' }}>
            {POINTS.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>

        <div className="card">
          <div className="card__title">Kodga qo‘shilish</div>
          <p className="prose" style={{ marginBottom: 10 }}>
            Do‘stingiz yuborgan olti belgili kodni kiriting.
          </p>
          <div className="btn-row">
            <input
              className="tile-card"
              style={{ letterSpacing: 4, textTransform: 'uppercase', fontWeight: 800 }}
              value={input}
              onChange={(event) => setInput(event.target.value.trim().slice(0, 6))}
              placeholder="AB12CD"
              maxLength={6}
              aria-label="Jang kodi"
            />
            <button
              className="btn"
              disabled={!valid}
              style={{ opacity: valid ? 1 : 0.5, flex: 'none', paddingInline: 24 }}
              onClick={() => navigate(`/jang/${input.toUpperCase()}`)}
              type="button"
            >
              Davom etish
            </button>
          </div>
        </div>

        <OpenInApp path="/jang" label="Ilovada ochish" />
      </div>
    </Screen>
  );
}
