import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { goBack, useLinkHandler } from '../lib/router';
import { ChevronLeft } from './Icons';

/** Ichki havola — sahifa qayta yuklanmaydi. Manzillar ilovaning deep
 *  link'lari bilan bir xil, shuning uchun ularni nusxalab telefonga
 *  yuborish ham ishlaydi. */
export function Link({
  to,
  className,
  children,
  ...rest
}: {
  to: string;
  className?: string;
  children: ReactNode;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const onClick = useLinkHandler();
  return (
    <a href={to} className={className} onClick={onClick} {...rest}>
      {children}
    </a>
  );
}

/** Ekran sarlavhasi — ilovadagi `AppBar`: chapda orqaga, o'rtada nom. */
export function AppBar({
  title,
  subtitle,
  hint,
  back = '/',
  action,
}: {
  title: string;
  subtitle?: string;
  /** Izoh yordam sifatida berilgan bo'lsa ajratib ko'rsatiladi. */
  hint?: boolean;
  back?: string;
  action?: ReactNode;
}) {
  return (
    <header className="bar">
      <button
        className="icon-btn"
        onClick={() => goBack(back)}
        aria-label="Orqaga"
      >
        <ChevronLeft size={24} />
      </button>
      <div>
        <div className="bar__title">{title}</div>
        {subtitle && (
          <span className={`bar__subtitle${hint ? ' bar__subtitle--hint' : ''}`}>
            {subtitle}
          </span>
        )}
      </div>
      <div style={{ justifySelf: 'end' }}>{action}</div>
    </header>
  );
}

/** Ekran: sarlavha + mazmun. Sahifa nomi ham shu yerdan qo'yiladi. */
export default function Screen({
  title,
  subtitle,
  hint,
  back,
  action,
  documentTitle,
  children,
}: {
  title: string;
  subtitle?: string;
  hint?: boolean;
  back?: string;
  action?: ReactNode;
  documentTitle?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    document.title = `${documentTitle ?? title} — So‘zgir`;
  }, [documentTitle, title]);

  return (
    <>
      <AppBar title={title} subtitle={subtitle} hint={hint} back={back} action={action} />
      {children}
    </>
  );
}

/** Pastdan chiqadigan oyna — ilovadagi `showModalBottomSheet`. */
export function Sheet({
  onClose,
  children,
  label,
}: {
  onClose: () => void;
  children: ReactNode;
  label: string;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="sheet-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="sheet">
        <div className="sheet__grabber" />
        {children}
      </div>
    </div>
  );
}
