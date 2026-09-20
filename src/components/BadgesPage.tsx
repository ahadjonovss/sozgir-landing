/** Nishonlar — `/nishonlar`, ilovadagi `BadgesPage` ning veb ko'rinishi.
 *
 *  Nishon aqcha bermaydi va hech narsani ochmaydi: uning butun qiymati
 *  **ko'rinishida**. Shuning uchun sahifa ham bitta ish qiladi — nishonni
 *  ko'rsatadi: rasm, nomi va bir jumlalik shart. Bosilganda nom nimani
 *  anglatishi aytiladi, chunki nishonlar turkiy nom bilan atalgan va
 *  «Yasovul» yoki «Kuntug'mish» aytilmasa shunchaki chiroyli rasm
 *  bo'lib qoladi.
 *
 *  Olinmagan nishon ham ko'rinadi: yashirilsa sahifa nimaga intilish
 *  kerakligini aytmasdi. U xira turadi va ostida yo'lakcha bo'ladi —
 *  faqat sanaladigan nishonlarda ("7 kun", "100 so'z"), chunki bir
 *  martalik shartda yo'lakcha ma'nosiz: u yo bo'sh, yo to'la bo'ladi. */
import { useState } from 'react';
import { badgeArt, type BadgeStatus } from '../lib/badges';
import { BADGES } from '../lib/badges';
import { useBadges } from '../lib/useBadges';
import { pretty } from '../lib/uz';
import AdBanner from './AdBanner';
import Modal from './Modal';

export default function BadgesPage() {
  const { badges, earned } = useBadges();
  const [open, setOpen] = useState<BadgeStatus | null>(null);

  return (
    <section className="oyin nishon">
      <div className="wrap nishon__wrap">
        <header className="nishon__head">
          <h1>Nishonlar</h1>
          <p className="section__lead">
            Nishon — bir martalik yutuq belgisi. U aqcha bermaydi va hech
            narsani ochmaydi, lekin bir marta olingach hech qachon qaytarib
            olinmaydi: ketma-ketlik uzilsa ham, o‘lja tushsa ham o‘z egasida
            qoladi.
          </p>
          <p className="nishon__count">
            <strong>{earned}</strong> / {BADGES.length}
          </p>
        </header>

        <ul className="nishon__grid">
          {badges.map((status) => (
            <li key={status.badge.id}>
              <button
                type="button"
                className={`nishon__tile${status.earned ? '' : ' nishon__tile--off'}`}
                onClick={() => setOpen(status)}
              >
                <img
                  className="nishon__art"
                  src={badgeArt(status.badge)}
                  alt=""
                  width={80}
                  height={80}
                  loading="lazy"
                  decoding="async"
                />
                <strong className="nishon__name">{pretty(status.badge.label)}</strong>
                <span className="nishon__hint">{pretty(status.badge.hint)}</span>
                {/* Yo'lakcha faqat sanaladigan nishonda va faqat u hali
                    olinmagan bo'lsa: olingan nishonda sanoq ortiqcha. */}
                {status.badge.target > 1 && !status.earned && (
                  <span className="nishon__bar" aria-hidden="true">
                    <i style={{ width: `${Math.round(status.progress * 100)}%` }} />
                  </span>
                )}
                {status.badge.target > 1 && !status.earned && (
                  <span className="nishon__score">
                    {status.value} / {status.badge.target}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>

        <p className="panel__note nishon__note">
          Nishonlar shu brauzerda saqlanadi va ilovadagi ro‘yxatdan alohida —
          telefonda olingan nishon bu yerda ko‘rinmaydi. Sanoqlar esa
          hisobingizdan o‘qiladi: kirsangiz jangdagi g‘alabalar ham hisobga
          kiradi.
        </p>

        <AdBanner placement="profile" />
      </div>

      {open && (
        <Modal
          title={pretty(open.badge.label)}
          lead={pretty(open.badge.hint)}
          onClose={() => setOpen(null)}
        >
          <div className="nishon__sheet">
            <img
              className={open.earned ? '' : 'nishon__art--off'}
              src={badgeArt(open.badge)}
              alt=""
              width={96}
              height={96}
              decoding="async"
            />
            <p>{pretty(open.badge.story)}</p>
            <p className="panel__note">
              {open.earned
                ? 'Nishon sizda — u endi hech qachon yo‘qolmaydi.'
                : open.badge.target > 1
                  ? `Hozircha ${open.value} / ${open.badge.target}.`
                  : 'Hozircha olinmagan.'}
            </p>
          </div>
        </Modal>
      )}
    </section>
  );
}
