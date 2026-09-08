import type { ReactNode } from 'react';
import { links } from '../data/site';
import { AppleIcon, PlayIcon } from './StoreIcons';

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
            Bepul, internetsiz ham ishlaydi, xaridsiz. iOS 15+ va Android 6.0+
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
