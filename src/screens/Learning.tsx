import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadCategories, loadDictionary, type Dictionary } from '../lib/dictionary';
import { loadFound } from '../lib/storage';
import { display, pretty } from '../lib/uz';
import { LengthPicker } from '../components/Cards';
import Screen from '../components/Screen';
import { Refresh } from '../components/Icons';
import OpenInApp from '../components/OpenInApp';

/** O'rganish moduli — ilovadagi `LearningPage`: tasodifiy so'z va uning
 *  ma'nosi, ustida bilim darajasi. Ta'riflar lug'atning o'zidan olinadi,
 *  ya'ni ilovadagi bilan bir xil. */
export default function Learning() {
  const [length, setLength] = useState(5);
  const [dictionary, setDictionary] = useState<Dictionary | null>(null);
  const [word, setWord] = useState('');
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCategories()
      .then((items) =>
        setNames(Object.fromEntries(items.map((item) => [item.id, item.name]))),
      )
      .catch(() => setNames({}));
  }, []);

  useEffect(() => {
    let alive = true;
    // Lug'at tashqi manba — uzunlik o'zgarganda qaytadan yuklanadi.
    // oxlint-disable-next-line react/set-state-in-effect
    setDictionary(null);
    loadDictionary(length).then((dict) => {
      if (!alive) return;
      setDictionary(dict);
      setWord(dict.answers[Math.floor(Math.random() * dict.answers.length)]);
    });
    return () => {
      alive = false;
    };
  }, [length]);

  const next = useCallback(() => {
    if (!dictionary) return;
    setWord(dictionary.answers[Math.floor(Math.random() * dictionary.answers.length)]);
  }, [dictionary]);

  const found = useMemo(() => loadFound(), []);
  const learned = dictionary
    ? dictionary.answers.filter((answer) => answer in found).length
    : 0;
  const total = dictionary?.answers.length ?? 0;
  const percent = total > 0 ? Math.round((learned / total) * 100) : 0;
  const info = dictionary?.words[word];

  return (
    <Screen title="O‘rganish" subtitle="So‘z boyligingizni oshiring" back="/">
      <div className="stack" style={{ paddingTop: 20 }}>
        <div className="result-stats" style={{ margin: 0, gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div>
            <b>{total}</b>
            <span>{length} harfli so‘z</span>
          </div>
          <div>
            <b>{learned}</b>
            <span>siz topgan</span>
          </div>
          <div>
            <b>{percent}%</b>
            <span>bilim darajasi</span>
          </div>
        </div>

        <LengthPicker value={length} onChange={setLength} />

        <div className="card card--tone" style={{ ['--tone' as string]: 'var(--violet)' }}>
          {dictionary === null ? (
            <p className="prose">Lug‘at yuklanmoqda…</p>
          ) : (
            <>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 1 }}>
                {display(word)}
              </div>
              <div className="section-label" style={{ margin: '12px 0 4px' }}>
                Ma’nosi
              </div>
              <p className="prose" style={{ color: 'var(--text)' }}>
                {info?.d ? pretty(info.d) : 'Bu so‘zning ta’rifi hali qo‘shilmagan'}
              </p>
              <p className="prose" style={{ marginTop: 8, fontSize: 13 }}>
                Mavzu: {names[info?.c ?? ''] ?? info?.c ?? '—'} ·{' '}
                {word in found ? 'Bu so‘zni topgansiz' : 'Hali topilmagan so‘z'}
              </p>
            </>
          )}
        </div>

        <button className="btn btn--block" onClick={next} type="button" disabled={!dictionary}>
          <Refresh size={20} />
          Yangi so‘z
        </button>

        <p className="prose" style={{ fontSize: 13 }}>
          Ilovada bu bo‘lim kengroq: uzunlik bo‘yicha qidiruv, topilgan
          so‘zlar tarixi va bilim darajasining o‘sishi ko‘rinadi.
        </p>
        <OpenInApp path="" label="Ilovada ochish" />
      </div>
    </Screen>
  );
}
