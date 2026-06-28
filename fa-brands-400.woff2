/* ============================================
   ICAD FIFA 2026 — APP JS
   Edit data/announcements.json and data/winners.json
   to update content without touching this file.
   ============================================ */

AOS.init({duration:900, once:true, offset:80, easing:'ease-out-cubic'});

/* ---------- LOADER ---------- */
window.addEventListener('load',()=>{
  setTimeout(()=>document.getElementById('loader').classList.add('hide'), 600);
});

/* ---------- DYNAMIC DATA ---------- */
const annList = document.getElementById('annList');
const wg = document.getElementById('winnersGrid');
/* Live leaderboard is rendered by js/leaderboard.js */

function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

async function loadJSON(path){
  const res = await fetch(path, {cache:"no-store"});
  if(!res.ok) throw new Error(path+" "+res.status);
  return res.json();
}

loadJSON('./data/announcements.json').then(list=>{
  annList.innerHTML = list.map(a=>`
    <div class="ann-item">
      <div class="date"><i class="fa-solid fa-bullhorn me-2"></i>${escapeHTML(a.date)}</div>
      <h6>${escapeHTML(a.title)}</h6>
      <p class="mb-0" style="color:var(--muted)">${a.message}</p>
    </div>`).join('');
  AOS.refresh();
}).catch(err=>{
  annList.innerHTML = `<div class="ann-item"><h6>Announcements unavailable</h6><p class="mb-0" style="color:var(--muted)">Could not load <code>data/announcements.json</code>. Serve the site over HTTP (local server / GitHub Pages), not file://.</p></div>`;
  console.warn(err);
});

loadJSON('./data/winners.json').then(list=>{
  wg.innerHTML = list.map((w,i)=>`
    <div class="col-md-6 col-lg-3" data-aos="zoom-in" data-aos-delay="${i*80}">
      <div class="winner-card tilt">
        <img src="${escapeHTML(w.photo)}" alt="${escapeHTML(w.name)}" loading="lazy">
        <div class="winner-info">
          <div class="pos">${escapeHTML(w.position)} • ${escapeHTML(w.year)}</div>
          <h5>${escapeHTML(w.name)}</h5>
        </div>
      </div>
    </div>`).join('');
  AOS.refresh();
  bindTilt();
}).catch(err=>{
  wg.innerHTML = `<div class="col-12 text-center" style="color:var(--muted)">Could not load <code>data/winners.json</code>. Serve the site over HTTP.</div>`;
  console.warn(err);
});

/* ---------- COUNTDOWN ----------
   FIFA World Cup 2026 — Opening Match:
   Thursday, 11 June 2026, Estadio Azteca, Mexico City
   Kick-off 12:00 local (CDT, UTC−6) = 18:00 UTC
*/
const TARGET = new Date("2026-06-11T18:00:00Z").getTime();
const elDays = document.getElementById('cd-days');
const elHrs  = document.getElementById('cd-hours');
const elMin  = document.getElementById('cd-mins');
const elSec  = document.getElementById('cd-secs');
let prev = {d:-1,h:-1,m:-1,s:-1};
function tick(){
  let d = Math.max(0, TARGET - Date.now());
  const days = Math.floor(d/86400000); d-=days*86400000;
  const hrs  = Math.floor(d/3600000);  d-=hrs*3600000;
  const min  = Math.floor(d/60000);    d-=min*60000;
  const sec  = Math.floor(d/1000);
  if(days!==prev.d){elDays.textContent=String(days).padStart(3,'0'); flip(elDays); prev.d=days;}
  if(hrs !==prev.h){elHrs.textContent =String(hrs).padStart(2,'0');  flip(elHrs);  prev.h=hrs;}
  if(min !==prev.m){elMin.textContent =String(min).padStart(2,'0');  flip(elMin);  prev.m=min;}
  if(sec !==prev.s){elSec.textContent =String(sec).padStart(2,'0');  flip(elSec);  prev.s=sec;}
}
function flip(el){el.style.animation='none';void el.offsetWidth;el.style.animation='numPulse .5s ease';}
tick(); setInterval(tick,1000);

/* ---------- COUNTERS ---------- */
const counters = document.querySelectorAll('.counter');
const cObs = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      const el=e.target, target=+el.dataset.target;
      let cur=0, dur=1400, start=performance.now();
      function step(t){
        const p=Math.min(1,(t-start)/dur);
        const eased=1-Math.pow(1-p,3);
        el.textContent=Math.floor(eased*target);
        if(p<1) requestAnimationFrame(step); else el.textContent=target;
      }
      requestAnimationFrame(step);
      cObs.unobserve(el);
    }
  });
},{threshold:.4});
counters.forEach(c=>cObs.observe(c));

/* ---------- SCROLL PROGRESS + NAV ---------- */
const nav = document.querySelector('.navbar-custom');
window.addEventListener('scroll',()=>{
  const h=document.documentElement;
  const p=(h.scrollTop/(h.scrollHeight-h.clientHeight))*100;
  document.getElementById('progressBar').style.width=p+'%';
  if(h.scrollTop>40) nav.classList.add('scrolled'); else nav.classList.remove('scrolled');
});


/* ---------- THEME TOGGLE (robust) ---------- */
(function initThemeToggle(){
  const tBtn = document.getElementById('themeToggle');
  const tIcon = document.getElementById('themeIcon');
  if(!tBtn || !tIcon) return;
  let saved = 'dark';
  try { saved = localStorage.getItem('icad_theme') || 'dark'; } catch(e){}
  const applyTheme = (mode) => {
    const isLight = mode === 'light';
    document.body.classList.toggle('light', isLight);
    document.documentElement.classList.toggle('light', isLight);
    tIcon.className = isLight ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    tBtn.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
  };
  applyTheme(saved);
  tBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const next = document.body.classList.contains('light') ? 'dark' : 'light';
    applyTheme(next);
    try { localStorage.setItem('icad_theme', next); } catch(_){}
    tBtn.animate(
      [{transform:'scale(1) rotate(0)'},{transform:'scale(1.2) rotate(180deg)'},{transform:'scale(1) rotate(360deg)'}],
      {duration:500, easing:'cubic-bezier(.2,.8,.2,1)'}
    );
  });
})();

/* ---------- CONFETTI ---------- */
const canvas=document.getElementById('confetti-canvas');
const ctx=canvas.getContext('2d');
function resize(){canvas.width=innerWidth;canvas.height=innerHeight;}
resize();addEventListener('resize',resize);
let pieces=[];
function fireConfetti(){
  const colors=['#FFD24C','#0E62FF','#FFFFFF','#E1A92A','#9ec1ff','#ff6b6b'];
  for(let i=0;i<200;i++){
    pieces.push({
      x:innerWidth/2,y:innerHeight/3,
      vx:(Math.random()-.5)*12, vy:(Math.random()-1)*14,
      size:Math.random()*9+4, color:colors[i%colors.length],
      rot:Math.random()*Math.PI, vr:(Math.random()-.5)*.4,
      life:140
    });
  }
}
window.fireConfetti = fireConfetti;
function loop(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  pieces.forEach(p=>{
    p.vy+=.35;p.x+=p.vx;p.y+=p.vy;p.rot+=p.vr;p.life--;
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);
    ctx.fillStyle=p.color;ctx.globalAlpha=Math.max(0,p.life/140);
    ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*.6);
    ctx.restore();
  });
  pieces=pieces.filter(p=>p.life>0 && p.y<innerHeight+50);
  requestAnimationFrame(loop);
}
loop();

/* ---------- CURSOR GLOW ---------- */
const glow=document.getElementById('cursorGlow');
let gx=0,gy=0,tx=0,ty=0;
document.addEventListener('mousemove',e=>{tx=e.clientX;ty=e.clientY;});
function glowLoop(){gx+=(tx-gx)*.12;gy+=(ty-gy)*.12;glow.style.transform=`translate(${gx}px,${gy}px) translate(-50%,-50%)`;requestAnimationFrame(glowLoop);}
glowLoop();

/* ---------- PARTICLES (footballs / stars) ---------- */
const pcv = document.getElementById('particles');
const pctx = pcv.getContext('2d');
function pResize(){pcv.width=innerWidth;pcv.height=innerHeight;}
pResize();addEventListener('resize',pResize);
const particles=[];
const PCOUNT = innerWidth<600 ? 35 : 70;
for(let i=0;i<PCOUNT;i++){
  particles.push({
    x:Math.random()*pcv.width, y:Math.random()*pcv.height,
    r:Math.random()*1.8+.6,
    vx:(Math.random()-.5)*.25, vy:(Math.random()-.5)*.25,
    a:Math.random()*.5+.25
  });
}
function pLoop(){
  pctx.clearRect(0,0,pcv.width,pcv.height);
  for(let i=0;i<particles.length;i++){
    const p=particles[i];
    p.x+=p.vx;p.y+=p.vy;
    if(p.x<0)p.x=pcv.width;if(p.x>pcv.width)p.x=0;
    if(p.y<0)p.y=pcv.height;if(p.y>pcv.height)p.y=0;
    pctx.beginPath();pctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    pctx.fillStyle=`rgba(255,210,76,${p.a})`;pctx.fill();
    // connect close particles
    for(let j=i+1;j<particles.length;j++){
      const q=particles[j];const dx=p.x-q.x,dy=p.y-q.y;const d=dx*dx+dy*dy;
      if(d<14000){
        pctx.strokeStyle=`rgba(255,210,76,${.08*(1-d/14000)})`;
        pctx.lineWidth=.6;pctx.beginPath();pctx.moveTo(p.x,p.y);pctx.lineTo(q.x,q.y);pctx.stroke();
      }
    }
  }
  requestAnimationFrame(pLoop);
}
pLoop();

/* ---------- 3D TILT ---------- */
function bindTilt(){
  document.querySelectorAll('.tilt').forEach(el=>{
    if(el.dataset.tiltBound) return;
    el.dataset.tiltBound='1';
    el.addEventListener('mousemove',e=>{
      const r=el.getBoundingClientRect();
      const px=(e.clientX-r.left)/r.width-.5;
      const py=(e.clientY-r.top)/r.height-.5;
      el.style.transform=`perspective(800px) rotateX(${-py*8}deg) rotateY(${px*8}deg) translateY(-4px)`;
    });
    el.addEventListener('mouseleave',()=>{el.style.transform='';});
  });
}
bindTilt();

/* ---------- CLOSE MOBILE NAV ON CLICK ---------- */
document.querySelectorAll('.navbar-nav .nav-link').forEach(l=>{
  l.addEventListener('click',()=>{
    const c=document.getElementById('navMain');
    if(c.classList.contains('show')) new bootstrap.Collapse(c).hide();
  });
});
