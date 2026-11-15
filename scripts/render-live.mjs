// The two images that change on their own: the activity strip and the
// Jobbliggaren numbers. Runs daily in GitHub Actions with the default token
// and no npm install; only Node built-ins and this repo's own files.
//
// If any request fails the script exits before writing, so the last good
// images stay published. It never draws an error into an image.
//
// usage: GH_TOKEN=... node scripts/render-live.mjs --out <dir>
import fs from 'node:fs';
import path from 'node:path';
import { tokens, THEMES, svgDoc, sheet, r, root } from './lib/svg.mjs';
import { createText } from './lib/text.mjs';

const USER = 'klasolsson81';
const REPO = 'klasolsson81/jobbliggaren';
const outDir = path.resolve(process.argv[process.argv.indexOf('--out') + 1] || 'dist');
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
if (!token) throw new Error('GH_TOKEN is not set');

const headers = { authorization: `bearer ${token}`, 'user-agent': `${USER}-profile`, accept: 'application/vnd.github+json' };

async function rest(url) {
  const res = await fetch(`https://api.github.com${url}`, { headers });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return { json: await res.json(), link: res.headers.get('link') || '' };
}

async function graphql(query) {
  const res = await fetch('https://api.github.com/graphql', { method: 'POST', headers, body: JSON.stringify({ query }) });
  if (!res.ok) throw new Error(`graphql: HTTP ${res.status}`);
  const body = await res.json();
  if (body.errors) throw new Error(`graphql: ${JSON.stringify(body.errors)}`);
  return body.data;
}

// ---------- data ----------

async function calendar() {
  const data = await graphql(
    `{ user(login: "${USER}") { contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } } } } }`,
  );
  const cal = data.user.contributionsCollection.contributionCalendar;
  const days = cal.weeks.flatMap((w) => w.contributionDays);
  const weeks = cal.weeks.map((w) => ({
    start: w.contributionDays[0].date,
    total: w.contributionDays.reduce((s, d) => s + d.contributionCount, 0),
  }));
  let longest = 0;
  let run = 0;
  for (const d of days) {
    run = d.contributionCount > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  return {
    total: cal.totalContributions,
    activeDays: days.filter((d) => d.contributionCount > 0).length,
    dayCount: days.length,
    longestStreak: longest,
    weeks,
    until: days.at(-1).date,
  };
}

async function repoNumbers() {
  const commits = await rest(`/repos/${REPO}/commits?sha=main&per_page=1`);
  const last = /[?&]page=(\d+)>; rel="last"/.exec(commits.link);
  if (!last) throw new Error('could not read the commit count from the Link header');
  const prs = await rest(`/search/issues?q=${encodeURIComponent(`repo:${REPO} is:pr is:merged`)}&per_page=1`);
  const adrs = await rest(`/repos/${REPO}/contents/docs/decisions?ref=main`);
  return {
    commits: Number(last[1]),
    mergedPrs: prs.json.total_count,
    decisions: adrs.json.filter((f) => /^\d{4}-.+\.md$/.test(f.name)).length,
  };
}

// ---------- drawing ----------

const fmt = (n) => n.toLocaleString('en-US');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const HALO = '.halo{animation:halo 6s ease-out 8}@keyframes halo{0%{opacity:.5;transform:scale(1)}30%,100%{opacity:0;transform:scale(2.6)}}';
const ACTIVITY_TITLE = 'Twelve months of commits, pull requests and issues';

function bars({ T, t, cal, x, y, w, h, labelSize }) {
  const n = cal.weeks.length;
  const pitch = w / n;
  const bw = Math.max(2, pitch * 0.66);
  const max = Math.max(1, ...cal.weeks.map((wk) => wk.total));
  let body = `<line x1="${x}" y1="${y + 0.5}" x2="${x + w}" y2="${y + 0.5}" stroke="${t.line}"/>`;
  let lastMonth = -1;
  let monthCount = 0;
  // Label every month if there is room, otherwise every second one.
  const every = Math.ceil((labelSize * 2.8) / (w / 12));
  cal.weeks.forEach((wk, i) => {
    const bx = x + i * pitch + (pitch - bw) / 2;
    const isNow = i === n - 1;
    const bh = wk.total === 0 && !isNow ? 1.5 : Math.max(isNow ? 5 : 3, (wk.total / max) * h);
    // Bar height carries the value; the opacity ramp stays above 3:1 against the sheet in both themes.
    body += `<rect x="${r(bx)}" y="${r(y - bh)}" width="${r(bw)}" height="${r(bh)}" rx="1.2" fill="${isNow ? t.accent : wk.total === 0 ? t.muted : t.inkSoft}"${isNow || wk.total === 0 ? '' : ` opacity="${r(0.68 + 0.32 * (wk.total / max))}"`}/>`;
    const month = Number(wk.start.slice(5, 7)) - 1;
    if (month !== lastMonth) {
      if (monthCount % every === 0 && bx + labelSize * 2 < x + w) {
        body += T.draw(MONTHS[month], { x: bx, y: y + labelSize + 7, font: 'mono-400', size: labelSize, fill: t.muted });
      }
      monthCount++;
      lastMonth = month;
    }
    if (isNow && bh >= 14) {
      const cx = r(bx + bw / 2);
      const cy = r(y - bh - 7);
      body += `<circle class="halo" cx="${cx}" cy="${cy}" r="2.6" fill="${t.accent}" style="transform-origin:${cx}px ${cy}px"/><circle cx="${cx}" cy="${cy}" r="2.6" fill="${t.accent}"/>`;
    }
  });
  return body;
}

const activityAlt = (cal) =>
  `Figure 2, GitHub activity over the last twelve months, to ${cal.until}: ${fmt(cal.total)} contributions, active on ${cal.activeDays} of ${cal.dayCount} days, longest run ${cal.longestStreak} days. Bars show contributions per week.`;

/** A numeral with its caption underneath. */
function stat(T, t, { x, y, value, caption, size = 15, captionSize = 9.5 }) {
  return (
    T.draw(value, { x, y, font: 'mono-700', size, fill: t.ink }) +
    T.draw(caption, { x, y: y + captionSize + 4, font: 'mono-500', size: captionSize, fill: t.muted, tracking: 1 })
  );
}

function activityWide(t, cal) {
  const W = 846;
  const H = 168;
  const T = createText();
  const s = sheet({ w: W, h: H, t, fade: false });
  let body = s.body;
  body += T.draw('FIG. 2', { x: 40, y: 50, font: 'mono-700', size: 10.5, fill: t.accent, tracking: 2 });
  body += T.draw(ACTIVITY_TITLE, { x: 100, y: 51, font: 'sans-600', size: 16, fill: t.ink });
  body += T.draw(`to ${cal.until}`, { x: W - 40, y: 50, font: 'mono-400', size: 9.6, fill: t.muted, anchor: 'end' });
  body += T.draw(fmt(cal.total), { x: 38, y: 112, font: 'sans-800', size: 40, fill: t.ink, tracking: -0.6 });
  body += T.draw('CONTRIBUTIONS', { x: 40, y: 130, font: 'mono-500', size: 9.5, fill: t.muted, tracking: 1.2 });
  body += stat(T, t, { x: 190, y: 92, value: `${cal.activeDays}`, caption: `ACTIVE DAYS OF ${cal.dayCount}` });
  body += stat(T, t, { x: 190, y: 126, value: `${cal.longestStreak}`, caption: 'DAYS, LONGEST RUN' });
  body += bars({ T, t, cal, x: 340, y: 118, w: 466, h: 46, labelSize: 9.5 });
  return svgDoc({ w: W, h: H, title: activityAlt(cal), style: HALO, defs: s.defs + T.defs(), body });
}

function activityNarrow(t, cal) {
  const W = 330;
  const M = 20;
  const H = 250;
  const T = createText();
  const s = sheet({ w: W, h: H, t, inset: 8, fade: false });
  let body = s.body;
  body += T.draw('FIG. 2', { x: M, y: 40, font: 'mono-700', size: 10.5, fill: t.accent, tracking: 2 });
  body += T.draw(`to ${cal.until}`, { x: W - M, y: 40, font: 'mono-400', size: 10.4, fill: t.muted, anchor: 'end' });
  body += T.draw(fmt(cal.total), { x: M - 2, y: 92, font: 'sans-800', size: 42, fill: t.ink, tracking: -0.8 });
  body += T.draw('CONTRIBUTIONS', { x: M, y: 111, font: 'mono-500', size: 10, fill: t.muted, tracking: 1.1 });
  body += stat(T, t, { x: 176, y: 72, value: `${cal.activeDays}`, caption: 'ACTIVE DAYS', size: 16, captionSize: 10 });
  body += stat(T, t, { x: 176, y: 114, value: `${cal.longestStreak}`, caption: 'DAYS, LONGEST RUN', size: 16, captionSize: 10 });
  body += bars({ T, t, cal, x: M, y: 204, w: W - M * 2, h: 54, labelSize: 10 });
  return svgDoc({ w: W, h: H, title: activityAlt(cal), style: HALO, defs: s.defs + T.defs(), body });
}

function statCells(facts, nums) {
  return [
    [fmt(nums.commits), 'COMMITS ON MAIN'],
    [fmt(nums.mergedPrs), 'MERGED PULL REQUESTS'],
    [fmt(facts.jobbliggaren.testsPassing.value), `TESTS PASSING, ${facts.jobbliggaren.testsPassing.asOf}`],
    [fmt(nums.decisions), 'PUBLISHED DECISION RECORDS'],
  ];
}

const statsAlt = (cells, today) =>
  `Jobbliggaren in numbers, read ${today}: ` + cells.map(([n, label]) => `${n} ${label.toLowerCase()}`).join('; ') + '.';

function statsWide(t, cells, today) {
  const W = 846;
  const H = 140;
  const T = createText();
  const s = sheet({ w: W, h: H, t, fade: false });
  let body = s.body;
  body += T.draw('JOBBLIGGAREN, MEASURED', { x: 40, y: 46, font: 'mono-700', size: 10, fill: t.accent, tracking: 1.8 });
  body += T.draw(`github.com/${REPO}, read ${today}`, { x: W - 40, y: 46, font: 'mono-400', size: 9.6, fill: t.muted, anchor: 'end' });
  const cw = (W - 80) / cells.length;
  cells.forEach(([num, label], i) => {
    const x = 40 + i * cw;
    if (i > 0) body += `<line x1="${r(x) - 0.5}" y1="62" x2="${r(x) - 0.5}" y2="${H - 26}" stroke="${t.line}"/>`;
    body += T.draw(num, { x: x + (i === 0 ? -1 : 15), y: 92, font: 'sans-800', size: 32, fill: t.ink, tracking: -0.5 });
    body += T.draw(label, { x: x + (i === 0 ? 1 : 17), y: 112, font: 'mono-500', size: 10, fill: t.muted, tracking: 0.4 });
  });
  return svgDoc({ w: W, h: H, title: statsAlt(cells, today), defs: s.defs + T.defs(), body });
}

function statsNarrow(t, cells, today) {
  const W = 330;
  const M = 20;
  const H = 232;
  const T = createText();
  const s = sheet({ w: W, h: H, t, inset: 8, fade: false });
  let body = s.body;
  body += T.draw('JOBBLIGGAREN, MEASURED', { x: M, y: 38, font: 'mono-700', size: 10, fill: t.accent, tracking: 1.6 });
  cells.forEach(([num, label], i) => {
    const x = M + (i % 2) * 148;
    const y = 82 + Math.floor(i / 2) * 74;
    body += T.draw(num, { x: x - 1, y, font: 'sans-800', size: 30, fill: t.ink, tracking: -0.5 });
    T.wrap(label, { font: 'mono-500', size: 10, tracking: 0.5 }, 136).forEach((line, k) => {
      body += T.draw(line, { x, y: y + 16 + k * 12.5, font: 'mono-500', size: 10, fill: t.muted, tracking: 0.5 });
    });
  });
  body += T.draw(`read ${today}`, { x: W - M, y: 38, font: 'mono-400', size: 9.6, fill: t.muted, anchor: 'end' });
  return svgDoc({ w: W, h: H, title: statsAlt(cells, today), defs: s.defs + T.defs(), body });
}

function activityMedium(t, cal) {
  const W = 580;
  const M = 28;
  const H = 176;
  const T = createText();
  const s = sheet({ w: W, h: H, t, inset: 10, fade: false });
  let body = s.body;
  body += T.draw('FIG. 2', { x: M, y: 46, font: 'mono-700', size: 10.5, fill: t.accent, tracking: 2 });
  body += T.draw(ACTIVITY_TITLE, { x: M + 60, y: 47, font: 'sans-600', size: 15.5, fill: t.ink });
  body += T.draw(fmt(cal.total), { x: M - 2, y: 110, font: 'sans-800', size: 38, fill: t.ink, tracking: -0.6 });
  body += T.draw('CONTRIBUTIONS', { x: M, y: 128, font: 'mono-500', size: 9.6, fill: t.muted, tracking: 1.1 });
  body += stat(T, t, { x: 168, y: 90, value: `${cal.activeDays}`, caption: `ACTIVE DAYS OF ${cal.dayCount}`, size: 15, captionSize: 9.6 });
  body += stat(T, t, { x: 168, y: 126, value: `${cal.longestStreak}`, caption: 'DAYS, LONGEST RUN', size: 15, captionSize: 9.6 });
  body += bars({ T, t, cal, x: 312, y: 122, w: W - M - 312, h: 46, labelSize: 9.6 });
  body += T.draw(`to ${cal.until}`, { x: W - M, y: H - 22, font: 'mono-400', size: 9.6, fill: t.muted, anchor: 'end' });
  return svgDoc({ w: W, h: H, title: activityAlt(cal), style: HALO, defs: s.defs + T.defs(), body });
}

function statsMedium(t, cells, today) {
  const W = 580;
  const M = 28;
  const H = 156;
  const T = createText();
  const s = sheet({ w: W, h: H, t, inset: 10, fade: false });
  let body = s.body;
  body += T.draw('JOBBLIGGAREN, MEASURED', { x: M, y: 44, font: 'mono-700', size: 10, fill: t.accent, tracking: 1.8 });
  body += T.draw(`read ${today}`, { x: W - M, y: 44, font: 'mono-400', size: 9.6, fill: t.muted, anchor: 'end' });
  const cw = (W - M * 2) / cells.length;
  cells.forEach(([num, label], i) => {
    const x = M + i * cw;
    if (i > 0) body += `<line x1="${r(x) - 0.5}" y1="60" x2="${r(x) - 0.5}" y2="${H - 26}" stroke="${t.line}"/>`;
    body += T.draw(num, { x: x + (i === 0 ? -1 : 11), y: 90, font: 'sans-800', size: 27, fill: t.ink, tracking: -0.4 });
    T.wrap(label, { font: 'mono-500', size: 9.6, tracking: 0.4 }, cw - 16).forEach((line, k) => {
      body += T.draw(line, { x: x + (i === 0 ? 1 : 13), y: 108 + k * 12.5, font: 'mono-500', size: 9.6, fill: t.muted, tracking: 0.4 });
    });
  });
  return svgDoc({ w: W, h: H, title: statsAlt(cells, today), defs: s.defs + T.defs(), body });
}

// ---------- main ----------

const facts = JSON.parse(fs.readFileSync(path.join(root, 'content', 'facts.json'), 'utf8'));
const [cal, nums] = await Promise.all([calendar(), repoNumbers()]);
const today = new Date().toISOString().slice(0, 10);
const cells = statCells(facts, nums);

const files = {};
for (const theme of THEMES) {
  const t = tokens.themes[theme];
  files[`activity-wide-${theme}.svg`] = activityWide(t, cal);
  files[`activity-medium-${theme}.svg`] = activityMedium(t, cal);
  files[`activity-narrow-${theme}.svg`] = activityNarrow(t, cal);
  files[`jobbliggaren-stats-wide-${theme}.svg`] = statsWide(t, cells, today);
  files[`jobbliggaren-stats-medium-${theme}.svg`] = statsMedium(t, cells, today);
  files[`jobbliggaren-stats-narrow-${theme}.svg`] = statsNarrow(t, cells, today);
}
fs.mkdirSync(outDir, { recursive: true });
for (const [name, svg] of Object.entries(files)) fs.writeFileSync(path.join(outDir, name), svg);
console.log(
  `contributions ${cal.total}, active days ${cal.activeDays}/${cal.dayCount}, streak ${cal.longestStreak}; ` +
    `commits ${nums.commits}, merged PRs ${nums.mergedPrs}, decision records ${nums.decisions}; wrote ${Object.keys(files).length} files`,
);
