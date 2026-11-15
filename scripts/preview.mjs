// Dev helper: renders README.md with GitHub's own Markdown engine and wraps
// it the way the profile page does (column width, font size, themes), so the
// page can be judged before anything is pushed.
// usage: [GH_TOKEN=...] node scripts/preview.mjs   ->  .work/preview/index.html
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { root } from './lib/svg.mjs';

const md = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const res = await fetch('https://api.github.com/markdown', {
  method: 'POST',
  headers: {
    accept: 'application/vnd.github+json',
    'user-agent': 'profile-preview',
    ...(token ? { authorization: `bearer ${token}` } : {}),
  },
  body: JSON.stringify({ text: md, mode: 'gfm', context: 'klasolsson81/klasolsson81' }),
});
if (!res.ok) throw new Error(`markdown API: HTTP ${res.status}`);
let html = await res.text();

// Point images at local files: repo-relative assets, and the daily images
// (published on the `generated` branch) at the local render in .work/live.
const fileUrl = (rel) => pathToFileURL(path.join(root, rel)).href;
const RAW = 'https://raw.githubusercontent.com/klasolsson81/klasolsson81/generated/';
html = html
  .replace(/(src|srcset)="(?:https:\/\/github\.com\/klasolsson81\/klasolsson81\/(?:raw|blob)\/[^/"]+\/)?(assets\/[^"]+)"/g, (_, attr, rel) => `${attr}="${fileUrl(rel)}"`)
  .replaceAll(RAW, fileUrl('.work/live') + '/');

const css = fs.readFileSync(path.join(root, 'node_modules', 'github-markdown-css', 'github-markdown.css'), 'utf8');
const page = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>${css}
:root{color-scheme:light dark}
body{margin:0;background:#fff}
@media (prefers-color-scheme:dark){body{background:#0d1117}}
/* GitHub hides links that end in a mode-only fragment when the other theme is active. */
@media (prefers-color-scheme:light){a[href$="#gh-dark-mode-only"]{display:none!important}}
@media (prefers-color-scheme:dark){a[href$="#gh-light-mode-only"]{display:none!important}}
/* The profile page: an 846 px column on desktop, viewport minus 82 px on a phone, 14 px text. */
.markdown-body{box-sizing:border-box;width:min(846px,calc(100vw - 82px));margin:24px auto;font-size:14px}
</style></head><body><article class="markdown-body">${html}</article></body></html>`;

const out = path.join(root, '.work', 'preview', 'index.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, page);
console.log('wrote', path.relative(root, out));
