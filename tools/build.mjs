import fs from 'node:fs';
import { parseHTML } from 'linkedom';
import { renderSchoolDetails } from './school-details.mjs';

const base = 'https://slavon0007.github.io/karate-shelest-wuppertal/';
const paths = {de:'', ru:'ru/', uk:'uk/'};
const translations = JSON.parse(fs.readFileSync('src/translations.json', 'utf8'));
const images = JSON.parse(fs.readFileSync('src/images.json', 'utf8'));
const template = fs.readFileSync('src/template.html', 'utf8');
const textFields = {
  '.hero-copy > p':'heroText', '.manifest > .section-index':'manifestIndex', '.manifest-title p':'manifestLead',
  '.experience-copy .section-index':'trainingIndex', '.experience-copy > p':'trainingText', '.photo.tall figcaption':'photoTall',
  '.numbers > p':'numberText', '.coach-copy .section-index':'coachIndex', '.coach-copy .lead':'coachLead',
  '.coach-copy .lead + p':'coachText', '.signature small':'coachSchool', '.gallery-head .section-index':'galleryIndex',
  '.gallery-head > div > p':'galleryLead', '.cta-copy > span':'ctaOverline',
};
const htmlFields = {
  '.hero h1':'heroTitle', '.hero-side p':'heroSide', '.manifest-title h2':'manifestTitle', '.experience-copy h2':'trainingTitle',
  '.coach-image > span':'coachWords', '.coach-copy h2':'coachTitle', '.gallery-head h2':'galleryTitle', '.cta-copy h2':'ctaTitle',
};

for (const [lang, t] of Object.entries(translations)) {
  const { document } = parseHTML(template);
  const $ = s => document.querySelector(s);
  const all = s => [...document.querySelectorAll(s)];
  const prefix = lang === 'de' ? '' : '../';
  document.documentElement.lang = lang;
  document.documentElement.removeAttribute('translate');
  document.documentElement.removeAttribute('class');
  $('meta[name="google"]')?.remove();
  document.title = t.title;
  $('meta[name="description"]').setAttribute('content', t.description);
  $('meta[property="og:title"]').setAttribute('content', t.title);
  $('meta[property="og:description"]').setAttribute('content', t.description);
  $('meta[property="og:locale"]').setAttribute('content', {de:'de_DE',ru:'ru_RU',uk:'uk_UA'}[lang]);
  $('meta[property="og:url"]').setAttribute('content', base + paths[lang]);
  $('link[rel="canonical"]').setAttribute('href', base + paths[lang]);
  for (const code of ['de','ru','uk','x-default']) {
    const link = document.createElement('link');
    link.setAttribute('rel','alternate'); link.setAttribute('hreflang',code);
    link.setAttribute('href',base + paths[code === 'x-default' ? 'de' : code]);
    document.head.appendChild(link);
  }
  for (const [selector, key] of Object.entries(textFields)) $(selector).textContent = t[key];
  for (const [selector, key] of Object.entries(htmlFields)) $(selector).innerHTML = t[key];
  $('.hero .eyebrow').innerHTML = `<span></span> ${t.eyebrow}`;
  $('.hero .button.yellow').innerHTML = `${t.primary} <b aria-hidden="true">↗</b>`;
  $('.hero .text-link').innerHTML = `${t.secondary} <span aria-hidden="true">↓</span>`;
  $('.nav-cta').innerHTML = `${t.navCta} <span aria-hidden="true">↗</span>`;
  $('.experience-copy .button').innerHTML = `${t.trainingButton} <b aria-hidden="true">↗</b>`;
  $('.cta-copy .button').innerHTML = `${t.ctaButton} <b aria-hidden="true">↗</b>`;
  $('.nav nav').setAttribute('aria-label',t.navLabel);
  $('.nav nav').id = 'main-nav';
  all('.nav nav a').forEach((el,i)=>{el.textContent=t.nav[i];});
  $('.menu').setAttribute('aria-label',t.menu);
  $('.menu').setAttribute('aria-controls','main-nav');
  $('.menu').setAttribute('aria-expanded','false');
  $('.lang-switch').setAttribute('aria-label',t.langLabel);
  $('.lang-switch').innerHTML = Object.entries(paths).map(([code,path]) => `<a href="${prefix}${path || './'}" lang="${code}" hreflang="${code}" aria-label="${{de:'DE — Deutsch',ru:'RU — Русский',uk:'UA — Українська'}[code]}"${code===lang?' class="active" aria-current="page"':''}>${{de:'DE',ru:'RU',uk:'UA'}[code]}</a>`).join('');
  all('.values article').forEach((el,i)=>{el.querySelector('h3').textContent=t.values[i][0];el.querySelector('p').textContent=t.values[i][1];});
  $('.photo.wide figcaption span').textContent=t.photoWide[0];
  $('.photo.wide figcaption b').textContent=t.photoWide[1];
  all('.numbers > div span').forEach((el,i)=>{el.textContent=t.numberLabels[i];});
  all('.gallery-caption').forEach((el,i)=>{el.querySelector('h3').textContent=t.gallery[i][0];el.querySelector('p').textContent=t.gallery[i][1];});
  $('.carousel-control-prev').setAttribute('aria-label',t.prev);
  $('.carousel-control-next').setAttribute('aria-label',t.next);
  all('.gallery-thumbs button').forEach((el,i)=>el.setAttribute('aria-label',`${t.image} ${i+1}`));
  $('.scroll').innerHTML = `${t.scroll} <span></span>`;
  const info = $('.training-info');
  info.removeAttribute('lang'); info.id = 'probetraining';
  info.innerHTML = `<h2 id="training-info-title">${t.infoTitle}</h2><p>${t.infoIntro}</p><ol class="trial-steps">${t.steps.map(([h,p])=>`<li><h3>${h}</h3><p>${p}</p></li>`).join('')}</ol><h3 class="faq-heading">${t.faqTitle}</h3>${t.faq.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('')}`;
  $('.experience-copy .button').setAttribute('href','#probetraining');
  const note = document.createElement('p'); note.className='trial-note'; note.textContent=t.trialNote;
  $('.cta-copy').insertBefore(note,$('.cta-copy .button'));
  const phone = document.createElement('a'); phone.className='contact-phone'; phone.href='tel:+4915730872694';phone.textContent=`${t.call}: +49 157 30872694`;
  $('.cta-copy').appendChild(phone);
  const skip = document.createElement('a');skip.className='skip-link';skip.href='#top';skip.textContent=t.skip;document.body.prepend(skip);
  $('#top').setAttribute('tabindex','-1');
  const schema = JSON.parse($('script[type="application/ld+json"]').textContent);
  schema['@id']=base+'#organization';schema.url=base;schema.description=t.schemaDescription;
  schema.logo=base+images['5262644864430580814.jpg'].variants[0].path;
  $('script[type="application/ld+json"]').textContent=JSON.stringify(schema);

  renderSchoolDetails(document,t,prefix,images,base);
  all('a[href="https://wa.me/4915730872694"]').forEach(el=>el.setAttribute('href',`https://wa.me/4915730872694?text=${encodeURIComponent(t.whatsapp)}`));

  all('img').forEach(img=>{
    const original=img.getAttribute('src'); const data=images[original]; if(!data)throw Error(`Unknown image ${original}`);
    const thumbnail=Boolean(img.closest('.gallery-thumbs'));
    const variants=thumbnail?data.variants.filter(v=>v.width<=320):data.variants;
    const fallback=variants.find(v=>v.width>=960)||variants.at(-1);
    img.setAttribute('src',prefix+fallback.path);
    img.setAttribute('srcset',variants.map(v=>`${prefix}${v.path} ${v.width}w`).join(', '));
    img.setAttribute('width',data.width);img.setAttribute('height',data.height);
    img.setAttribute('sizes',img.closest('.brand')?'46px':thumbnail?'(max-width: 800px) 22vw, 20vw':img.closest('.hero-media,.cta-bg')?'100vw':img.closest('.carousel-item')?'86vw':'(max-width: 800px) calc(100vw - 40px), 45vw');
    if(img.getAttribute('alt')) img.setAttribute('alt',t.alts[original]);
  });
  all('link[rel="preconnect"]').forEach(el=>el.remove());
  all('link[rel="stylesheet"]').forEach(el=>{
    const href=el.getAttribute('href');
    el.setAttribute('href',prefix+(href.includes('fonts.googleapis')?'assets/fonts/fonts.css':href.includes('bootstrap')?'assets/vendor/bootstrap.min.css':'styles.css?v=school-20261020'));
    el.removeAttribute('integrity');el.removeAttribute('crossorigin');
  });
  const icon=document.createElement('link');icon.setAttribute('rel','icon');icon.setAttribute('type','image/webp');icon.setAttribute('href',prefix+images['5262644864430580814.jpg'].variants[0].path);document.head.appendChild(icon);
  const runtime = $('script[src^="script.js"]');runtime.setAttribute('src',prefix+'script.js?v=school-20261020');runtime.setAttribute('defer','');
  const bootstrap=$('script[src*="bootstrap.bundle"]');bootstrap.setAttribute('defer','');bootstrap.setAttribute('src',prefix+'assets/vendor/bootstrap.bundle.min.js');bootstrap.removeAttribute('integrity');bootstrap.removeAttribute('crossorigin');
  // Old shared links remain useful, while new links point to static pages.
  const legacy = document.createElement('script');legacy.setAttribute('src',prefix+'legacy-language.js?v=seo3');legacy.setAttribute('defer','');document.head.appendChild(legacy);
  const output=paths[lang]+'index.html';fs.mkdirSync(paths[lang]||'.',{recursive:true});fs.writeFileSync(output,document.toString().replace(/\r\n/g,'\n').replace(/[ \t]+\n/g,'\n').trimEnd()+'\n');
  console.log(`Built ${output}`);
}
fs.writeFileSync('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${Object.values(paths).map(p=>`  <url><loc>${base+p}</loc></url>`).join('\n')}\n</urlset>\n`);
