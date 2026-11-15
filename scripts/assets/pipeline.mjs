// Fig. 1: how a merge reaches production in Jobbliggaren, drawn as a
// production line. A commit travels the belt and each station lights as it
// passes. Still state: every station lit, the commit at LIVE.
//
// Source for every station: klasolsson81/jobbliggaren, .github/workflows/
// release-images.yml and deploy/systemd/jobbliggaren-reconcile.sh (ADR 0149).
import { svgDoc, sheet, r } from '../lib/svg.mjs';
import { createText } from '../lib/text.mjs';

const STATIONS = [
  { key: 'merge', name: 'MERGE', lines: ['PR, CI, review', 'agents, squash'], short: ['PR, CI,', 'reviewers'] },
  { key: 'build', name: 'BUILD', lines: ['five images', 'from one commit'], short: ['five images'] },
  { key: 'scan', name: 'SCAN', lines: ['Trivy, every', 'image'], short: ['Trivy'] },
  { key: 'attest', name: 'ATTEST', lines: ['build provenance,', 'signed'], short: ['provenance'] },
  { key: 'release', name: 'RELEASE', lines: ['one immutable', 'release record'], short: ['one record'] },
  { key: 'verify', name: 'VERIFY', lines: ['signatures and', 'schema checked'], short: ['signatures,', 'schema'] },
  { key: 'live', name: 'LIVE', lines: ['health-wait,', 'receipt written'], short: ['health-wait'] },
];
const ZONES = [
  { from: 0, to: 0, label: 'MAIN', short: 'MAIN' },
  { from: 1, to: 4, label: 'GITHUB ACTIONS, ON A SCHEDULE', short: 'GITHUB ACTIONS' },
  { from: 5, to: 6, label: 'THE SERVER PULLS, HOURLY', short: 'SERVER PULLS' },
];
const TITLE = 'From merge to production';
const NOTE = 'CI never connects to the server. To roll back, pin an earlier record.';
const NOTE_NARROW = 'To roll back, pin an earlier record.';
const SOURCES = 'ADR 0149 · release-images.yml · jobbliggaren-reconcile.sh';

// 24 x 24 line icons, drawn with the current stroke.
const ICONS = {
  merge: '<circle cx="7.5" cy="6" r="2.3"/><circle cx="7.5" cy="18" r="2.3"/><circle cx="16.5" cy="9" r="2.3"/><path d="M7.5 8.3v7.4M16.5 11.3c0 3.4-9 1.6-9 4.4"/>',
  build: '<path d="M12 3.2l7.6 4.3v9L12 20.8l-7.6-4.3v-9zM4.4 7.5L12 11.8l7.6-4.3M12 11.8v9"/>',
  scan: '<circle cx="10.6" cy="10.6" r="6.2"/><path d="M15.2 15.2l5 5"/>',
  attest: '<path d="M12 3l7 2.8v5.6c0 4.2-2.9 7.6-7 9.4-4.1-1.8-7-5.2-7-9.4V5.8z"/><path d="M8.7 11.9l2.4 2.4 4.3-4.7"/>',
  release: '<path d="M6.5 3h7.2l3.8 3.8V21h-11zM13.7 3v3.8h3.8M9.5 12h5M9.5 16h5"/>',
  verify: '<rect x="4" y="13.5" width="16" height="6.5" rx="1.6"/><path d="M12 3v7.4M9 7.6l3 3 3-3M7.2 16.75h.01"/>',
  live: '<circle cx="12" cy="12" r="4.6"/>',
};

const PERIOD = 12;
const LAPS = 4; // about 48 seconds, then everything rests in the still state
const STEP = 72 / (STATIONS.length - 1); // % of the loop per station
const DWELL = STEP * 0.32;

function css(distance, axis) {
  const move = (d) => `transform:translate${axis}(${r(d)}px)`;
  let run = '';
  STATIONS.forEach((_, i) => {
    const at = i * STEP;
    const d = (distance * i) / (STATIONS.length - 1);
    run += `${r(at)}%{${move(d)};opacity:1}`;
    if (i < STATIONS.length - 1) run += `${r(at + DWELL)}%{${move(d)}}`;
  });
  run += `95%{${move(distance)};opacity:1}98%,100%{${move(distance)};opacity:0}`;
  let lit = '';
  STATIONS.forEach((_, i) => {
    const at = i * STEP + 0.6;
    lit += `.s${i}{animation:on${i} ${PERIOD}s linear ${LAPS}}@keyframes on${i}{0%,${r(Math.max(0.1, at - 0.5))}%{opacity:0}${r(at + 1.2)}%,96%{opacity:1}100%{opacity:0}}`;
  });
  return (
    `.tok{${move(distance)};animation:run ${PERIOD}s linear ${LAPS}}@keyframes run{${run}}` +
    lit +
    `.belt{animation:belt 1.6s linear ${Math.round((PERIOD * LAPS) / 1.6)}}@keyframes belt{to{stroke-dashoffset:-14}}` +
    '.halo{animation:halo 6s ease-out 8}@keyframes halo{0%{opacity:.5;transform:scale(1)}30%,100%{opacity:0;transform:scale(2.5)}}' +
    '.grid{animation:fade 1.2s ease both}@keyframes fade{from{opacity:0}}'
  );
}

/** One station box, centred on (cx, cy): the unlit box, then the lit overlay on top. */
function station(t, s, i, cx, cy) {
  const half = 19;
  const isLive = s.key === 'live';
  const color = isLive ? t.ok : t.accent;
  const box = (stroke, w) =>
    `<rect x="${cx - half}" y="${cy - half}" width="${half * 2}" height="${half * 2}" rx="6" fill="${t.surface}" stroke="${stroke}" stroke-width="${w}"/>`;
  const icon = (stroke, fill = 'none') =>
    `<g transform="translate(${cx - 12} ${cy - 12})" fill="${fill}" stroke="${stroke}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${ICONS[s.key]}</g>`;
  const badge = isLive
    ? `<circle class="halo" cx="${cx}" cy="${cy}" r="4.6" fill="${t.ok}" style="transform-origin:${cx}px ${cy}px"/>`
    : `<circle cx="${cx + half - 1}" cy="${cy - half + 1}" r="6.2" fill="${color}"/><path d="M${cx + half - 3.9} ${cy - half + 1.1}l2 2 3.5-3.9" fill="none" stroke="${t.accentInk}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  return (
    box(t.line, 1) +
    icon(t.muted) +
    `<g class="s${i}">${box(color, 1.5)}${icon(isLive ? t.ok : t.ink, isLive ? t.ok : 'none')}${badge}</g>`
  );
}

function token(t, x, y) {
  return (
    `<g class="tok"><circle cx="${x}" cy="${y}" r="9" fill="${t.accent}" opacity=".22"/>` +
    `<circle cx="${x}" cy="${y}" r="4.6" fill="${t.accent}"/></g>`
  );
}

const ALT =
  'Figure 1, from merge to production in Jobbliggaren. A pull request passes CI and the review agents and is squashed to main. ' +
  'GitHub Actions, on a schedule (an hourly cron, of which GitHub starts a few runs a day): builds five images from one commit, scans each with Trivy, attests build provenance, and seals one immutable release record. ' +
  'The server, hourly: pulls the record, verifies signatures and the database schema, waits for healthy containers and writes a receipt. ' +
  'CI never connects to the server. To roll back, pin an earlier record.';

export function pipelineWide(theme, t) {
  const W = 846;
  const H = 286;
  const T = createText();
  const s = sheet({ w: W, h: H, t });
  const x0 = 80;
  const span = 687;
  const xOf = (i) => r(x0 + (span * i) / (STATIONS.length - 1));
  const cy = 136;

  let body = s.body;
  body += T.draw('FIG. 1', { x: 40, y: 50, font: 'mono-700', size: 10.5, fill: t.accent, tracking: 2 });
  body += T.draw(TITLE, { x: 100, y: 51, font: 'sans-600', size: 16, fill: t.ink });
  body += T.draw(SOURCES, { x: W - 40, y: 50, font: 'mono-400', size: 9.6, fill: t.muted, anchor: 'end' });

  ZONES.forEach((z) => {
    const a = xOf(z.from) - 24;
    const b = xOf(z.to) + 24;
    body += `<path d="M${a} 100v-7H${b}v7" fill="none" stroke="${t.muted}" stroke-width=".9"/>`;
    body += T.draw(z.label, { x: (a + b) / 2, y: 85, font: 'mono-500', size: 9.5, fill: t.muted, anchor: 'middle', tracking: 1.2 });
  });

  body += `<line x1="${x0}" y1="${cy}" x2="${x0 + span}" y2="${cy}" stroke="${t.line}" stroke-width="3"/>`;
  body += `<line class="belt" x1="${x0}" y1="${cy}" x2="${x0 + span}" y2="${cy}" stroke="${t.muted}" stroke-width="1" stroke-dasharray="5 9"/>`;
  body += token(t, x0, cy);

  STATIONS.forEach((st, i) => {
    const cx = xOf(i);
    body += station(t, st, i, cx, cy);
    body += T.draw(st.name, { x: cx, y: 181, font: 'mono-700', size: 10.5, fill: t.ink, anchor: 'middle', tracking: 1.4 });
    st.lines.forEach((line, k) => {
      body += T.draw(line, { x: cx, y: 198 + k * 14, font: 'mono-400', size: 10.4, fill: t.inkSoft, anchor: 'middle' });
    });
  });

  // The one arrow that matters: across the boundary the server pulls.
  const gap = (xOf(4) + xOf(5)) / 2;
  body += T.draw('PULL', { x: gap, y: cy - 10, font: 'mono-700', size: 9.5, fill: t.accent, anchor: 'middle', tracking: 1.4 });
  body += `<path d="M${gap - 12} ${cy + 12}h24M${gap - 12} ${cy + 12}l5-4M${gap - 12} ${cy + 12}l5 4" fill="none" stroke="${t.accent}" stroke-width="1.2" stroke-linecap="round"/>`;

  body += `<line x1="40" y1="${H - 52.5}" x2="${W - 40}" y2="${H - 52.5}" stroke="${t.line}"/>`;
  body += T.draw(NOTE, { x: 40, y: H - 32, font: 'mono-400', size: 10.4, fill: t.inkSoft });

  return svgDoc({ w: W, h: H, title: ALT, style: css(span, 'X'), defs: s.defs + T.defs(), body });
}

export function pipelineNarrow(theme, t) {
  const W = 330;
  const M = 20;
  const row = 62;
  const top = 108;
  const span = row * (STATIONS.length - 1);
  const H = top + span + 82;
  const T = createText();
  const s = sheet({ w: W, h: H, t, inset: 8 });
  const cx = 44;
  const yOf = (i) => top + row * i;

  let body = s.body;
  body += T.draw('FIG. 1', { x: M, y: 40, font: 'mono-700', size: 10.5, fill: t.accent, tracking: 2 });
  body += T.draw(TITLE, { x: M, y: 64, font: 'sans-600', size: 17, fill: t.ink });

  body += `<line x1="${cx}" y1="${top}" x2="${cx}" y2="${top + span}" stroke="${t.line}" stroke-width="3"/>`;
  body += `<line class="belt" x1="${cx}" y1="${top}" x2="${cx}" y2="${top + span}" stroke="${t.muted}" stroke-width="1" stroke-dasharray="5 9"/>`;
  body += token(t, cx, top);

  STATIONS.forEach((st, i) => {
    const y = yOf(i);
    body += station(t, st, i, cx, y);
    body += T.draw(st.name, { x: 76, y: y - 5, font: 'mono-700', size: 12, fill: t.ink, tracking: 1.4 });
    body += T.draw(st.lines.join(' '), { x: 76, y: y + 13, font: 'mono-400', size: 11.4, fill: t.inkSoft });
  });

  // Brackets down the right edge show which stations each zone spans.
  const bx = W - 22;
  ZONES.forEach((z) => {
    const y1 = yOf(z.from) - 19;
    const y2 = yOf(z.to) + 19;
    const mid = (y1 + y2) / 2;
    body += `<path d="M${bx - 6} ${y1}H${bx}V${y2}H${bx - 6}" fill="none" stroke="${t.muted}" stroke-width=".9"/>`;
    body +=
      `<g transform="rotate(90 ${bx + 9} ${mid})">` +
      T.draw(z.short, { x: bx + 9, y: mid + T.capHeight('mono-500', 10) / 2, font: 'mono-500', size: 10, fill: t.muted, anchor: 'middle', tracking: 1 }) +
      `</g>`;
  });

  const noteY = top + span + 50;
  body += `<line x1="${M}" y1="${noteY - 20.5}" x2="${W - M}" y2="${noteY - 20.5}" stroke="${t.line}"/>`;
  body += T.draw(NOTE_NARROW, { x: M, y: noteY, font: 'mono-400', size: 11.4, fill: t.inkSoft });

  return svgDoc({ w: W, h: H, title: ALT, style: css(span, 'Y'), defs: s.defs + T.defs(), body });
}

/** For columns between a phone and the full desktop width: the wide layout with shorter labels. */
export function pipelineMedium(theme, t) {
  const W = 580;
  const H = 276;
  const M = 28;
  const T = createText();
  const s = sheet({ w: W, h: H, t, inset: 10 });
  const x0 = 54;
  const span = W - x0 * 2;
  const xOf = (i) => r(x0 + (span * i) / (STATIONS.length - 1));
  const cy = 132;

  let body = s.body;
  body += T.draw('FIG. 1', { x: M, y: 46, font: 'mono-700', size: 10.5, fill: t.accent, tracking: 2 });
  body += T.draw(TITLE, { x: M + 60, y: 47, font: 'sans-600', size: 16, fill: t.ink });

  ZONES.forEach((z) => {
    const a = xOf(z.from) - 23;
    const b = xOf(z.to) + 23;
    body += `<path d="M${a} 98v-7H${b}v7" fill="none" stroke="${t.muted}" stroke-width=".9"/>`;
    body += T.draw(z.short, { x: (a + b) / 2, y: 83, font: 'mono-500', size: 9.6, fill: t.muted, anchor: 'middle', tracking: 1 });
  });

  body += `<line x1="${x0}" y1="${cy}" x2="${x0 + span}" y2="${cy}" stroke="${t.line}" stroke-width="3"/>`;
  body += `<line class="belt" x1="${x0}" y1="${cy}" x2="${x0 + span}" y2="${cy}" stroke="${t.muted}" stroke-width="1" stroke-dasharray="5 9"/>`;
  body += token(t, x0, cy);

  STATIONS.forEach((st, i) => {
    const cx = xOf(i);
    body += station(t, st, i, cx, cy);
    body += T.draw(st.name, { x: cx, y: 176, font: 'mono-700', size: 10, fill: t.ink, anchor: 'middle', tracking: 1.1 });
    st.short.forEach((line, k) => {
      body += T.draw(line, { x: cx, y: 192 + k * 13.5, font: 'mono-400', size: 10, fill: t.inkSoft, anchor: 'middle' });
    });
  });

  body += `<line x1="${M}" y1="${H - 50.5}" x2="${W - M}" y2="${H - 50.5}" stroke="${t.line}"/>`;
  body += T.draw(NOTE, { x: M, y: H - 30, font: 'mono-400', size: 10.2, fill: t.inkSoft });

  return svgDoc({ w: W, h: H, title: ALT, style: css(span, 'X'), defs: s.defs + T.defs(), body });
}
