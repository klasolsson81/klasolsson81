// Dev helper: cuts the tall review screenshots into tiles a reviewer can read.
// usage: node scripts/tiles.mjs [prefix] [--height 1400]
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { root } from './lib/svg.mjs';

const args = process.argv.slice(2);
const h = args.includes('--height') ? Number(args[args.indexOf('--height') + 1]) : 1400;
const prefix = args[0] && !args[0].startsWith('--') ? args[0] : '';
const dir = path.join(root, '.work', 'review');
const out = path.join(dir, 'tiles');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const name of fs.readdirSync(dir).filter((f) => f.endsWith('.png') && f.startsWith(prefix))) {
  const file = path.join(dir, name);
  const meta = await sharp(file).metadata();
  // Phone screenshots are captured at 2x; keep each tile to two phone screens.
  const tile = meta.width < 800 ? h * 2 : h;
  const n = Math.ceil(meta.height / tile);
  for (let i = 0; i < n; i++) {
    const top = i * tile;
    const height = Math.min(tile, meta.height - top);
    await sharp(file).extract({ left: 0, top, width: meta.width, height }).toFile(path.join(out, `${name.replace('.png', '')}-${String(i + 1).padStart(2, '0')}of${n}.png`));
  }
  console.log(`${name}: ${meta.width}x${meta.height} -> ${n} tiles`);
}
