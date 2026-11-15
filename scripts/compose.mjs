// Composes the project showcase images: real screenshots set in a browser or
// phone frame on the project's own colours, with drafting-style callouts.
// Source screenshots live in .work/shots/ (not committed; see CLAUDE.md).
// usage: node scripts/compose.mjs [id ...]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { root } from './lib/svg.mjs';
import { SHOWCASES } from './showcases.mjs';

const fileUrl = (rel) => pathToFileURL(path.join(root, rel)).href;
const font = (pkg, file) => fileUrl(`node_modules/@fontsource/${pkg}/files/${file}`);

const CSS = `
@font-face{font-family:Mona;font-weight:600;src:url(${font('mona-sans', 'mona-sans-latin-600-normal.woff2')})}
@font-face{font-family:Mona;font-weight:800;src:url(${font('mona-sans', 'mona-sans-latin-800-normal.woff2')})}
@font-face{font-family:JBM;font-weight:500;src:url(${font('jetbrains-mono', 'jetbrains-mono-latin-500-normal.woff2')})}
@font-face{font-family:JBM;font-weight:700;src:url(${font('jetbrains-mono', 'jetbrains-mono-latin-700-normal.woff2')})}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:transparent}
.stage{position:relative;overflow:hidden;border-radius:10px}
.grid{position:absolute;inset:0;background-image:
  linear-gradient(rgba(255,255,255,.055) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.055) 1px,transparent 1px),
  linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px);
  background-size:60px 60px,60px 60px,12px 12px,12px 12px;background-position:14px 14px}
.sheet{position:absolute;inset:14px;border:1px solid rgba(255,255,255,.16)}
.label{position:absolute;left:30px;top:26px;font:700 10px JBM;letter-spacing:.2em;color:rgba(255,255,255,.76)}
.label b{color:var(--accent);font-weight:700}
.browser{position:absolute;border-radius:9px;overflow:hidden;background:#fff;
  box-shadow:0 22px 60px rgba(0,0,0,.42),0 2px 8px rgba(0,0,0,.3),0 0 0 1px rgba(255,255,255,.14)}
.bar{height:24px;background:#161d29;display:flex;align-items:center;gap:6px;padding:0 10px}
.bar i{flex:none;width:8px;height:8px;border-radius:50%;background:#394355}
.bar span{margin-left:8px;font:500 9.5px JBM;color:#a9b5c7;background:#0d131d;padding:3px 10px;border-radius:5px;white-space:nowrap}
.browser img{display:block;width:100%}
.shot{overflow:hidden}
.phone{position:absolute;border-radius:24px;padding:6px;background:#0c111b;
  box-shadow:0 22px 60px rgba(0,0,0,.45),0 0 0 1px rgba(255,255,255,.16)}
.phone .shot{border-radius:18px;height:100%}
.phone img{display:block;width:100%}
.card{position:absolute;overflow:hidden;box-shadow:0 22px 60px rgba(0,0,0,.42),0 0 0 1px rgba(255,255,255,.14)}
.card img{display:block;width:100%}
.call{position:absolute;font:500 12px/1.3 JBM;color:#fff;white-space:nowrap;text-shadow:0 1px 6px rgba(0,0,0,.45)}
.call b{display:block;font:700 10px JBM;letter-spacing:.16em;color:var(--accent);margin-bottom:2px}
svg.lines{position:absolute;inset:0}
/* Paper variant, for images that follow the page theme. */
.light .grid{background-image:
  linear-gradient(rgba(18,28,43,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(18,28,43,.07) 1px,transparent 1px),
  linear-gradient(rgba(18,28,43,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(18,28,43,.03) 1px,transparent 1px)}
.light .sheet{border-color:rgba(18,28,43,.2)}
.light .label{color:rgba(18,28,43,.72)}
.light .call{color:#121C2B;text-shadow:none}
.light .browser,.light .code,.light .card{box-shadow:0 14px 34px rgba(18,28,43,.18),0 0 0 1px rgba(18,28,43,.16)}
.code{position:absolute;border-radius:9px;overflow:hidden;background:#0d131d;
  box-shadow:0 22px 60px rgba(0,0,0,.42),0 0 0 1px rgba(255,255,255,.14)}
.code pre{margin:0;padding:12px 14px;font:500 10.5px/1.62 JBM;color:#c9d4e5;white-space:pre}
.code pre b{color:var(--accent);font-weight:700}
.code pre i{color:#7f92ad;font-style:normal}
.cap{position:absolute;left:18px;right:18px}
.cap h3{font:600 15px Mona;color:#fff;letter-spacing:-.01em}
.cap p{margin-top:3px;font:500 9.5px JBM;color:rgba(255,255,255,.66);letter-spacing:.02em}
`;

function layerHtml(l) {
  const img = (src, extra = '') => `<img src="${fileUrl(src)}" style="${extra}">`;
  // `crop` shifts the screenshot inside its frame: { y: px to scroll, zoom: scale factor }.
  const shot = (l, h) => {
    const zoom = l.zoom ?? 1;
    const dy = l.scroll ?? 0;
    const dx = l.pan ?? 0;
    return `<div class="shot" style="height:${h}px">${img(l.src, `width:${zoom * 100}%;margin:-${dy}px 0 0 -${dx}px`)}</div>`;
  };
  if (l.type === 'browser')
    return `<div class="browser" style="left:${l.x}px;top:${l.y}px;width:${l.w}px"><div class="bar"><i></i><i></i><i></i><span>${l.url}</span></div>${shot(l, l.h)}</div>`;
  if (l.type === 'phone')
    return `<div class="phone" style="left:${l.x}px;top:${l.y}px;width:${l.w}px;height:${l.h}px">${shot(l, l.h - 12)}</div>`;
  if (l.type === 'card')
    return `<div class="card" style="left:${l.x}px;top:${l.y}px;width:${l.w}px;height:${l.h}px;border-radius:${l.radius ?? 8}px;transform:rotate(${l.rotate ?? 0}deg)">${shot(l, l.h)}</div>`;
  if (l.type === 'callout')
    return `<div class="call" style="left:${l.x}px;top:${l.y}px;${l.align === 'right' ? 'text-align:right;transform:translateX(-100%)' : ''}"><b>${l.tag}</b>${l.text}</div>`;
  if (l.type === 'code')
    return `<div class="code" style="left:${l.x}px;top:${l.y}px;width:${l.w}px;height:${l.h}px"><div class="bar"><i></i><i></i><i></i><span>${l.title}</span></div><pre style="font-size:${l.size ?? 10.5}px">${l.lines.join('\n')}</pre></div>`;
  if (l.type === 'caption') return `<div class="cap" style="top:${l.y}px"><h3>${l.name}</h3><p>${l.tag}</p></div>`;
  throw new Error(`unknown layer type ${l.type}`);
}

function linesSvg(show) {
  const parts = show.layers
    .filter((l) => l.type === 'callout' && l.from && l.to)
    .map((l) => {
      const [x1, y1] = l.from;
      const [x2, y2] = l.to;
      return `<path d="M${x1} ${y1}H${x2}V${y2}" fill="none" stroke="${show.light ? 'rgba(18,28,43,.55)' : 'rgba(255,255,255,.6)'}" stroke-width="1"/><circle cx="${x2}" cy="${y2}" r="2.6" fill="${show.accent}"/>`;
    });
  return `<svg class="lines" width="${show.w ?? 846}" height="${show.h}" viewBox="0 0 ${show.w ?? 846} ${show.h}">${parts.join('')}</svg>`;
}

function html(show) {
  return `<!doctype html><meta charset="utf-8"><style>${CSS}</style>
<div class="stage${show.light ? ' light' : ''}" style="width:${show.w ?? 846}px;height:${show.h}px;background:${show.bg};--accent:${show.accent}">
<div class="grid"></div><div class="sheet"></div>
${show.label ? `<div class="label">${show.label}</div>` : ''}
${show.layers.filter((l) => l.type !== 'callout').map(layerHtml).join('\n')}
${linesSvg(show)}
${show.layers.filter((l) => l.type === 'callout').map(layerHtml).join('\n')}
</div>`;
}

const wanted = process.argv.slice(2);
const browser = await chromium.launch();
for (const [id, show] of Object.entries(SHOWCASES)) {
  if (wanted.length && !wanted.includes(id)) continue;
  const missing = show.layers.filter((l) => l.src && !fs.existsSync(path.join(root, l.src))).map((l) => l.src);
  if (missing.length) {
    console.log(`skip ${id}: missing ${missing.join(', ')}`);
    continue;
  }
  const width = show.w ?? 846;
  const page = await browser.newPage({ viewport: { width, height: show.h }, deviceScaleFactor: 2 });
  const tmp = path.join(root, '.work', `_compose-${id}.html`);
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  fs.writeFileSync(tmp, html(show));
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width, height: show.h } });
  await page.close();
  fs.rmSync(tmp);
  const out = path.join(root, 'assets', 'showcase', `${id}.webp`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await sharp(png).webp({ quality: show.quality ?? 84, effort: 6 }).toFile(out);
  console.log(`${(fs.statSync(out).size / 1024).toFixed(0).padStart(5)} KB  assets/showcase/${id}.webp  (${width * 2}x${show.h * 2})`);
}
await browser.close();
