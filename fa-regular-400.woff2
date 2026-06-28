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
    const data = await loadJSON('./data/groups.json');
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
    const data = await loadJSON('./data/schedule.json');
    if (!data) return;
    SCHEDULE = data.matches;
    ACTIVE_DATE = SCHEDULE[0]?.date || null;
    renderDateBar();
    renderMatches();
  }

  /* ======================================================
     POLL — reads live counts from a Google Form's linked Sheet
     ------------------------------------------------------
     Voting happens inside the embedded Google Form (see index.html).
     To show live results here:
       1) Open the Google Form → "Responses" tab → green Sheets icon
          to create/link a response Sheet.
       2) In that Sheet: File → Share → Publish to web →
          choose the response sheet → "Comma-separated values (.csv)"
          → Publish. Copy the URL.
       3) Paste that URL into POLL_CSV_URL below.
       4) Set TEAM_COLUMN to the EXACT question text (column header)
          asking which team will win. If left blank, the script will
          auto-pick the first column whose header contains "team".
     No backend, no token, no rate-limit issues for normal traffic.
  ====================================================== */
  const POLL_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS45AtPSBrMYshJPmafGU2-lCWFfiVYeEhTDtW8azDoq1xULfcxYY8pqtS-4PiSxjdMYxh50iMwpzuo/pub?output=csv'; // e.g. 'https://docs.google.com/spreadsheets/d/e/XXXX/pub?gid=0&single=true&output=csv'
  const TEAM_COLUMN  = ' Which is your favorite football team in the FIFA World Cup 2026? '; // e.g. 'Which team will lift the FIFA World Cup 2026 trophy?'
  const POLL_CACHE_MS = 30 * 1000;

  let TEAM_CODES = {};
  let _pollCache = { ts: 0, tally: null };

  async function initPoll() {
    // Build flag lookup from groups.json so results show flags
    const data = await loadJSON('./data/groups.json');
    if (data) {
      data.groups.flatMap(g => g.teams).forEach(t => {
        TEAM_CODES[t.name.toLowerCase()] = t.code;
      });
    }
    await refreshResults();
    document.getElementById('pollRefresh')
      ?.addEventListener('click', () => refreshResults(true));
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  /* ---- Minimal CSV parser (handles quoted fields & commas) ---- */
  function parseCSV(text) {
    const rows = [];
    let row = [], field = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += c;
      } else {
        if (c === '"') inQuotes = true;
        else if (c === ',') { row.push(field); field = ''; }
        else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
        else if (c === '\r') { /* skip */ }
        else field += c;
      }
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    return rows.filter(r => r.length && r.some(v => v !== ''));
  }

  async function fetchTally() {
    if (!POLL_CSV_URL) return null;
    if (_pollCache.tally && Date.now() - _pollCache.ts < POLL_CACHE_MS) {
      return _pollCache.tally;
    }
    // Cache-bust each refresh so Google serves fresh data
    const url = POLL_CSV_URL + (POLL_CSV_URL.includes('?') ? '&' : '?') + '_=' + Date.now();
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('CSV fetch ' + res.status);
    const rows = parseCSV(await res.text());
    if (rows.length < 2) return {};
    const headers = rows[0].map(h => h.trim());
    let colIdx = -1;
    if (TEAM_COLUMN) {
      colIdx = headers.findIndex(h => h.toLowerCase() === TEAM_COLUMN.toLowerCase());
    }
    if (colIdx === -1) {
      colIdx = headers.findIndex(h => /team|country|champion|winner/i.test(h));
    }
    if (colIdx === -1) colIdx = headers.length > 1 ? 1 : 0; // skip Timestamp

    const tally = {};
    for (let i = 1; i < rows.length; i++) {
      const v = (rows[i][colIdx] || '').trim();
      if (!v) continue;
      tally[v] = (tally[v] || 0) + 1;
    }
    _pollCache = { ts: Date.now(), tally };
    return tally;
  }

  async function refreshResults(force) {
    const box   = document.getElementById('pollResults');
    const total = document.getElementById('totalVotes');
    if (!box || !total) return;

    if (!POLL_CSV_URL) {
      box.innerHTML = `
        <div class="text-center p-3" style="color:var(--muted)">
          Set <code>POLL_CSV_URL</code> in <code>js/extras.js</code>
          to your Google Sheet's <b>Publish to web → CSV</b> link
          to display live results here.
        </div>`;
      total.textContent = '0 Total Votes';
      return;
    }

    if (force) _pollCache = { ts: 0, tally: null };
    box.innerHTML = `<div class="text-center p-3" style="color:var(--muted)">Loading live results…</div>`;
    try {
      const tally = await fetchTally();
      renderResults(tally || {});
    } catch (err) {
      console.warn('Poll CSV error', err);
      box.innerHTML = `
        <div class="text-center p-3" style="color:var(--muted)">
          Could not load results.<br><small>${escapeHtml(err.message)}</small>
        </div>`;
      total.textContent = '0 Total Votes';
    }
  }

  function renderResults(tally) {
    const box   = document.getElementById('pollResults');
    const total = document.getElementById('totalVotes');
    const FLAG_LOOKUP = (name) => TEAM_CODES[name.toLowerCase()] || '';

    const entries = Object.entries(tally)
      .map(([name, count]) => ({ name, count, code: FLAG_LOOKUP(name) }))
      .sort((a, b) => b.count - a.count);

    const sum = entries.reduce((s, e) => s + e.count, 0);
    total.textContent = `${sum} Total Vote${sum === 1 ? '' : 's'}`;

    if (!entries.length) {
      box.innerHTML = `<div class="text-center p-3" style="color:var(--muted)">No votes yet &mdash; be the first!</div>`;
      return;
    }

    box.innerHTML = entries.map((e, idx) => {
      const pct = sum ? Math.round((e.count / sum) * 1000) / 10 : 0;
      const leader = idx === 0 ? ' leader' : '';
      return `
        <div class="poll-row${leader}">
          <div class="poll-row-head">
            <span class="poll-team-name">
              ${e.code ? `<img src="${FLAG(e.code)}" alt="" onerror="this.style.display='none'">` : ''}
              ${escapeHtml(e.name)}
              ${idx === 0 ? '<i class="fa-solid fa-crown ms-2" style="color:#FFD24C"></i>' : ''}
            </span>
            <span class="poll-team-stat">${e.count} &middot; ${pct}%</span>
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
