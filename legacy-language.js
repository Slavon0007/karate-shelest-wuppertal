// Preserve previously shared ?lang= links without relying on saved preferences.
(() => {
  const url = new URL(window.location.href);
  const lang = url.searchParams.get('lang');
  if (!['de', 'ru', 'uk'].includes(lang)) return;
  const root = url.pathname.replace(/(?:ru|uk)\/(?:index\.html)?$/, '').replace(/index\.html$/, '');
  url.pathname = root + (lang === 'de' ? '' : lang + '/');
  url.searchParams.delete('lang');
  if (url.pathname !== location.pathname) location.replace(url.href);
  else history.replaceState(null, '', url.href);
})();
