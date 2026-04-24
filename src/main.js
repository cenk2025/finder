import './styles/main.css';
import { initCookieConsent } from './js/cookie-consent.js';
import { initAuthModal } from './js/auth.js';
import { initPrismaHero } from './js/prisma-hero.js';

document.addEventListener('DOMContentLoaded', () => {
  initPrismaHero();
  initCookieConsent();
  initAuthModal();
});
