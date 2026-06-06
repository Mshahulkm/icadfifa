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
     POLL — stored on GitHub (no backend, no token)
     ------------------------------------------------------
     HOW IT WORKS
       • Each vote is a GitHub Issue in your repo, tagged with a
         label like "vote:Brazil".
       • The "Vote" button opens a pre-filled "New Issue" page on
         GitHub. The user just clicks Submit (while logged in).
       • This page reads live counts from GitHub's public Search
         API — no authentication, no secret keys.

     ONE-TIME SETUP
       1) In your GitHub repo go to Issues → Labels → New label,
          and create one label per team named exactly:
              vote:Brazil   vote:Argentina   vote:France ...
          (Tip: only create labels for the teams you want to allow.
           Unlabeled teams will still work but won't get a color.)
       2) Edit POLL_CONFIG below and set "owner" and "repo".
       3) Commit & push — that's it.

     LIMITS
       • Unauthenticated GitHub Search API = 10 requests / minute
         per IP. We cache & throttle so a normal visit uses 1 call.
       • Voters must have a (free) GitHub account.
  ====================================================== */
  const POLL_CONFIG = {
    owner: 'YOUR_GITHUB_USERNAME',   // e.g. 'shahul'
    repo:  'YOUR_REPO_NAME',         // e.g. 'icad-fifa-2026'
    labelPrefix: 'vote:',            // labels look like "vote:Brazil"
    issueTitlePrefix: '[VOTE] ',     // pre-filled issue title
    cacheMs: 30 * 1000,              // client cache to respect rate limit
  };
  const POLL_USER_KEY = 'icad_fifa_poll_user_vote_v2';

  let TEAM_CODES = {};
  let TEAM_LIST  = [];

  function isConfigured() {
    return POLL_CONFIG.owner && POLL_CONFIG.repo &&
           POLL_CONFIG.owner !== 'YOUR_GITHUB_USERNAME';
  }

  function getUserVote()  { return localStorage.getItem(POLL_USER_KEY) || ''; }
  function setUserVote(t) { localStorage.setItem(POLL_USER_KEY, t); }

  async function initPoll() {
    const select  = document.getElementById('pollTeamSelect');
    const voteBtn = document.getElementById('pollVoteBtn');
    const refresh = document.getElementById('pollRefresh');
    if (!select) return;

    // Build team list from groups.json (options match official data)
    const data = await loadJSON('data/groups.json');
    if (data) {
      data.groups.flatMap(g => g.teams).forEach(t => {
        TEAM_CODES[t.name.toLowerCase()] = t.code;
        TEAM_LIST.push(t.name);
      });
      TEAM_LIST.sort();
      select.innerHTML = '<option value="">-- Select a team --</option>' +
        TEAM_LIST.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('');
    }

    syncVoteUI();
    await refreshResults();

    voteBtn?.addEventListener('click', () => {
      const team = select.value.trim();
      if (!team) { flashStatus('Please select a team', true); return; }
      if (!isConfigured()) {
        flashStatus('Set owner/repo in js/extras.js', true);
        return;
      }

      const label = POLL_CONFIG.labelPrefix + team;
      const title = POLL_CONFIG.issueTitlePrefix + team;
      const body  = `I vote for **${team}** to win the FIFA World Cup 2026.\n\n` +
                    `_(Auto-generated by the ICAD FIFA 2026 poll. Please do not edit the label.)_`;
      const url = `https://github.com/${encodeURIComponent(POLL_CONFIG.owner)}` +
                  `/${encodeURIComponent(POLL_CONFIG.repo)}/issues/new` +
                  `?title=${encodeURIComponent(title)}` +
                  `&labels=${encodeURIComponent(label)}` +
                  `&body=${encodeURIComponent(body)}`;

      setUserVote(team);
      syncVoteUI();
      flashStatus('Opening GitHub… click Submit to record your vote');
      window.open(url, '_blank', 'noopener');
      if (typeof window.fireConfetti === 'function') window.fireConfetti();
    });

    refresh?.addEventListener('click', () => refreshResults(true));
  }

  function syncVoteUI() {
    const select  = document.getElementById('pollTeamSelect');
    const status  = document.getElementById('pollStatus');
    const userVote = getUserVote();
    if (userVote) {
      if (select) select.value = userVote;
      if (status) status.textContent = 'You picked: ' + userVote;
    } else if (status) {
      status.textContent = 'Pick your champion';
    }
  }

  let _statusTimer;
  function flashStatus(msg, isError) {
    const status = document.getElementById('pollStatus');
    if (!status) return;
    status.textContent = msg;
    status.style.color = isError ? '#ff6b6b' : '#FFD24C';
    clearTimeout(_statusTimer);
    _statusTimer = setTimeout(() => {
      status.style.color = '';
      syncVoteUI();
    }, 2400);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  /* ---- GitHub Search API: one call returns all label counts ---- */
  let _cache = { ts: 0, tally: null };

  async function fetchTally() {
    if (!isConfigured()) return {};
    if (_cache.tally && Date.now() - _cache.ts < POLL_CONFIG.cacheMs) {
      return _cache.tally;
    }
    // Pull every issue with a vote:* label (open + closed), 100/page.
    const tally = {};
    const repo  = `${POLL_CONFIG.owner}/${POLL_CONFIG.repo}`;
    for (let page = 1; page <= 10; page++) {
      const q = encodeURIComponent(`repo:${repo} label:"${POLL_CONFIG.labelPrefix}" in:title`);
      // Simpler & accurate: list issues by label prefix via REST.
      const url = `https://api.github.com/repos/${repo}/issues` +
                  `?state=all&per_page=100&page=${page}`;
      const res = await fetch(url, { headers: { 'Accept': 'application/vnd.github+json' } });
      if (!res.ok) throw new Error('GitHub API ' + res.status);
      const issues = await res.json();
      if (!issues.length) break;
      for (const it of issues) {
        if (it.pull_request) continue;
        for (const lab of (it.labels || [])) {
          const name = typeof lab === 'string' ? lab : lab.name;
          if (name && name.startsWith(POLL_CONFIG.labelPrefix)) {
            const team = name.slice(POLL_CONFIG.labelPrefix.length).trim();
            if (team) tally[team] = (tally[team] || 0) + 1;
          }
        }
      }
      if (issues.length < 100) break;
    }
    _cache = { ts: Date.now(), tally };
    return tally;
  }

  async function refreshResults(force) {
    const box   = document.getElementById('pollResults');
    const total = document.getElementById('totalVotes');
    if (!box || !total) return;

    if (!isConfigured()) {
      box.innerHTML = `
        <div class="text-center p-3" style="color:var(--muted)">
          Set <code>owner</code> and <code>repo</code> in
          <code>js/extras.js</code> to enable live GitHub results.
        </div>`;
      total.textContent = '0 Total Votes';
      return;
    }

    if (force) _cache = { ts: 0, tally: null };
    box.innerHTML = `<div class="text-center p-3" style="color:var(--muted)">Loading live results from GitHub…</div>`;
    try {
      const tally = await fetchTally();
      renderResults(tally);
    } catch (err) {
      console.warn('GitHub poll error', err);
      box.innerHTML = `
        <div class="text-center p-3" style="color:var(--muted)">
          Could not load results from GitHub.<br>
          <small>${escapeHtml(err.message)}</small>
        </div>`;
      total.textContent = '0 Total Votes';
    }
  }

  function renderResults(tally) {
    const box   = document.getElementById('pollResults');
    const total = document.getElementById('totalVotes');

    const entries = Object.entries(tally)
      .map(([name, count]) => ({ name, count, code: TEAM_CODES[name.toLowerCase()] || '' }))
      .sort((a, b) => b.count - a.count);

    const sum = entries.reduce((s, e) => s + e.count, 0);
    total.textContent = `${sum} Total Vote${sum === 1 ? '' : 's'}`;

    if (!entries.length) {
      box.innerHTML = `<div class="text-center p-3" style="color:var(--muted)">No votes yet &mdash; be the first!</div>`;
      return;
    }

    box.innerHTML = entries.map((e, idx) => {
      const pct = sum ? Math.round((e.count / sum) * 100) : 0;
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
