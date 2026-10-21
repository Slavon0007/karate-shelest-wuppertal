// Loaded only after Start; the small source-frame atlas is loaded at that point.
import { runnerRun } from './assets/game/runner-run.js?v=gif1';

async function prepareRunFrames() {
  const source=new Image();
  source.src=new URL('./assets/game/'+runnerRun.atlas,import.meta.url).href;
  await source.decode();
  const {crop,frameCount,frameWidth}=runnerRun;
  const sheet=document.createElement('canvas');sheet.width=crop.width*frameCount;sheet.height=crop.height;
  const context=sheet.getContext('2d');
  if(!context)throw new Error('Canvas unavailable');
  for(let frame=0;frame<frameCount;frame++){
    context.drawImage(source,frame*frameWidth+crop.x,crop.y,crop.width,crop.height,frame*crop.width,0,crop.width,crop.height);
  }
  // White becomes transparent; the original silhouette and antialiased edges
  // are retained as alpha, with the site's yellow applied by the renderer.
  const pixels=context.getImageData(0,0,sheet.width,sheet.height);
  for(let offset=0;offset<pixels.data.length;offset+=4){
    const alpha=255-Math.round((pixels.data[offset]+pixels.data[offset+1]+pixels.data[offset+2])/3);
    pixels.data[offset]=255;pixels.data[offset+1]=212;pixels.data[offset+2]=0;pixels.data[offset+3]=alpha;
  }
  context.putImageData(pixels,0,0);
  return sheet;
}

export async function mountGame(root) {
  if (root.dataset.mounted) return;
  const canvas=root.querySelector('canvas');
  const ctx=canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  const runSheet=await prepareRunFrames();
  root.dataset.mounted='true';
  const scoreEl=root.querySelector('[data-score]');
  const bestEl=root.querySelector('[data-best]');
  const status=root.querySelector('.runner-status');
  const pauseButton=root.querySelector('[data-pause]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width=960,height=320,dpr=1,frame=0,last=0,state='idle';
  let y=0,velocity=0,elapsed=0,jumpAt=0,score=0,best=0,spawn=0.8,obstacles=[];
  const gold='#ffd400';
  try { best=Math.max(0,Number(localStorage.getItem('shelest-runner-best'))||0); } catch {}
  bestEl.textContent=String(best);

  function setState(next) {
    state=next;root.dataset.state=next;
    root.querySelectorAll('[data-panel]').forEach(panel=>{panel.hidden=panel.dataset.panel!==next;});
    pauseButton.hidden=next!=='playing';
    if (next!=='playing') { cancelAnimationFrame(frame);frame=0; }
  }
  function resize() {
    const previous=width;
    width=Math.max(240,canvas.clientWidth);height=Math.max(240,canvas.clientHeight);
    dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    obstacles.forEach(obstacle=>{obstacle.x*=width/previous;});
    draw();
  }
  function playerX() { return Math.min(96,width*0.18); }
  function limb(points) {
    ctx.beginPath();points.forEach(([x,z],i)=>i?ctx.lineTo(x,z):ctx.moveTo(x,z));ctx.stroke();
  }
  function drawRunner() {
    const x=playerX(), floor=height-44, airborne=y< -2;
    const top=floor-76+y;
    ctx.fillStyle='#ffd40022';ctx.beginPath();ctx.ellipse(x+3,floor+4,26,3,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=gold;ctx.fillStyle=gold;ctx.lineCap='round';ctx.lineJoin='round';
    if(airborne) {
      // Chamber the knee, extend a flying side kick, then fold for landing.
      const extension=Math.min(1,Math.max(0,(elapsed-jumpAt)/.12),Math.max(0,-y/28));
      ctx.lineWidth=8;
      limb([[x,top+50],[x-23,top+69],[x+3,top+65]]);
      limb([[x,top+50],[x+18+10*extension,top+50-7*extension],[x+7+49*extension,top+65-28*extension]]);
      ctx.lineWidth=7;
      limb([[x-9,top+30],[x-31,top+26],[x-14,top+42]]);
      limb([[x-9,top+30],[x+12,top+32],[x+33,top+30]]);
      ctx.lineWidth=8.5;limb([[x-9,top+30],[x-5,top+41],[x,top+51]]);
      ctx.beginPath();ctx.arc(x-2,top+10,7.5,0,Math.PI*2);ctx.fill();
    } else {
      // Play the actual source GIF poses at their original frame durations.
      let time=(elapsed*1000)%runnerRun.cycleMs,frame=0;
      while(frame<runnerRun.frameCount-1&&time>=runnerRun.durations[frame]){time-=runnerRun.durations[frame];frame++;}
      const {crop}=runnerRun,scale=80/crop.height;
      const left=x+(crop.x-runnerRun.anchorX)*scale;
      ctx.drawImage(runSheet,frame*crop.width,0,crop.width,crop.height,left,floor-80,crop.width*scale,80);
    }
  }
  function draw() {
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.fillStyle='#090909';ctx.fillRect(0,0,width,height);
    const floor=height-44;
    ctx.strokeStyle='#242111';ctx.lineWidth=1;
    for(let i=0;i<width;i+=80){ctx.beginPath();ctx.moveTo(i,32);ctx.lineTo(i,floor-24);ctx.stroke();}
    ctx.strokeStyle='#ffd40066';ctx.beginPath();ctx.moveTo(0,floor+7);ctx.lineTo(width,floor+7);ctx.stroke();
    ctx.fillStyle='#74651c';
    const offset=reduced?0:(elapsed*90)%60;
    for(let i=-60;i<width;i+=60)ctx.fillRect(i-offset,floor+20,10,2);
    for(const obstacle of obstacles){
      const top=floor-obstacle.h;
      ctx.fillStyle='#201d0b';ctx.fillRect(obstacle.x,top,obstacle.w,obstacle.h);
      ctx.strokeStyle=gold;ctx.lineWidth=2;ctx.strokeRect(obstacle.x+.5,top+.5,obstacle.w-1,obstacle.h-1);
      ctx.beginPath();ctx.moveTo(obstacle.x+4,top+7);ctx.lineTo(obstacle.x+obstacle.w-4,top+7);ctx.stroke();
    }
    drawRunner();
  }
  function endRound() {
    setState('over');
    if(score>best){best=score;bestEl.textContent=String(best);try{localStorage.setItem('shelest-runner-best',String(best));}catch{}}
    root.querySelector('[data-result]').textContent=String(score);
    status.textContent=root.querySelector('[data-panel="over"] h3').textContent+' '+root.querySelector('.runner-result').textContent;
    root.querySelector('[data-again]').focus({preventScroll:true});
  }
  function update(dt) {
    elapsed+=dt;
    velocity+=1750*dt;y=Math.min(0,y+velocity*dt);if(y===0)velocity=0;
    const speed=Math.min(width<600?365:520,(width<600?245:330)+elapsed*2.5);
    spawn-=dt;
    if(spawn<=0){obstacles.push({x:width+36,w:20+Math.random()*12,h:29+Math.random()*15,passed:false});spawn=1.2+Math.random()*.5;}
    const x=playerX(), floor=height-44;
    for(const obstacle of obstacles){
      obstacle.x-=speed*dt;
      if(!obstacle.passed&&obstacle.x+obstacle.w<x-13){obstacle.passed=true;score+=10;scoreEl.textContent=String(score);}
      if(x+12>obstacle.x+2&&x-12<obstacle.x+obstacle.w-2&&floor+y-4>floor-obstacle.h+3&&floor-72+y<floor){endRound();break;}
    }
    obstacles=obstacles.filter(obstacle=>obstacle.x+obstacle.w> -10);
  }
  function tick(now) {
    if(state!=='playing')return;
    const delta=(now-last)/1000;last=now;
    // Suspended tabs must not advance the simulation or collide on return.
    if(delta>.2){pause();return;}
    let remaining=Math.min(delta,.05);
    while(remaining>0&&state==='playing'){const dt=Math.min(remaining,1/120);update(dt);remaining-=dt;}
    draw();if(state==='playing')frame=requestAnimationFrame(tick);
  }
  function play(reset) {
    if(reset){y=0;velocity=0;elapsed=0;score=0;spawn=.8;obstacles=[];scoreEl.textContent='0';}
    setState('playing');status.textContent=root.dataset.running;
    canvas.focus({preventScroll:true});last=performance.now();frame=requestAnimationFrame(tick);
  }
  function jump(){if(state==='playing'&&y===0){velocity=-625;jumpAt=elapsed;}}
  function pause(){if(state!=='playing')return;setState('paused');status.textContent=root.querySelector('[data-panel="paused"] h3').textContent;draw();}
  canvas.addEventListener('keydown',event=>{
    if(event.code==='Space'||event.code==='ArrowUp'){
      const rect=canvas.getBoundingClientRect();
      if(rect.bottom<height*.2||rect.top>innerHeight-height*.2){pause();return;}
      event.preventDefault();if(event.repeat)return;
      if(state==='paused')play(false);else jump();
    } else if(event.code==='Escape'){event.preventDefault();pause();root.querySelector('[data-resume]').focus({preventScroll:true});}
  });
  canvas.addEventListener('pointerdown',event=>{if(event.button!==0)return;canvas.focus({preventScroll:true});jump();});
  pauseButton.addEventListener('click',()=>{pause();root.querySelector('[data-resume]').focus({preventScroll:true});});
  root.querySelector('[data-resume]').addEventListener('click',()=>play(false));
  root.querySelector('[data-again]').addEventListener('click',()=>play(true));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  window.addEventListener('blur',pause);
  new ResizeObserver(resize).observe(canvas);
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{if(entries[0].intersectionRatio<.2)pause();},{threshold:[0,.2]}).observe(canvas);
  resize();play(true);
}
