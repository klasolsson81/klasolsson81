// The hero: a drawing sheet with the name, a typed line, an exploded view of
// the stack, and a title block carrying the facts a visitor needs first.
//
// Wide is drawn for the 846 px desktop column. Narrow is drawn on a 330-unit
// canvas for a ~309 px phone column, so its type is read at close to 1:1.
import { svgDoc, sheet, r } from '../lib/svg.mjs';
import { createText } from '../lib/text.mjs';

const KICKER = 'FULL-STACK DEVELOPER';
const NAME = 'Klas Olsson';
const SUB = '.NET, C#, React and the infrastructure underneath.';
const LINES_WIDE = [
  'I build products and run them in production.',
  'From database schema to a self-hosted server.',
  '20+ years in manufacturing. Now software.',
];
const LINES_NARROW = ['I build products and run them.', 'From schema to server.', 'Manufacturing first. Now software.'];
// Bottom to top, the order the highlight climbs.
const STACK = [
  ['HOST', 'Linux VPS · Docker'],
  ['DATA', 'PostgreSQL · Redis'],
  ['API', '.NET 10 · C#'],
  ['WEB', 'Next.js · React'],
];
const TITLE_BLOCK = [
  ['LOCATION', 'Göteborg, Sweden'],
  ['NOW', 'Tech lead (internship), Yobber'],
  ['BACKGROUND', '20+ yrs manufacturing'],
  ['STATUS', 'Open to roles & consulting'],
];
const ALT =
  'Klas Olsson. Full-stack developer in Göteborg, Sweden: .NET, C#, React and the infrastructure underneath. ' +
  'Now: technical lead on internship at Yobber. Background: more than 20 years in manufacturing. Open to developer roles and consulting.';

// Nothing here fades content in: every frame shows the whole drawing. Every
// loop has a finite count and ends in the still state after about 45 seconds.
const BASE_CSS =
  '.grid{animation:fade 1.2s ease both}@keyframes fade{from{opacity:0}}' +
  '.hl{opacity:0;animation:hl 8s linear 6}.hl.rest{opacity:.34}@keyframes hl{0%{opacity:0}5%{opacity:.34}19%{opacity:.34}26%,100%{opacity:0}}' +
  '.axis{animation:flow 3.2s linear 14}@keyframes flow{to{stroke-dashoffset:-14.5}}' +
  '.halo{animation:halo 6s ease-out 8}@keyframes halo{0%{opacity:.5;transform:scale(1)}30%,100%{opacity:0;transform:scale(2.6)}}' +
  '.caret{animation:blink 1.2s steps(1,end) 38}@keyframes blink{50%{opacity:0}}';

/** A console line that types each sentence in turn and holds it. Still state: the first sentence, fully typed. */
function typedLine({ T, t, x, y, w, h, size, id, lines }) {
  const slot = 7.5; // seconds per sentence: about 1.6 typing, 5.4 held, 0.5 fading
  const period = slot * lines.length;
  const adv = T.measure('M', { font: 'mono-500', size });
  const pad = 12;
  const tx = x + pad + adv * 2;
  const base = y + h / 2 + T.capHeight('mono-500', size) / 2;
  const typePct = r((1.6 / period) * 100);
  const showEnd = r(((slot - 0.5) / period) * 100);

  let css = `@keyframes show${id}{0%,${showEnd}%{opacity:1}${r(showEnd + 1.6)}%,100%{opacity:0}}`;
  let body =
    `<rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="4" fill="${t.surface}" stroke="${t.line}"/>` +
    T.draw('>', { x: x + pad, y: base, font: 'mono-700', size, fill: t.accent }) +
    `<g clip-path="url(#${id}clip)">`;

  lines.forEach((line, i) => {
    const n = [...line].length;
    const W = r(n * adv);
    css +=
      `.${id}l${i}{opacity:${i === 0 ? 1 : 0};animation:show${id} ${period}s linear ${r(i * slot)}s 2}` +
      `.${id}c${i}{transform:translateX(${W}px);animation:${id}t${i} ${period}s linear ${r(i * slot)}s 2}` +
      `@keyframes ${id}t${i}{0%{transform:translateX(0);animation-timing-function:steps(${n},end)}${typePct}%,100%{transform:translateX(${W}px)}}`;
    body +=
      `<g class="${id}l${i}">` +
      T.draw(line, { x: tx, y: base, font: 'mono-500', size, fill: t.ink }) +
      `<g class="${id}c${i}">` +
      `<rect x="${r(tx - 1)}" y="${y + 2}" width="${w}" height="${h - 4}" fill="${t.surface}"/>` +
      `<rect class="caret" x="${r(tx + 2)}" y="${r(base - size * 0.9)}" width="${r(adv * 0.82)}" height="${r(size * 1.18)}" fill="${t.accent}"/>` +
      `</g></g>`;
  });
  body += '</g>';
  const defs = `<clipPath id="${id}clip"><rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${h - 2}" rx="3"/></clipPath>`;
  return { css, body, defs };
}

/** Exploded isometric view of the stack, dimensioned like an assembly drawing. */
function stackDrawing({ T, t, cx, top, a, b, th, gap, labelX, tagSize, valueSize }) {
  const n = STACK.length;
  const cyOf = (i) => top + gap * (n - 1 - i); // i = 0 is the bottom plate
  const bottom = cyOf(0) + b + th;
  let body = '';

  // Centre line first, so it only shows in the gaps between plates.
  body += `<line class="axis" x1="${cx}" y1="${top - b - 14}" x2="${cx}" y2="${bottom + 14}" stroke="${t.muted}" stroke-width=".9" stroke-dasharray="7 3 1.5 3"/>`;

  STACK.forEach(([tag, value], i) => {
    const cy = cyOf(i);
    const topFace = `${cx},${cy - b} ${cx + a},${cy} ${cx},${cy + b} ${cx - a},${cy}`;
    body +=
      `<polygon points="${cx - a},${cy} ${cx},${cy + b} ${cx},${cy + b + th} ${cx - a},${cy + th}" fill="${t.raise}" stroke="${t.inkSoft}" stroke-width="1.1" stroke-linejoin="round"/>` +
      `<polygon points="${cx + a},${cy} ${cx},${cy + b} ${cx},${cy + b + th} ${cx + a},${cy + th}" fill="${t.surface}" stroke="${t.inkSoft}" stroke-width="1.1" stroke-linejoin="round"/>` +
      `<polygon points="${topFace}" fill="${t.surface}" stroke="${t.inkSoft}" stroke-width="1.1" stroke-linejoin="round"/>` +
      `<polygon class="hl${i === n - 1 ? ' rest' : ''}" style="animation-delay:${r(i * 2)}s" points="${topFace}" fill="${t.accent}"/>` +
      `<line x1="${cx + a + 5}" y1="${cy}" x2="${labelX - 8}" y2="${cy}" stroke="${t.muted}" stroke-width=".9"/>` +
      `<circle cx="${cx + a + 5}" cy="${cy}" r="2" fill="${t.accent}"/>` +
      T.draw(tag, { x: labelX, y: cy - 4, font: 'mono-700', size: tagSize, fill: t.accent, tracking: 1.4 }) +
      T.draw(value, { x: labelX, y: cy + valueSize, font: 'mono-500', size: valueSize, fill: t.ink });
  });

  // Dimension line down the left side: the whole assembly measures "FULL STACK".
  const dx = cx - a - 16;
  const y1 = cyOf(n - 1);
  const y2 = cyOf(0) + th;
  const arrow = (y, dir) => `<path d="M${dx} ${y}l-3 ${6 * dir}h6z" fill="${t.muted}"/>`;
  const label = 'FULL STACK';
  const lw = T.measure(label, { font: 'mono-500', size: tagSize, tracking: 1.6 });
  const mid = (y1 + y2) / 2;
  body +=
    `<path d="M${cx - a - 4} ${y1}H${dx - 5}M${cx - a - 4} ${y2}H${dx - 5}" stroke="${t.muted}" stroke-width=".9"/>` +
    `<path d="M${dx} ${y1 + 5}V${r(mid - lw / 2 - 6)}M${dx} ${r(mid + lw / 2 + 6)}V${y2 - 5}" stroke="${t.muted}" stroke-width=".9"/>` +
    arrow(y1, 1) +
    arrow(y2, -1) +
    `<g transform="rotate(-90 ${dx} ${mid})">` +
    T.draw(label, { x: dx, y: mid + T.capHeight('mono-500', tagSize) / 2, font: 'mono-500', size: tagSize, fill: t.muted, anchor: 'middle', tracking: 1.6 }) +
    `</g>`;
  return body;
}

function statusDot(t, x, y) {
  return (
    `<circle class="halo" cx="${x}" cy="${y}" r="3.6" fill="${t.ok}" style="transform-origin:${x}px ${y}px"/>` +
    `<circle cx="${x}" cy="${y}" r="3.6" fill="${t.ok}"/>`
  );
}

export function heroWide(theme, t) {
  const W = 846;
  const H = 324;
  const T = createText();
  const s = sheet({ w: W, h: H, t });
  const typed = typedLine({ T, t, x: 40, y: 182, w: 440, h: 36, size: 13, id: 'w', lines: LINES_WIDE });

  let body = s.body;
  body += T.draw(KICKER, { x: 41, y: 62, font: 'mono-700', size: 11, fill: t.accent, tracking: 2.4 });
  body += T.draw(NAME, { x: 38, y: 126, font: 'sans-800', size: 64, fill: t.ink, tracking: -1.2 });
  body += T.draw(SUB, { x: 40, y: 158, font: 'sans-500', size: 17, fill: t.inkSoft });
  body += typed.body;
  body += stackDrawing({ T, t, cx: 590, top: 64, a: 62, b: 31, th: 8, gap: 40, labelX: 678, tagSize: 9.5, valueSize: 11.4 });

  // Title block.
  const tb = { x: 40, y: 252, h: 50, widths: [135, 236, 172, 223] };
  const total = tb.widths.reduce((p, c) => p + c, 0);
  body += `<rect x="${tb.x + 0.5}" y="${tb.y + 0.5}" width="${total - 1}" height="${tb.h - 1}" fill="${t.surface}" stroke="${t.line}"/>`;
  let cx = tb.x;
  TITLE_BLOCK.forEach(([label, value], i) => {
    if (i > 0) body += `<line x1="${cx + 0.5}" y1="${tb.y}" x2="${cx + 0.5}" y2="${tb.y + tb.h}" stroke="${t.line}"/>`;
    body += T.draw(label, { x: cx + 12, y: tb.y + 19, font: 'mono-500', size: 9.5, fill: t.muted, tracking: 1.3 });
    const isStatus = label === 'STATUS';
    if (isStatus) body += statusDot(t, cx + 16, tb.y + 34.5);
    body += T.draw(value, { x: cx + (isStatus ? 26 : 12), y: tb.y + 39, font: 'mono-500', size: 11.6, fill: t.ink });
    cx += tb.widths[i];
  });

  return svgDoc({ w: W, h: H, title: ALT, style: BASE_CSS + typed.css, defs: s.defs + typed.defs + T.defs(), body });
}

export function heroNarrow(theme, t) {
  const W = 330;
  const M = 20;
  const T = createText();
  const typed = typedLine({ T, t, x: M, y: 162, w: W - M * 2, h: 36, size: 11.6, id: 'n', lines: LINES_NARROW });

  let body = '';
  body += T.draw(KICKER, { x: M + 1, y: 44, font: 'mono-700', size: 11, fill: t.accent, tracking: 2.2 });
  body += T.draw(NAME, { x: M - 2, y: 92, font: 'sans-800', size: 47, fill: t.ink, tracking: -0.9 });
  const subOpts = { font: 'sans-500', size: 15.5, fill: t.inkSoft };
  T.wrap(SUB, subOpts, W - M * 2).forEach((line, i) => {
    body += T.draw(line, { ...subOpts, x: M, y: 120 + i * 21 });
  });
  body += typed.body;
  body += stackDrawing({ T, t, cx: 90, top: 244, a: 50, b: 25, th: 7, gap: 34, labelX: 160, tagSize: 10, valueSize: 12.4 });

  // Title block as rows; the background row is left to the typed line and the page text.
  const rows = TITLE_BLOCK.filter(([label]) => label !== 'BACKGROUND');
  const rowH = 42;
  const y0 = 400;
  body += `<rect x="${M + 0.5}" y="${y0 + 0.5}" width="${W - M * 2 - 1}" height="${rowH * rows.length - 1}" fill="${t.surface}" stroke="${t.line}"/>`;
  rows.forEach(([label, value], i) => {
    const y = y0 + i * rowH;
    if (i > 0) body += `<line x1="${M}" y1="${y + 0.5}" x2="${W - M}" y2="${y + 0.5}" stroke="${t.line}"/>`;
    body += T.draw(label, { x: M + 12, y: y + 16, font: 'mono-500', size: 9.6, fill: t.muted, tracking: 1.3 });
    const isStatus = label === 'STATUS';
    if (isStatus) body += statusDot(t, M + 16, y + 28.5);
    body += T.draw(value, { x: M + (isStatus ? 27 : 12), y: y + 33, font: 'mono-500', size: 12.6, fill: t.ink });
  });
  const H = y0 + rowH * rows.length + M;
  const s = sheet({ w: W, h: H, t, inset: 8 });

  return svgDoc({ w: W, h: H, title: ALT, style: BASE_CSS + typed.css, defs: s.defs + typed.defs + T.defs(), body: s.body + body });
}

/** For columns between a phone and the full desktop width (about 500 to 650 px). */
export function heroMedium(theme, t) {
  const W = 580;
  const M = 28;
  const T = createText();
  const typed = typedLine({ T, t, x: M, y: 156, w: W - M * 2, h: 36, size: 13, id: 'm', lines: LINES_WIDE });

  let body = '';
  body += T.draw(KICKER, { x: M + 1, y: 50, font: 'mono-700', size: 11, fill: t.accent, tracking: 2.4 });
  body += T.draw(NAME, { x: M - 2, y: 106, font: 'sans-800', size: 56, fill: t.ink, tracking: -1.1 });
  body += T.draw(SUB, { x: M, y: 136, font: 'sans-500', size: 16.5, fill: t.inkSoft });
  body += typed.body;
  body += stackDrawing({ T, t, cx: 208, top: 250, a: 54, b: 27, th: 7, gap: 36, labelX: 284, tagSize: 10, valueSize: 12.4 });

  // Title block as a two-by-two grid.
  const cw = (W - M * 2) / 2;
  const rowH = 44;
  const y0 = 416;
  body += `<rect x="${M + 0.5}" y="${y0 + 0.5}" width="${W - M * 2 - 1}" height="${rowH * 2 - 1}" fill="${t.surface}" stroke="${t.line}"/>`;
  body += `<line x1="${M}" y1="${y0 + rowH + 0.5}" x2="${W - M}" y2="${y0 + rowH + 0.5}" stroke="${t.line}"/>`;
  body += `<line x1="${M + cw + 0.5}" y1="${y0}" x2="${M + cw + 0.5}" y2="${y0 + rowH * 2}" stroke="${t.line}"/>`;
  TITLE_BLOCK.forEach(([label, value], i) => {
    const x = M + (i % 2) * cw;
    const y = y0 + Math.floor(i / 2) * rowH;
    body += T.draw(label, { x: x + 12, y: y + 17, font: 'mono-500', size: 9.6, fill: t.muted, tracking: 1.3 });
    const isStatus = label === 'STATUS';
    if (isStatus) body += statusDot(t, x + 16, y + 30);
    body += T.draw(value, { x: x + (isStatus ? 27 : 12), y: y + 34.5, font: 'mono-500', size: 12.2, fill: t.ink });
  });
  const H = y0 + rowH * 2 + M;
  const s = sheet({ w: W, h: H, t, inset: 10 });

  return svgDoc({ w: W, h: H, title: ALT, style: BASE_CSS + typed.css, defs: s.defs + typed.defs + T.defs(), body: s.body + body });
}
