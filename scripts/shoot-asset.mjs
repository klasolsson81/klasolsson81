// Dev helper: renders assets the way a README does (as <img>) and saves PNGs.
// usage: node scripts/shoot-asset.mjs <out.png> [--bg #0d1117] [--wait 2500] [--scale 2] [--width 846] [--engine chromium] [--reduce] file.svg...
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as pw from 'playwright';

const args = process.argv.slice(2);
const out = args.shift();
const opt = { bg: '#0d1117', wait: 2500, scale: 2, width: 846, engine: 'chromium', reduce: false };
const files = [];
while (args.length) {
  const a = args.shift();
  if (a === '--reduce') opt.reduce = true;
  else if (a.startsWith('--')) opt[a.slice(2)] = args.shift();
  else files.push(a);
}

const browser = await pw[opt.engine].launch();
const ctx = await browser.newContext({
  viewport: { width: Number(opt.width) + 48, height: 600 },
  deviceScaleFactor: Number(opt.scale),
  reducedMotion: opt.reduce ? 'reduce' : 'no-preference',
});
const page = await ctx.newPage();
const imgs = files
  .map((f) => `<p><img src="${pathToFileURL(path.resolve(f)).href}" style="max-width:100%"></p>`)
  .join('');
// A file:// page, because a blank page is not allowed to load file:// images.
const html = path.resolve('.work', `_shoot-${process.pid}.html`);
fs.mkdirSync(path.dirname(html), { recursive: true });
fs.writeFileSync(html, `<!doctype html><body style="margin:24px;background:${opt.bg};width:${opt.width}px">${imgs}</body>`);
await page.goto(pathToFileURL(html).href, { waitUntil: 'load' });
await page.waitForTimeout(Number(opt.wait));
await page.screenshot({ path: out, fullPage: true });
await browser.close();
fs.rmSync(html);
console.log('wrote', out);
