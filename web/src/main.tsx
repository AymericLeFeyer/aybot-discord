import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/presentation/App';
import './index.css';

// Suit le thème clair/sombre du système (shadcn utilise la classe `.dark`).
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
const applyTheme = () => document.documentElement.classList.toggle('dark', darkQuery.matches);
applyTheme();
darkQuery.addEventListener('change', applyTheme);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
