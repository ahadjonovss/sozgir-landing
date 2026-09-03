import { useState } from 'react';
import { email, links } from '../data/site';

const topics = ['Taklif', 'Xatolik haqida xabar', 'Hamkorlik', 'Ma’lumotlarim bo‘yicha so‘rov', 'Boshqa'];

type State = 'idle' | 'sending' | 'sent' | 'error';

const empty = { name: '', email: '', topic: topics[0], message: '' };

export default function Contact() {
  const [form, setForm] = useState(empty);
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState('');

  const set = (key: keyof typeof empty) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const valid =
    form.name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
    form.message.trim().length >= 10;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || state === 'sending') return;

    setState('sending');
    setError('');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `Server ${response.status}`);
      }
      setForm(empty);
      setState('sent');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Noma’lum xatolik');
      setState('error');
    }
  }

  return (
    <section className="section contact">
      <div className="wrap">
        <div className="section__head">
          <span className="section__kicker">Aloqa</span>
          <h1>Bizga yozing</h1>
          <p className="section__lead">
            Taklif, xatolik yoki hamkorlik — hammasini o‘qiymiz. Odatda bir-ikki kun ichida
            javob beramiz.
          </p>
        </div>

        <div className="contact__grid">
          <aside className="contact__side">
            <a className="contact__card" href={links.support}>
              <span className="contact__icon" aria-hidden="true">
                ✉️
              </span>
              <span>
                <small>Elektron pochta</small>
                <b>{email}</b>
              </span>
            </a>

            <a className="contact__card" href={links.telegram} target="_blank" rel="noreferrer">
              <span className="contact__icon" aria-hidden="true">
                ✈️
              </span>
              <span>
                <small>Telegram kanal</small>
                <b>@sozgir_uz</b>
              </span>
            </a>

            <div className="contact__card contact__card--plain">
              <span className="contact__icon" aria-hidden="true">
                ⏱
              </span>
              <span>
                <small>Javob vaqti</small>
                <b>1–2 ish kuni</b>
              </span>
            </div>

            <p className="contact__note">
              Ma’lumotlaringiz bilan nima qilishimiz{' '}
              <a href={links.privacy}>maxfiylik siyosatida</a> yozilgan.
            </p>
          </aside>

          <form className="contact__form" onSubmit={submit} noValidate>
            <label className="field">
              <span>Ismingiz</span>
              <input
                value={form.name}
                onChange={(e) => set('name')(e.target.value)}
                placeholder="Ali Valiyev"
                maxLength={80}
                autoComplete="name"
                required
              />
            </label>

            <label className="field">
              <span>Elektron pochta</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email')(e.target.value)}
                placeholder="siz@example.com"
                maxLength={120}
                autoComplete="email"
                required
              />
            </label>

            <label className="field">
              <span>Mavzu</span>
              <select value={form.topic} onChange={(e) => set('topic')(e.target.value)}>
                {topics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Xabar</span>
              <textarea
                value={form.message}
                onChange={(e) => set('message')(e.target.value)}
                placeholder="Kamida 10 belgi yozing…"
                rows={6}
                maxLength={2000}
                required
              />
            </label>

            <div className="contact__actions">
              <button className="btn btn--lg" type="submit" disabled={!valid || state === 'sending'}>
                {state === 'sending' ? 'Yuborilmoqda…' : 'Yuborish'}
              </button>
              <span className="contact__counter">{form.message.length}/2000</span>
            </div>

            <p className="contact__status" role="status" aria-live="polite">
              {state === 'sent' && (
                <span className="contact__ok">
                  ✅ Xabaringiz yuborildi. Rahmat — tez orada javob beramiz.
                </span>
              )}
              {state === 'error' && (
                <span className="contact__err">
                  ⚠️ Yuborilmadi: {error}. Iltimos, keyinroq urinib ko‘ring yoki{' '}
                  <a href={links.support}>{email}</a> ga yozing.
                </span>
              )}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
