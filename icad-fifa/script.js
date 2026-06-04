// ICAD FIFA 2026 — Prediction Contest
// Loads content from data.json and renders all sections.

const $ = (s, p=document) => p.querySelector(s);
const $$ = (s, p=document) => Array.from(p.querySelectorAll(s));
const el = (tag, cls, html) => { const e = document.createElement(tag); if(cls) e.className = cls; if(html!=null) e.innerHTML = html; return e; };

async function loadData(){
  const res = await fetch('data.json');
  return res.json();
}

function renderHero(d){
  $('#brand').textContent = d.site.brand;
  $('#heroEyebrow').textContent = d.hero.eyebrow;
  $('#heroTitle').innerHTML = d.hero.title.split(' ').map(w=>`<span>${w}</span>`).join('');
  $('#heroTagline').textContent = d.hero.tagline;
  $('#heroNote').textContent = d.hero.note;
  $$('#registerBtn, #registerBtn2, #navRegister').forEach(a => a.href = d.site.registerUrl);
}

function renderStats(d){
  const wrap = $('#stats');
  wrap.innerHTML = '';
  d.stats.forEach(s => {
    const box = el('div','stat reveal');
    box.innerHTML = `<div class="stat-value">${s.value}</div><div class="stat-label">${s.label}</div>`;
    wrap.appendChild(box);
  });
}

function renderAbout(d){
  $('#aboutEyebrow').textContent = d.about.eyebrow;
  $('#aboutTitle').textContent = d.about.title;
  $('#aboutBody').textContent = d.about.body;
  const ul = $('#eligList'); ul.innerHTML='';
  d.eligibility.forEach(x => ul.appendChild(el('li','',x)));
}

function renderRules(d){
  const wrap = $('#rules'); wrap.innerHTML='';
  d.rules.forEach((r,i) => {
    const c = el('div','rule reveal');
    c.innerHTML = `<div class="num">${i+1}</div><p>${r}</p>`;
    wrap.appendChild(c);
  });
}

function renderNews(d){
  const wrap = $('#news'); wrap.innerHTML='';
  d.news.forEach(n => {
    const c = el('div','news-card reveal');
    c.innerHTML = `<h3>${n.title}</h3><p>${n.body}</p>`;
    wrap.appendChild(c);
  });
}

function renderAnnouncements(d){
  const wrap = $('#announcements'); wrap.innerHTML='';
  d.announcements.forEach(a => {
    const c = el('div','ann reveal');
    c.innerHTML = `<div class="meta">${a.tag}<span class="date">${a.date}</span></div>
      <div><h3>${a.title}</h3><p>${a.body}</p></div>`;
    wrap.appendChild(c);
  });
}

function renderLeaderboard(d){
  const tb = $('#lbBody'); tb.innerHTML='';
  d.leaderboard.forEach(r => {
    const tr = el('tr','reveal');
    const cls = r.rank===1?'gold':r.rank===2?'silver':r.rank===3?'bronze':'';
    tr.innerHTML = `<td><span class="lb-rank ${cls}">${r.rank}</span></td>
      <td>${r.name}</td><td class="lb-points">${r.points}</td>`;
    tb.appendChild(tr);
  });
}

function renderWinners(d){
  const wrap = $('#winners'); wrap.innerHTML='';
  d.winners.forEach(w => {
    const c = el('div','winner reveal');
    c.innerHTML = `<img src="${w.image}" alt="${w.name}" onerror="this.src='assets/winner-placeholder.svg'">
      <h3>${w.name}</h3><div class="year">${w.year}</div>
      <div class="title">${w.title}</div>`;
    wrap.appendChild(c);
  });
}

function renderPrizes(d){
  const wrap = $('#prizes'); wrap.innerHTML='';
  d.prizes.forEach(p => {
    const c = el('div','prize reveal');
    c.innerHTML = `<span class="icon">${p.icon}</span><h3>${p.title}</h3><p>${p.body}</p>`;
    wrap.appendChild(c);
  });
}

function renderFaq(d){
  const wrap = $('#faq'); wrap.innerHTML='';
  d.faq.forEach((f,i) => {
    const item = el('div','faq-item reveal');
    item.innerHTML = `<button class="faq-q"><span>${f.q}</span><span class="plus">+</span></button>
      <div class="faq-a"><p>${f.a}</p></div>`;
    item.querySelector('.faq-q').addEventListener('click', () => item.classList.toggle('open'));
    wrap.appendChild(item);
  });
}

function renderContact(d){
  $('#cWhatsapp').textContent = d.contact.whatsapp;
  $('#cTelegram').textContent = d.contact.telegram;
  $('#cEmail').textContent = d.contact.email;
}

// Countdown
function startCountdown(target){
  const t = new Date(target).getTime();
  function tick(){
    const diff = Math.max(0, t - Date.now());
    const days = Math.floor(diff/86400000);
    const hours = Math.floor(diff/3600000)%24;
    const mins = Math.floor(diff/60000)%60;
    const secs = Math.floor(diff/1000)%60;
    $('#cdDays').textContent = String(days).padStart(2,'0');
    $('#cdHours').textContent = String(hours).padStart(2,'0');
    $('#cdMins').textContent = String(mins).padStart(2,'0');
    $('#cdSecs').textContent = String(secs).padStart(2,'0');
  }
  tick();
  setInterval(tick, 1000);
}

// Nav
function setupNav(){
  const nav = $('#nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 30);
    const sections = $$('section[id], header[id]');
    let active = '';
    sections.forEach(s => { if (s.offsetTop - 120 < window.scrollY) active = s.id; });
    $$('.nav a[data-link]').forEach(a => a.classList.toggle('active', a.dataset.link === active));
  });
  $('#menuBtn').addEventListener('click', () => $('#navList').classList.toggle('open'));
  $$('.nav a[data-link]').forEach(a => a.addEventListener('click', () => $('#navList').classList.remove('open')));
}

// Reveal on scroll
function setupReveal(){
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting){ e.target.classList.add('visible'); obs.unobserve(e.target);} });
  }, { threshold: 0.12 });
  $$('.reveal').forEach(el => obs.observe(el));
}

(async function init(){
  try {
    const d = await loadData();
    renderHero(d);
    renderStats(d);
    renderAbout(d);
    renderRules(d);
    renderNews(d);
    renderAnnouncements(d);
    renderLeaderboard(d);
    renderWinners(d);
    renderPrizes(d);
    renderFaq(d);
    renderContact(d);
    startCountdown(d.site.kickoffDate);
    setupNav();
    setupReveal();
  } catch(e){
    console.error('Failed to load data.json. If you opened index.html directly, run a local server (python3 -m http.server).', e);
    document.body.insertAdjacentHTML('afterbegin',
      '<div style="padding:20px;background:#a33;color:#fff;text-align:center;font-family:sans-serif">Cannot load data.json directly from file://. Please run a local server: <code>python3 -m http.server</code> in this folder, then open http://localhost:8000</div>');
  }
})();
