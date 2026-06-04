# ICAD FIFA World Cup 2026 — Prediction Contest

Standalone HTML / CSS / JS website. No frameworks, no build step.

## Run locally

Because the page loads `data.json` via `fetch()`, you must serve the folder over HTTP (not `file://`):

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Or use any static host (Netlify, Vercel, GitHub Pages, etc.) — just upload the folder.

## Edit content

All news, announcements, winners, leaderboard, rules, prizes, FAQ and contact info
live in **`data.json`**. Edit that file and refresh — no code changes needed.

- `site.kickoffDate` — ISO datetime for the countdown
- `site.registerUrl` — URL all "Register" buttons point to
- `news` — Tournament updates cards
- `announcements` — Admin announcements list
- `winners` — Hall of Fame (drop new portraits in `assets/` and reference them)
- `leaderboard` — Live points table
- `rules`, `prizes`, `faq` — Arrays of items, add/remove freely

## Files

- `index.html` — markup
- `styles.css` — design system, glass effects, animations
- `script.js` — renders content from data.json
- `data.json` — all editable content
- `assets/` — winner portraits (SVG placeholders included)
