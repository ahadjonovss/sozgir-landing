/** Telegram guruhi banneri — o'yin sahifalarida.
 *
 *  O'ynayotgan odam eng faol auditoriya: raqib qidirayotgan yoki kunlik
 *  so'zni topgan payt guruhga taklif qilish o'rinli. Bitta komponent uch
 *  joyda (`/oynash`, `/oyin` yon ustuni, `/sozjang` lobbisi) — matn va
 *  havola bir joyda o'zgaradi. Havola yangi oynada: o'yin holati
 *  yo'qolmasin. */
import { links } from '../data/site';
import { Send } from './Icons';

export default function TelegramBanner({ compact = false }: { compact?: boolean }) {
  return (
    <a
      className={`tg${compact ? ' tg--compact' : ''}`}
      href={links.telegramGroup}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="tg__icon" aria-hidden="true">
        <Send size={compact ? 18 : 22} />
      </span>
      <span className="tg__text">
        <strong>So‘zgir hamjamiyati Telegramda</strong>
        <span>
          Jang uchun raqib toping, yangiliklar va takliflar — hammasi guruhda.
        </span>
      </span>
      <span className="tg__cta">Qo‘shilish</span>
    </a>
  );
}
