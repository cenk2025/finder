import './styles/main.css';
import { initCookieConsent } from './js/cookie-consent.js';
import { initAuthModal } from './js/auth.js';

document.addEventListener('DOMContentLoaded', () => {
  initCookieConsent();
  initAuthModal();
});
