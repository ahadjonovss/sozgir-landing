import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/theme.css';
import './styles/landing.css';

// Mavzu birinchi chizishdan oldin qo'yiladi — ekran "sakramaydi".
// Kalit admin panel bilan bir xil: sozgir.theme.
const saved = localStorage.getItem('sozgir.theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.dataset.theme =
  saved ?? (prefersDark ? 'dark' : 'light');

// `.reveal` bloklari faqat shu klass bo'lganda yashiriladi. JS yiqilsa yoki
// IntersectionObserver bo'lmasa, klass qo'yilmaydi va sahifa to'liq ko'rinadi.
if ('IntersectionObserver' in window) {
  document.documentElement.classList.add('js');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
