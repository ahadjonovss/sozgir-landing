/** Mavzu — kalit admin panel va ilova bilan bir xil (`sozgir.theme`). */

export type Theme = 'light' | 'dark';

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('sozgir.theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]:not([media])');
  meta?.setAttribute('content', theme === 'dark' ? '#121317' : '#ffffff');
}

export function toggleTheme(): Theme {
  const next: Theme =
    document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}
