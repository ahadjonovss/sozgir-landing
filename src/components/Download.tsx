import type { ReactNode } from 'react';
import { links } from '../data/site';

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
      <path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.9-3-.8c-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.9 2.2 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.2.9-1.2 1.3-2.5 1.3-2.5s-2.5-1-2.5-3.6zM14.2 5.8c.6-.8 1.1-1.9 1-3-1 0-2.1.6-2.8 1.5-.6.7-1.1 1.9-1 3 1.1.1 2.2-.6 2.8-1.5z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
      <path d="M3.6 2.3c-.3.3-.5.8-.5 1.4v16.6c0 .6.2 1.1.5 1.4l.1.1 9.3-9.3v-.2L3.6 2.3zM16.3 15.6l-3.1-3.1v-.2l3.1-3.1.1.1 3.7 2.1c1 .6 1 1.6 0 2.2l-3.8 2zM15.9 16l-3.2-3.2-9.1 9.1c.3.4.9.4 1.6.1l10.7-6M15.9 8l-10.7-6c-.7-.4-1.3-.3-1.6.1l9.1 9.1L15.9 8z" />
    </svg>
  );
}

function StoreButton({
  href,
  icon,
  small,
  big,
}: {
  href: string;
  icon: ReactNode;
  small: string;
  big: string;
}) {
  const soon = !href;
  return (
    <a
      className={`store${soon ? ' store--soon' : ''}`}
      href={href || undefined}
      target={soon ? undefined : '_blank'}
      rel="noreferrer"
      aria-disabled={soon}
    >
      {icon}
      <span>
        <small>{soon ? 'Tez orada' : small}</small>
        <b>{big}</b>
      </span>
    </a>
  );
}

export default function Download() {
  return (
    <section className="section download" id="yuklab-olish">
      <div className="wrap">
        <div className="download__card reveal">
          <div className="download__tiles" aria-hidden="true">
            {['s', 'oʻ', 'z', 'g', 'i', 'r'].map((u, i) => (
              <span key={i} className={`tile ${i % 3 === 1 ? 'tile--present' : 'tile--correct'}`}>
                <span>{u.toUpperCase()}</span>
              </span>
            ))}
          </div>

          <h2>Bugungi so‘zni telefoningizda toping</h2>
          <p>
            Bepul, reklamasiz, internetsiz ham ishlaydi. iOS 15+ va Android 6.0+
            qurilmalarda.
          </p>

          <div className="download__stores">
            <StoreButton
              href={links.appStore}
              icon={<AppleIcon />}
              small="App Store‘dan"
              big="Yuklab olish"
            />
            <StoreButton
              href={links.playStore}
              icon={<PlayIcon />}
              small="Google Play‘dan"
              big="O‘rnatish"
            />
          </div>

          <p className="download__note">
            Chiqish haqida birinchi bo‘lib bilmoqchimisiz?{' '}
            <a href={links.telegram} target="_blank" rel="noreferrer">
              Telegram kanalimizga obuna bo‘ling
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
