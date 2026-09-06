import { useState } from 'react';
import { isMobile, openInApp, SITE_URL } from '../lib/deeplink';
import { navigate } from '../lib/router';
import { links } from '../data/site';
import { Copy, Download, Send } from './Icons';

/** «Ilovada ochish» — bir xil manzil ikki joyda ishlashi uchun.
 *
 *  Telefonda universal link'ning o'zi ilovani ochadi; ilova yo'q yoki
 *  brauzer havolani ushlab qolgan bo'lsa shu tugma `sozgir://` sxemasi
 *  bilan urinib ko'radi va ochilmasa yuklab olish sahifasiga o'tadi.
 *  Kompyuterda esa havolani nusxalash foydali — telefonda ochiladi. */
export default function OpenInApp({ path, label = 'Ilovada ochish' }: { path: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${SITE_URL}${path}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Nusxalash taqiqlangan bo'lsa manzil ko'rinib turibdi.
    }
  };

  return (
    <div className="stack">
      {isMobile() ? (
        <button
          className="btn btn--block btn--accent"
          type="button"
          onClick={() => openInApp(path, () => navigate('/yuklab-olish'))}
        >
          <Send size={20} />
          {label}
        </button>
      ) : (
        <button className="btn btn--block btn--soft" type="button" onClick={copy}>
          <Copy size={20} />
          {copied ? 'Havola nusxalandi' : 'Havolani nusxalash'}
        </button>
      )}

      <a className="btn btn--block btn--soft" href="/yuklab-olish" onClick={(event) => {
        event.preventDefault();
        navigate('/yuklab-olish');
      }}>
        <Download size={20} />
        Ilovani yuklab olish
      </a>

      {!isMobile() && (
        <p className="prose" style={{ fontSize: 13 }}>
          Havola: <strong>{url}</strong> — telefonda ochilsa ilovaga tushadi.
          {links.telegram && ' Yangiliklar Telegram kanalimizda.'}
        </p>
      )}
    </div>
  );
}
