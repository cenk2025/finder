const KEY = 'voon_finder_cookie_consent';

export function initCookieConsent() {
  const banner = document.getElementById('cookieBanner');
  if (!banner) return;

  const current = localStorage.getItem(KEY);
  if (!current) banner.classList.add('show');

  document.getElementById('cookieAccept')?.addEventListener('click', () => {
    localStorage.setItem(KEY, 'all');
    banner.classList.remove('show');
  });

  document.getElementById('cookieReject')?.addEventListener('click', () => {
    localStorage.setItem(KEY, 'essential');
    banner.classList.remove('show');
  });

  document.getElementById('reopenCookie')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem(KEY);
    banner.classList.add('show');
  });
}

export function hasConsent(type = 'essential') {
  const v = localStorage.getItem(KEY);
  if (type === 'essential') return v === 'essential' || v === 'all';
  return v === 'all';
}
