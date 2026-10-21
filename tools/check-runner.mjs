import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const base=process.env.SITE_URL||'http://127.0.0.1:8765/';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
fs.mkdirSync('.qa',{recursive:true});
const errors=[];
async function open(lang,width,options={}){
  const page=await browser.newPage({viewport:{width,height:844},...options});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+(lang==='de'?'':lang+'/'),{waitUntil:'networkidle'});
  await page.locator('#spiel').scrollIntoViewIfNeeded();
  return page;
}
async function start(page){await page.locator('[data-game-start]').click();await page.waitForFunction(()=>document.querySelector('.runner-game').dataset.state==='playing');}
async function topOfRunner(page){return page.evaluate(()=>{
  const c=document.querySelector('.runner-canvas'),ctx=c.getContext('2d'),scale=c.width/c.clientWidth;
  const x=Math.min(96,c.clientWidth*.18),data=ctx.getImageData(Math.round((x-12)*scale),0,Math.round(24*scale),c.height);
  for(let row=0;row<data.height-60;row++)for(let col=0;col<data.width;col++){const offset=(row*data.width+col)*4;if(data.data[offset]>230&&data.data[offset+1]>170&&data.data[offset+2]<30)return row;}
  return c.height;
});}
try{
  for(const lang of ['de','ru','uk'])for(const width of [320,1366]){
    const page=await open(lang,width);
    assert.equal(await page.locator('.runner-game').getAttribute('data-state'),'idle');
    assert.equal(await page.evaluate(()=>performance.getEntriesByType('resource').some(r=>r.name.includes('runner-game.js'))),false,'Game module must load on demand');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),0);
    await page.locator('#spiel').screenshot({path:`.qa/runner-${lang}-${width}-idle.png`});
    await start(page);
    const top=await topOfRunner(page),scroll=await page.evaluate(()=>scrollY);
    await page.keyboard.press('Space');await page.waitForTimeout(100);
    assert.ok(await topOfRunner(page)<top-20,'Space must visibly move the runner upwards');
    assert.ok(Math.abs(await page.evaluate(()=>scrollY)-scroll)<2,'Space in game must not scroll page');
    await page.keyboard.press('Escape');assert.equal(await page.locator('.runner-game').getAttribute('data-state'),'paused');
    await page.locator('[data-resume]').click();
    await page.waitForFunction(()=>document.querySelector('.runner-game').dataset.state==='over',{},{timeout:20000});
    assert.ok(await page.locator('[data-panel="over"] a').isVisible());
    const url=new URL(await page.locator('[data-panel="over"] a').getAttribute('href'));
    assert.equal(url.hostname,'wa.me');assert.ok(url.searchParams.get('text').length>30);
    await page.locator('#spiel').screenshot({path:`.qa/runner-${lang}-${width}-over.png`});
    await page.locator('[data-again]').click();assert.equal(await page.locator('.runner-game').getAttribute('data-state'),'playing');
    assert.equal(await page.locator('[data-score]').textContent(),'0');
    await page.locator('footer').scrollIntoViewIfNeeded();
    await page.waitForFunction(()=>document.querySelector('.runner-game').dataset.state==='paused');
    await page.close();
  }
  const touch=await open('ru',390,{hasTouch:true,isMobile:true,deviceScaleFactor:2});
  await start(touch);const before=await topOfRunner(touch);
  await touch.locator('canvas.runner-canvas').tap();await touch.waitForTimeout(100);
  assert.ok(await topOfRunner(touch)<before-30,'Touch must jump');await touch.close();

  const scorePage=await open('ru',390);await start(scorePage);
  await scorePage.waitForTimeout(1800);await scorePage.keyboard.press('Space');
  await scorePage.waitForFunction(()=>Number(document.querySelector('[data-score]').textContent)>=10,{},{timeout:5000});
  await scorePage.waitForFunction(()=>document.querySelector('.runner-game').dataset.state==='over',{},{timeout:10000});
  assert.ok(Number(await scorePage.locator('[data-best]').textContent())>=10);
  const record=await scorePage.locator('[data-best]').textContent();
  await scorePage.reload({waitUntil:'networkidle'});await scorePage.locator('#spiel').scrollIntoViewIfNeeded();await start(scorePage);
  assert.equal(await scorePage.locator('[data-best]').textContent(),record,'Record must survive reload');
  await scorePage.close();

  const plain=await open('de',390,{javaScriptEnabled:false});
  assert.ok(await plain.locator('.runner-panel noscript').isVisible());
  assert.equal(await plain.locator('[data-game-start]').isVisible(),false);await plain.close();
  assert.deepEqual(errors,[]);
  console.log('PASS: DE/RU/UK at 320/1366px; lazy load, keyboard jump, touch jump, collision/end screen, replay, pause, offscreen pause, record persistence, no-JS fallback and WhatsApp CTA.');
}finally{await browser.close();}
