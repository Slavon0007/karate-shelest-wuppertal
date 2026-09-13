const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) { entry.target.classList.add('visible'); reveal.unobserve(entry.target); }
}), { threshold: .14 });
document.querySelectorAll('.reveal').forEach(el => reveal.observe(el));

const counts = new IntersectionObserver(entries => entries.forEach(entry => {
  if (!entry.isIntersecting) return;
  const el = entry.target, target = Number(el.dataset.count), start = performance.now();
  const tick = now => { const p = Math.min((now - start) / 1100, 1); el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick); counts.unobserve(el);
}), { threshold: .6 });
document.querySelectorAll('[data-count]').forEach(el => counts.observe(el));

const glow = document.querySelector('.cursor-glow');
window.addEventListener('pointermove', e => { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; });

const menu = document.querySelector('.menu');
menu.addEventListener('click', () => document.querySelector('.nav nav').classList.toggle('open'));
