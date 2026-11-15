// Guards the things this README promises: no third-party image hosts, alt
// text on every image, a dark and a light file for every drawing, a narrow
// file for every image a phone gets, files that exist and stay within their
// weight budget, SVGs with nothing in them that GitHub or a browser would
// refuse, and readable contrast.
// usage: node scripts/check.mjs [--links]     (--links also requests every URL)
import fs from 'node:fs';
import path from 'node:path';
import { root, tokens } from './lib/svg.mjs';

const md = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const errors = [];
const fail = (msg) => errors.push(msg);

const OWN_RAW = 'https://raw.githubusercontent.com/klasolsson81/klasolsson81/generated/';
const BUDGET_KB = { svg: 70, webp: 220 };
const TOTAL_KB = 1024;
const WIDE = 'min-width: 1240px';
const MEDIUM = 'min-width: 880px';

// ---- images in the README ----
const tags = [...md.matchAll(/<(img|source)\b[^>]*>/g)].map((m) => m[0]);
const attr = (tag, name) => new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1];
const local = new Set();
for (const tag of tags) {
  const url = attr(tag, 'src') ?? attr(tag, 'srcset');
  if (!url) fail(`no src/srcset: ${tag}`);
  else if (/^https?:/.test(url)) {
    if (!url.startsWith(OWN_RAW)) fail(`image from another host: ${url}`);
  } else local.add(url);
  if (tag.startsWith('<img')) {
    const alt = attr(tag, 'alt');
    if (!alt || alt.trim().length < 3) fail(`missing alt text: ${tag.slice(0, 90)}`);
    if (/\bheight=/.test(tag)) fail(`height attribute distorts images inside <picture>: ${tag.slice(0, 90)}`);
  }
  const media = attr(tag, 'media') ?? '';
  // GitHub rewrites the media of themed sources and drops any width condition with it.
  if (/prefers-color-scheme/.test(media) && /min-width/.test(media)) fail(`a source switches on theme and width at once: ${tag.slice(0, 110)}`);
}
if (/!\[[^\]]*\]\(/.test(md)) fail('Markdown image syntax found; use <img> so every image carries width and alt');

// ---- pictures: what each one switches on must be complete ----
const pictures = md.match(/<picture>[\s\S]*?<\/picture>/g) ?? [];
for (const pic of pictures) {
  const all = pic.replace(/\s+/g, ' ');
  if (/prefers-color-scheme/.test(all)) {
    if (!/prefers-color-scheme: dark/.test(all)) fail(`picture without a dark source: ${all.slice(0, 100)}`);
    if (!/-light\.svg/.test(all)) fail(`picture without a light image: ${all.slice(0, 100)}`);
  } else {
    if (!all.includes(WIDE)) fail(`picture without a (${WIDE}) source: ${all.slice(0, 100)}`);
    if (!all.includes(MEDIUM) || !/-medium/.test(all)) fail(`picture without a medium file from (${MEDIUM}): ${all.slice(0, 100)}`);
    if (!/<img[^>]*-narrow/.test(all)) fail(`picture whose fallback is not the narrow file: ${all.slice(0, 100)}`);
  }
}

// ---- drawings that follow the theme by link fragment come in pairs ----
const darkLinks = [...md.matchAll(/href="([^"]+)#gh-dark-mode-only"/g)].map((m) => m[1]);
const lightLinks = new Set([...md.matchAll(/href="([^"]+)#gh-light-mode-only"/g)].map((m) => m[1]));
for (const href of darkLinks) {
  if (!lightLinks.has(href.replace('-dark', '-light'))) fail(`no light counterpart for ${href}`);
}
if (darkLinks.length !== lightLinks.size) fail(`${darkLinks.length} dark-only links but ${lightLinks.size} light-only links`);

// ---- local files: present, within budget, clean ----
const sizeKb = (rel) => (fs.existsSync(path.join(root, rel)) ? fs.statSync(path.join(root, rel)).size / 1024 : 0);
for (const rel of local) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) {
    fail(`missing file: ${rel}`);
    continue;
  }
  const kb = sizeKb(rel);
  const ext = path.extname(rel).slice(1);
  if (BUDGET_KB[ext] && kb > BUDGET_KB[ext]) fail(`${rel} is ${kb.toFixed(0)} KB, over the ${BUDGET_KB[ext]} KB budget`);
  if (ext === 'svg') {
    const svg = fs.readFileSync(file, 'utf8');
    for (const [what, re] of [
      ['a script', /<script/i],
      ['foreignObject', /<foreignObject/i],
      ['an external reference', /(?:href|src)="https?:/i],
      ['an @import', /@import/i],
      ['an embedded font', /@font-face/i],
      ['a <text> element (text must be outlined)', /<text\b/i],
      ['an animation that never ends', /animation:[^;}]*\binfinite\b/],
    ]) {
      if (re.test(svg)) fail(`${rel} contains ${what}`);
    }
    if (/animation:/.test(svg) && !/prefers-reduced-motion/.test(svg)) fail(`${rel} animates without a reduced-motion rule`);
    if (!/<title>[^<]{10,}/.test(svg)) fail(`${rel} has no descriptive <title>`);
  }
}
// A visitor loads one file per picture (the browser fetches hidden theme twins too), so sum the largest candidate of each.
let perVisit = 0;
for (const pic of pictures) {
  const urls = [...pic.matchAll(/(?:src|srcset)="([^"]+)"/g)].map((m) => m[1]).filter((u) => !/^https?:/.test(u));
  perVisit += Math.max(0, ...urls.map(sizeKb));
}
if (perVisit > TOTAL_KB) fail(`a visit loads about ${perVisit.toFixed(0)} KB of local images, over ${TOTAL_KB} KB`);

// ---- contrast (WCAG) of every text colour on every surface it sits on ----
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
for (const [name, t] of Object.entries(tokens.themes)) {
  for (const fg of ['ink', 'inkSoft', 'muted', 'accent']) {
    for (const bg of ['canvas', 'surface']) {
      const c = ratio(t[fg], t[bg]);
      if (c < 4.5) fail(`${name}: ${fg} on ${bg} is ${c.toFixed(2)}:1, under 4.5:1`);
    }
  }
}

// ---- links ----
if (process.argv.includes('--links')) {
  const urls = new Set([...md.matchAll(/(?:href="|\]\()(https?:\/\/[^")\s#]+)/g)].map((m) => m[1]));
  for (const url of urls) {
    if (url.includes('linkedin.com')) continue; // LinkedIn answers 999 to anything that is not a browser
    try {
      const res = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (profile link check)' } });
      if (!res.ok) fail(`${url} answered ${res.status}`);
    } catch (e) {
      fail(`${url} failed: ${e.message}`);
    }
  }
  console.log(`checked ${urls.size} links`);
}

if (errors.length) {
  console.error(errors.map((e) => `  x ${e}`).join('\n'));
  console.error(`\n${errors.length} problem(s)`);
  process.exit(1);
}
console.log(`ok: ${tags.length} image tags, ${pictures.length} pictures, ${local.size} local files, about ${perVisit.toFixed(0)} KB of local images per visit`);
