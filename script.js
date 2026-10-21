const one = selector => document.querySelector(selector);
const all = selector => [...document.querySelectorAll(selector)];
const menu = one('.menu');
const navigation = one('#main-nav');
const setMenu = open => {
  navigation.classList.toggle('open', open);
  menu.setAttribute('aria-expanded', String(open));
};
menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
navigation.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { setMenu(false); menu.focus(); }
});
document.addEventListener('click', event => { if (!event.target.closest('.nav')) setMenu(false); });
window.matchMedia('(min-width: 1101px)').addEventListener('change', () => setMenu(false));

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const counts = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target, target = Number(el.dataset.count), start = performance.now();
    const tick = now => { const p = Math.min((now - start) / 1100, 1); el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + (el.dataset.suffix || ''); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick); counts.unobserve(el);
  }), { threshold: .6 });
  all('[data-count]').forEach(el => counts.observe(el));
}
const glow = one('.cursor-glow');
if (glow && window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) {
  window.addEventListener('pointermove', e => { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; }, {passive:true});
}

const gameStart = one('[data-game-start]');
if (gameStart) {
  gameStart.hidden = false;
  gameStart.addEventListener('click', async () => {
    if (gameStart.disabled) return;
    gameStart.disabled = true;
    one('[data-game-error]').hidden = true;
    try {
      const { mountGame } = await import('./runner-game.js?v=runner1');
      mountGame(one('.runner-game'));
    } catch {
      one('.runner-status').textContent = one('.runner-game').dataset.error;
      one('[data-game-error]').textContent = one('.runner-game').dataset.error;
      one('[data-game-error]').hidden = false;
      gameStart.disabled = false;
    }
  });
}
