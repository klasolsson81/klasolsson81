// Dev helper: screenshots the local preview (or any URL) across engines,
// colour schemes and viewport widths into .work/review/.
// usage: node scripts/shoot.mjs [--url <url>] [--engines chromium,firefox,webkit] [--schemes dark,light]
//        [--widths 1440,375] [--selector article.markdown-body] [--wait 2500] [--reduce] [--mode dark|light] [--tag name]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as pw from 'playwright';
import { root } from './lib/svg.mjs';

const opt = {
  url: pathToFileURL(path.join(root, '.work', 'preview', 'index.html')).href,
  engines: 'chromium',
  schemes: 'dark,light',
  widths: '1440,375',
  selector: 'article.markdown-body',
  wait: 2500,
  reduce: false,
  tag: 'local',
  mode: '',
};
const args = process.argv.slice(2);
while (args.length) {
  const a = args.shift();
  if (a === '--reduce') opt.reduce = true;
  else opt[a.slice(2)] = args.shift();
}

const outDir = path.join(root, '.work', 'review');
fs.mkdirSync(outDir, { recursive: true });

for (const engine of opt.engines.split(',')) {
  // Emulated reduced motion does not reach SVGs loaded as images; a browser-level preference does.
  const launch = !opt.reduce ? {} : engine === 'chromium' ? { args: ['--force-prefers-reduced-motion'] } : engine === 'firefox' ? { firefoxUserPrefs: { 'ui.prefersReducedMotion': 1 } } : {};
  const browser = await pw[engine].launch(launch);
  for (const scheme of opt.schemes.split(',')) {
    for (const width of opt.widths.split(',').map(Number)) {
      const mobile = width < 700;
      const ctx = await browser.newContext({
        viewport: { width, height: mobile ? 812 : 900 },
        deviceScaleFactor: mobile ? 2 : 1,
        colorScheme: scheme,
        reducedMotion: opt.reduce ? 'reduce' : 'no-preference',
      });
      const page = await ctx.newPage();
      await page.goto(opt.url, { waitUntil: 'load', timeout: 60000 });
      // Sticky and fixed bars would be painted over the content in a tall element screenshot.
      await page.evaluate((sel) => {
        const article = document.querySelector(sel);
        for (const el of document.querySelectorAll('*')) {
          const pos = getComputedStyle(el).position;
          if ((pos === 'sticky' || pos === 'fixed') && !(article && (article.contains(el) || el.contains(article)))) {
            el.style.setProperty('visibility', 'hidden', 'important');
          }
        }
      }, opt.selector);
      // --mode dark|light pins GitHub's own theme attribute, as a signed-in visitor with a fixed theme has it.
      if (opt.mode) {
        await page.evaluate((mode) => document.documentElement.setAttribute('data-color-mode', mode), opt.mode);
      }
      // GitHub re-renders the article while it hydrates; wait it out and take a fresh handle.
      await page.waitForLoadState('networkidle').catch(() => {});
      let el = page.locator(opt.selector).first();
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          await el.waitFor({ state: 'visible', timeout: 15000 });
          await el.scrollIntoViewIfNeeded({ timeout: 5000 });
          break;
        } catch {
          await page.waitForTimeout(1000);
          el = page.locator(opt.selector).first();
        }
      }
      await page.waitForTimeout(Number(opt.wait));
      const box = await el.boundingBox();
      const file = path.join(outDir, `${opt.tag}-${engine}-${scheme}-${width}${opt.reduce ? '-still' : ''}${opt.mode ? `-fixed-${opt.mode}` : ''}.png`);
      await el.screenshot({ path: file });
      console.log(`${path.basename(file)}  column ${Math.round(box.width)} x ${Math.round(box.height)}`);
      await ctx.close();
    }
  }
  await browser.close();
}
