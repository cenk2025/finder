import { supabase } from '../utils/supabase.js';
import { toast } from '../utils/toast.js';

export function initAuthModal() {
  const modal = document.getElementById('authModal');
  if (!modal) return;

  const openers = ['openLogin', 'openSignup', 'openSignupHero', 'openSignupPricing'];
  openers.forEach((id) => {
    document.getElementById(id)?.addEventListener('click', () => {
      const target = id.includes('Signup') ? 'signup' : 'login';
      switchTab(target);
      modal.classList.add('show');
    });
  });

  document.getElementById('authClose')?.addEventListener('click', () => {
    modal.classList.remove('show');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('show');
  });

  modal.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('signupForm')?.addEventListener('submit', handleSignup);

  // Auto-redirect if already logged in
  supabase.auth.getSession().then(({ data }) => {
    if (data.session) {
      window.location.href = '/dashboard.html';
    }
  });
}

function switchTab(tab) {
  document.querySelectorAll('#authModal .tab').forEach((b) =>
    b.classList.toggle('active', b.dataset.tab === tab)
  );
  document.querySelectorAll('#authModal .tab-panel').forEach((p) =>
    p.classList.toggle('active', p.dataset.panel === tab)
  );
}

async function handleLogin(e) {
  e.preventDefault();
  const err = document.getElementById('loginError');
  err.textContent = '';
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Kirjaudutaan…';

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  btn.disabled = false;
  btn.textContent = 'Kirjaudu';

  if (error) {
    err.textContent = mapAuthError(error.message);
    return;
  }
  toast('Tervetuloa!', 'success');
  setTimeout(() => (window.location.href = '/dashboard.html'), 500);
}

async function handleSignup(e) {
  e.preventDefault();
  const err = document.getElementById('signupError');
  err.textContent = '';
  const company = document.getElementById('signupCompany').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Luodaan tiliä…';

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { company_name: company } },
  });

  if (error) {
    btn.disabled = false;
    btn.textContent = 'Luo tili';
    err.textContent = mapAuthError(error.message);
    return;
  }

  // Create profile row if session available (email confirmation may be disabled)
  if (data.user) {
    await supabase.from('profiles').insert({
      user_id: data.user.id,
      company_name: company,
    });
  }

  btn.disabled = false;
  btn.textContent = 'Luo tili';

  if (data.session) {
    toast('Tili luotu — tervetuloa!', 'success');
    setTimeout(() => (window.location.href = '/dashboard.html'), 500);
  } else {
    toast('Tarkista sähköpostisi vahvistaaksesi tilin.', 'info', 5000);
    err.textContent = 'Vahvistuslinkki lähetetty sähköpostiisi.';
    err.style.color = 'var(--green)';
  }
}

function mapAuthError(msg) {
  const m = (msg || '').toLowerCase();
  if (m.includes('invalid login')) return 'Virheellinen sähköposti tai salasana.';
  if (m.includes('already registered') || m.includes('already been')) return 'Tämä sähköposti on jo rekisteröity.';
  if (m.includes('password')) return 'Salasanan tulee olla vähintään 6 merkkiä.';
  if (m.includes('email')) return 'Tarkista sähköpostiosoite.';
  return msg || 'Jotain meni pieleen. Yritä uudelleen.';
}
