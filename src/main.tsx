import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { applyTheme } from './lib/theme';
import './styles/theme.css';
import './styles/app.css';

// Mavzu birinchi chizishdan oldin qo'yiladi — ekran "sakramaydi".
// Kalit ilova va admin panel bilan bir xil: sozgir.theme.
const saved = localStorage.getItem('sozgir.theme');
const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
applyTheme(saved === 'light' || saved === 'dark' ? saved : prefersDark ? 'dark' : 'light');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
