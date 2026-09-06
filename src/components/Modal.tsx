/** Ekran ustidan ochiladigan oyna.
 *
 *  Hisob oynasi ham, reyting oynasi ham shundan foydalanadi — ikkovi bir
 *  xil ko'rinadi va bir xil yopiladi (fon, ✕ yoki Escape).
 *
 *  Portal shart: `.header` da `backdrop-filter` bor, u esa ichidagi
 *  `position: fixed` uchun yangi kontekst yasaydi — oyna sarlavha
 *  balandligiga qamalib qolardi. */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({
  title,
  lead,
  onClose,
  children,
}: {
  title: string;
  lead?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // Oyna ochiq turganda sahifa orqada surilmasin.
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return createPortal(
    <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <button className="modal__veil" onClick={onClose} aria-label="Yopish" />
      <div className="modal__card">
        <div className="modal__head">
          <div>
            <h3>{title}</h3>
            {lead && <p className="modal__lead">{lead}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Yopish">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
