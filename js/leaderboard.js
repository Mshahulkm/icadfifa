/* =========================================================
   Live Leaderboard — fetches from Google Sheet CSV
   ========================================================= */
(function () {
  const CSV_URL = 'https://docs.google.com/spreadsheets/d/1suZ3904y0P-SLDcGwFQCzyte-tS7KJJq/gviz/tq?tqx=out:csv&sheet=Current%20Point%20Table';
  const REFRESH_MS = 30 * 1000;

  const lbBody = document.getElementById('lbBody');
  if (!lbBody) return;

  /* ---- Minimal RFC-4180-ish CSV parser ---- */
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

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  async function refreshLeaderboard() {
    try {
      const url = CSV_URL + (CSV_URL.includes('?') ? '&' : '?') + '_=' + Date.now();
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('CSV fetch ' + res.status);
      const rows = parseCSV(await res.text());
      if (rows.length < 2) return;

      const headers = rows[0];
      const nameIdx = headers.findIndex(h => /participants? name|name/i.test(h));
      const totalIdx = headers.findIndex(h => /^total$/i.test(h));
      
      if (nameIdx === -1 || totalIdx === -1) throw new Error('Required columns not found');

      const entries = [];
      for (let i = 1; i < rows.length; i++) {
        const name = (rows[i][nameIdx] || '').trim();
        const points = parseFloat(rows[i][totalIdx]) || 0;
        if (name) entries.push({ name, points });
      }

      // 1. Sort participants by points descending
      entries.sort((a, b) => b.points - a.points);

      // 2. Automatically assign ranks: Same Points = Same Rank
      let currentRank = 1;
      for (let i = 0; i < entries.length; i++) {
        if (i > 0 && entries[i].points < entries[i - 1].points) {
          currentRank = i + 1; // Standard competition ranking (e.g., 1, 2, 2, 4)
        }
        entries[i].rank = currentRank;
      }

      // 3. Render the leaderboard table rows
      lbBody.innerHTML = entries.slice(0, 99).map((p) => {
        const cls = p.rank === 1 ? 'gold' : p.rank === 2 ? 'silver' : p.rank === 3 ? 'bronze' : '';
        return `
          <tr>
            <td><span class="rank-badge ${cls}">${p.rank}</span></td>
            <td>${escapeHtml(p.name)}</td>
            <td class="text-end fw-bold text-gold">${p.points}</td>
          </tr>`;
      }).join('');
    } catch (err) {
      console.warn('Leaderboard refresh failed', err);
    }
  }

  refreshLeaderboard();
  setInterval(refreshLeaderboard, REFRESH_MS);
})();