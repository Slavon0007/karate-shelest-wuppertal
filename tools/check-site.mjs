import fs from 'node:fs';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { parseHTML } from 'linkedom';

const base = process.env.SITE_URL || 'http://127.0.0.1:8765/';
const paths={de:'',ru:'ru/',uk:'uk/'};
fs.mkdirSync('.qa',{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const report=[];
const errors=[];
try {
  for (const [lang,path] of Object.entries(paths)) {
    const response=await fetch(base+path);assert.equal(response.status,200);
    const {document}=parseHTML(await response.text());
    assert.equal(document.documentElement.lang,lang);
    assert.equal(document.querySelectorAll('h1').length,1);
    assert.equal(document.querySelectorAll('link[hreflang]').length,4);
    assert.ok(document.querySelector('link[rel="canonical"]').getAttribute('href').endsWith('/karate-shelest-wuppertal/'+path));
    assert.equal(document.querySelectorAll('.training-info details').length,6);
    assert.ok(document.querySelector('meta[name="description"]').getAttribute('content').length>80);
    const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);assert.equal(new Set(ids).size,ids.length);
    for (const a of document.querySelectorAll('a[href^="#"]')) assert.ok(ids.includes(a.getAttribute('href').slice(1)));
    JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
    for (const width of [320,390,768,1024,1366]) {
      const page=await browser.newPage({viewport:{width,height:844},deviceScaleFactor:1});
      page.on('pageerror',e=>errors.push(`${lang}/${width}: ${e.message}`));
      page.on('response',r=>{if(r.status()>=400)errors.push(`${lang}/${width}: ${r.status()} ${r.url()}`);});
      await page.goto(base+path,{waitUntil:'networkidle'});
      await page.evaluate(()=>document.fonts.ready);
      const metrics=await page.evaluate(()=>{
        const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height};};
        const overflowing=[...document.querySelectorAll('h1,h2,h3,.brand,.lang-switch,.hero-actions,.cta-copy')].filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+1||r.left< -1||e.scrollWidth>e.clientWidth+2;}).map(e=>e.className||e.tagName);
        return {overflow:document.documentElement.scrollWidth-innerWidth,overflowing,hero:box('.hero'),header:box('.nav'),heading:box('h1'),copy:box('.hero-copy'),heroSource:document.querySelector('.hero-media img').currentSrc,heroBytes:performance.getEntriesByType('resource').find(r=>r.name.includes('karate-wuppertal-'))?.encodedBodySize};
      });
      assert.equal(metrics.overflow,0,`${lang}/${width}: horizontal overflow`);
      assert.deepEqual(metrics.overflowing,[],`${lang}/${width}: clipped text`);
      assert.ok(metrics.heading.top>=metrics.header.bottom,`${lang}/${width}: header overlap`);
      assert.ok(metrics.copy.bottom<=metrics.hero.bottom,`${lang}/${width}: hero overflow`);
      if(width<=1024){
        await page.locator('.menu').click();assert.equal(await page.locator('.menu').getAttribute('aria-expanded'),'true');
        assert.ok(await page.locator('#main-nav').isVisible());
        await page.locator('#main-nav a').first().click();assert.equal(await page.locator('.menu').getAttribute('aria-expanded'),'false');
        await page.evaluate(()=>window.scrollTo(0,0));
      }
      await page.locator('.training-info details').first().locator('summary').click();
      assert.equal(await page.locator('.training-info details').first().getAttribute('open'),'');
      await page.locator('.carousel-control-next').click();
      await page.waitForFunction(()=>document.querySelector('.carousel-item.active .gallery-caption span')?.textContent.startsWith('02'));
      assert.ok((await page.locator('.hero .button.yellow').getAttribute('href')).includes('wa.me/4915730872694?text='));
      if(width===390 || width===1366){
        await page.evaluate(()=>window.scrollTo(0,0));
        await page.screenshot({path:`.qa/${lang}-${width}.png`,fullPage:true});
      }
      // Ensure lazy images are actually requested, not just represented in markup.
      await page.locator('footer').scrollIntoViewIfNeeded();
      report.push({lang,width,...metrics});await page.close();
    }
    const page=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
    await page.goto(base+path,{waitUntil:'networkidle'});
    assert.equal(await page.locator('html').getAttribute('lang'),lang);
    assert.ok(await page.locator('h1').isVisible());
    assert.equal(await page.locator('.lang-switch a').count(),3);
    await page.close();
  }
  const page=await browser.newPage();
  for (const lang of ['ru','uk','de']) {
    await page.goto(base+'?lang='+lang,{waitUntil:'networkidle'});
    assert.equal(new URL(page.url()).pathname,new URL(base+paths[lang]).pathname);
    assert.equal(await page.locator('html').getAttribute('lang'),lang);
    assert.equal(new URL(page.url()).searchParams.has('lang'),false);
  }
  await page.goto(base,{waitUntil:'networkidle'});
  await page.locator('.lang-switch a[hreflang="ru"]').click();await page.waitForURL('**/ru/');
  assert.equal(await page.locator('html').getAttribute('lang'),'ru');
  await page.locator('.lang-switch a[hreflang="uk"]').click();await page.waitForURL('**/uk/');
  assert.equal(await page.locator('html').getAttribute('lang'),'uk');
  await page.close();
  assert.deepEqual(errors,[],'Browser errors');
  fs.writeFileSync('.qa/site-check.json',JSON.stringify({base,passed:true,report},null,2));
  console.log(`PASS: ${report.length} language/viewport combinations, no-JS content, metadata, menus, gallery, FAQ, old links and language navigation.`);
  console.log(JSON.stringify(report.filter(x=>x.lang==='de').map(({width,heroBytes,heroSource})=>({width,heroBytes,heroSource})),null,2));
} finally { await browser.close(); }
