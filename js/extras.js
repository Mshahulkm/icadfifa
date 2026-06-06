/* =========================================================
   FIFA 2026 Extras: Groups · Schedule · Poll
   Pure vanilla JS – no framework, uses localStorage for poll
   ========================================================= */
(function () {
  const FLAG = (code) =>
    `https://flagcdn.com/w80/${code.toLowerCase()}.png`;

  /* ---------- Fetch helper ---------- */
  async function loadJSON(path) {
    try {
      const r = await fetch(path, { cache: 'no-cache' });
      if (!r.ok) throw new Error(r.status);
      return await r.json();
    } catch (e) {
      console.warn('Failed to load', path, e);
      return null;
    }
  }

  /* ======================================================
     GROUPS
  ====================================================== */
  async function renderGroups() {
    const grid = document.getElementById('groupsGrid');
    if (!grid) return;
    const data = await loadJSON('data/groups.json');
    if (!data) return;

    grid.innerHTML = data.groups.map((g, i) => `
      <div class="col-md-6 col-lg-4" data-aos="zoom-in" data-aos-delay="${(i % 4) * 80}">
        <div class="group-card tilt">
          <div class="group-head">
            <span class="group-badge">Group</span>
            <span class="group-letter">${g.name}</span>
          </div>
          <ul class="team-list">
            ${g.teams.map(t => `
              <li>
                <img src="${FLAG(t.code)}" alt="${t.name} flag" loading="lazy" onerror="this.style.visibility='hidden'">
                <span>${t.name}</span>
              </li>`).join('')}
          </ul>
        </div>
      </div>
    `).join('');
  }

  /* ======================================================
     SCHEDULE
  ====================================================== */
  let SCHEDULE = [];
  let ACTIVE_DATE = null;

  function fmtDateLabel(iso) {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  function fmtFullDate(iso) {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
  }

  function renderDateBar() {
    const bar = document.getElementById('dateBar');
    if (!bar) return;
    const dates = [...new Set(SCHEDULE.map(m => m.date))].sort();
    bar.innerHTML = dates.map(d => `
      <button type="button" class="date-btn ${d === ACTIVE_DATE ? 'active' : ''}" data-date="${d}">
        ${fmtDateLabel(d)}
      </button>
    `).join('');
    bar.querySelectorAll('.date-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        ACTIVE_DATE = btn.dataset.date;
        renderDateBar();
        renderMatches();
      });
    });
  }

  function renderMatches() {
    const list = document.getElementById('matchList');
    if (!list) return;
    const items = SCHEDULE.filter(m => m.date === ACTIVE_DATE);
    if (!items.length) {
      list.innerHTML = `<div class="text-center p-4" style="color:var(--muted)">No matches scheduled.</div>`;
      return;
    }
    list.innerHTML = `
      <div class="match-date-head">${fmtFullDate(ACTIVE_DATE)}</div>
      ${items.map(m => `
        <div class="match-row">
          <div class="match-team home">
            <span class="t-name">${m.home}</span>
            <img src="${FLAG(m.homeCode)}" alt="${m.home}" onerror="this.style.visibility='hidden'">
          </div>
          <div class="match-vs">
            <span class="vs-time">${m.time}</span>
            <span class="vs-text">VS</span>
            <span class="vs-stage">${m.stage}</span>
          </div>
          <div class="match-team away">
            <img src="${FLAG(m.awayCode)}" alt="${m.away}" onerror="this.style.visibility='hidden'">
            <span class="t-name">${m.away}</span>
          </div>
          <div class="match-venue"><i class="fa-solid fa-location-dot me-1"></i>${m.venue}</div>
        </div>
      `).join('')}
    `;
  }

  async function initSchedule() {
    if (!document.getElementById('dateBar')) return;
    const data = await loadJSON('data/schedule.json');
    if (!data) return;
    SCHEDULE = data.matches;
    ACTIVE_DATE = SCHEDULE[0]?.date || null;
    renderDateBar();
    renderMatches();
  }

  /* ======================================================
     POLL
  ====================================================== */
  const POLL_KEY = 'icad_fifa2026_poll_votes_v1';
  const VOTERS_KEY = 'icad_fifa2026_poll_voters_v1';

  function loadVotes() {
    try { return JSON.parse(localStorage.getItem(POLL_KEY)) || {}; }
    catch { return {}; }
  }
  function saveVotes(v) { localStorage.setItem(POLL_KEY, JSON.stringify(v)); }
  function loadVoters() {
    try { return JSON.parse(localStorage.getItem(VOTERS_KEY)) || []; }
    catch { return []; }
  }
  function saveVoters(v) { localStorage.setItem(VOTERS_KEY, JSON.stringify(v)); }

  async function initPoll() {
    const form = document.getElementById('pollForm');
    if (!form) return;
    const select = document.getElementById('pollTeam');
    const data = await loadJSON('data/groups.json');
    if (data) {
      const teams = data.groups.flatMap(g => g.teams)
        .sort((a, b) => a.name.localeCompare(b.name));
      select.innerHTML = '<option value="">-- Choose Team --</option>' +
        teams.map(t => `<option value="${t.name}" data-code="${t.code}">${t.name}</option>`).join('');
    }

    renderResults();

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('pollName').value.trim();
      const team = select.value;
      if (!name || !team) return;

      const voters = loadVoters();
      const key = name.toLowerCase();
      if (voters.includes(key)) {
        alert('You have already voted with this name.');
        return;
      }
      const votes = loadVotes();
      const opt = select.options[select.selectedIndex];
      const code = opt.dataset.code || '';
      if (!votes[team]) votes[team] = { count: 0, code };
      votes[team].count += 1;
      saveVotes(votes);
      voters.push(key);
      saveVoters(voters);

      form.reset();
      renderResults(team);
    });
  }

  function renderResults(highlight) {
    const box = document.getElementById('pollResults');
    const total = document.getElementById('totalVotes');
    if (!box) return;
    const votes = loadVotes();
    const entries = Object.entries(votes)
      .map(([name, v]) => ({ name, count: v.count || 0, code: v.code || '' }))
      .sort((a, b) => b.count - a.count);
    const sum = entries.reduce((s, e) => s + e.count, 0);
    total.textContent = `${sum} Total Vote${sum === 1 ? '' : 's'}`;

    if (!entries.length) {
      box.innerHTML = `<div class="text-center p-3" style="color:var(--muted)">No votes yet — be the first!</div>`;
      return;
    }
    box.innerHTML = entries.map(e => {
      const pct = sum ? Math.round((e.count / sum) * 100) : 0;
      return `
        <div class="poll-row ${e.name === highlight ? 'flash' : ''}">
          <div class="poll-row-head">
            <span class="poll-team-name">
              ${e.code ? `<img src="${FLAG(e.code)}" alt="" onerror="this.style.display='none'">` : ''}
              ${e.name}
            </span>
            <span class="poll-team-stat">${e.count} · ${pct}%</span>
          </div>
          <div class="poll-bar"><div class="poll-bar-fill" style="width:${pct}%"></div></div>
        </div>`;
    }).join('');
  }

  /* ---------- Boot ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    renderGroups();
    initSchedule();
    initPoll();
  });
})();
