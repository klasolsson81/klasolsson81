// Dev helper: screenshots a page (or one element of it) in a given engine,
// colour scheme and viewport. Used to check the real GitHub rendering.
// usage: node scripts/shoot-url.mjs <url> <out.png> [--engine chromium|firefox|webkit] [--scheme dark|light]
//        [--width 1440] [--height 900] [--scale 1] [--wait 3000] [--selector css] [--reduce] [--full] [--hide-fixed]
import * as pw from 'playwright';

const args = process.argv.slice(2);
const url = args.shift();
const out = args.shift();
const opt = { engine: 'chromium', scheme: 'dark', width: 1440, height: 900, scale: 1, wait: 3000, selector: '', reduce: false, full: false, hideFixed: false };
while (args.length) {
  const a = args.shift();
  if (a === '--reduce') opt.reduce = true;
  else if (a === '--full') opt.full = true;
  else if (a === '--hide-fixed') opt.hideFixed = true;
  else opt[a.slice(2)] = args.shift();
}

const browser = await pw[opt.engine].launch();
const ctx = await browser.newContext({
  viewport: { width: Number(opt.width), height: Number(opt.height) },
  deviceScaleFactor: Number(opt.scale),
  colorScheme: opt.scheme,
  reducedMotion: opt.reduce ? 'reduce' : 'no-preference',
});
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(Number(opt.wait));
// Floating widgets (chat, help) are fixed to the viewport and land in the middle of a full-page capture.
if (opt.hideFixed) {
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('body *')) {
      if (getComputedStyle(el).position === 'fixed') el.style.setProperty('visibility', 'hidden', 'important');
    }
  });
}
if (opt.selector) {
  const el = page.locator(opt.selector).first();
  await el.scrollIntoViewIfNeeded();
  const box = await el.boundingBox();
  console.log('element box', JSON.stringify(box));
  await el.screenshot({ path: out });
} else {
  await page.screenshot({ path: out, fullPage: opt.full });
}
await browser.close();
console.log('wrote', out);
