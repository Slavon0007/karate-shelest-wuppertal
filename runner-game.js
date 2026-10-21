// Loaded only after the visitor presses Start. No assets or external requests.
export function mountGame(root) {
  if (root.dataset.mounted) return;
  const canvas=root.querySelector('canvas');
  const ctx=canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  root.dataset.mounted='true';
  const scoreEl=root.querySelector('[data-score]');
  const bestEl=root.querySelector('[data-best]');
  const status=root.querySelector('.runner-status');
  const pauseButton=root.querySelector('[data-pause]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width=960,height=320,dpr=1,frame=0,last=0,state='idle';
  let y=0,velocity=0,elapsed=0,score=0,best=0,spawn=0.8,obstacles=[];
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
    const x=playerX(), floor=height-44, top=floor-60+y;
    const swing=y< -2?0:Math.sin(elapsed*18)*11;
    ctx.fillStyle='#ffd40022';ctx.beginPath();ctx.ellipse(x+4,floor+4,22,3,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=gold;ctx.fillStyle=gold;ctx.lineWidth=7;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.beginPath();ctx.arc(x,top+9,8,0,Math.PI*2);ctx.fill();
    limb([[x,top+24],[x+2,top+39]]);
    if(y< -2) {
      limb([[x+1,top+38],[x+20,top+46],[x+31,top+36]]);
      limb([[x+1,top+38],[x-12,top+49],[x-23,top+45]]);
      limb([[x,top+25],[x+14,top+27],[x+22,top+17]]);
      limb([[x-1,top+25],[x-14,top+32],[x-21,top+24]]);
    } else {
      limb([[x+2,top+39],[x+10+swing,top+49],[x+14+swing,top+59]]);
      limb([[x+2,top+39],[x-9-swing,top+48],[x-14-swing,top+58]]);
      limb([[x,top+24],[x-12-swing*.5,top+31],[x-21-swing*.5,top+23]]);
      limb([[x,top+24],[x+12+swing*.5,top+29],[x+20+swing*.5,top+18]]);
    }
    ctx.strokeStyle='#090909';ctx.lineWidth=3;limb([[x-5,top+34],[x+7,top+35]]);
    ctx.strokeStyle=gold;ctx.lineWidth=2;limb([[x+5,top+36],[x+11,top+44]]);
    // Headband tail is drawn, rather than using a sprite download.
    ctx.lineWidth=3;limb([[x-7,top+6],[x-18,top+3],[x-23,top+7]]);
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
      if(x+12>obstacle.x+2&&x-12<obstacle.x+obstacle.w-2&&floor+y-4>floor-obstacle.h+3&&floor-56+y<floor){endRound();break;}
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
  function jump(){if(state==='playing'&&y===0)velocity=-625;}
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
