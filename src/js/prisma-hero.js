/**
 * Splits headline text into per-letter spans with staggered pull-up animation.
 * CSS handles the animation (see .prisma-word span in main.css);
 * JS only needs to inject spans and set the --i index variable per letter.
 */
export function initPrismaHero() {
  const heading = document.querySelector('[data-word]');
  if (!heading) return;

  const text = heading.dataset.word || heading.textContent || '';
  const showAsterisk = heading.dataset.asterisk === 'true';

  const letters = Array.from(text);
  heading.textContent = '';

  letters.forEach((ch, i) => {
    const span = document.createElement('span');
    span.textContent = ch;
    span.style.setProperty('--i', String(i));
    heading.appendChild(span);
  });

  if (showAsterisk) {
    const asterisk = document.createElement('span');
    asterisk.className = 'asterisk';
    asterisk.textContent = '*';
    heading.style.setProperty('--total', String(letters.length));
    heading.appendChild(asterisk);
  }
}
