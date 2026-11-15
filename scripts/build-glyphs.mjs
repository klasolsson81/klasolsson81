// Dev-only: turns the font files into design/glyphs.json, an atlas of outlined
// glyphs. Every SVG in this repo draws its text from that atlas, so no font is
// ever loaded in the reader's browser, and the CI script needs no npm install.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as ot from 'opentype.js';

const opentype = ot.default ?? ot;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const STYLES = {
  'sans-500': '@fontsource/mona-sans/files/mona-sans-latin-500-normal.woff',
  'sans-600': '@fontsource/mona-sans/files/mona-sans-latin-600-normal.woff',
  'sans-800': '@fontsource/mona-sans/files/mona-sans-latin-800-normal.woff',
  'mono-400': '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff',
  'mono-500': '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff',
  'mono-700': '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff',
};

const CHARSET =
  ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`' +
  'abcdefghijklmnopqrstuvwxyz{|}~åäöÅÄÖé·–—•×…';

const atlas = {};
for (const [style, rel] of Object.entries(STYLES)) {
  const buf = fs.readFileSync(path.join(root, 'node_modules', rel));
  const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  const g = {};
  for (const ch of CHARSET) {
    const glyph = font.charToGlyph(ch);
    if (glyph.index === 0 && ch !== ' ') throw new Error(`${style} has no glyph for "${ch}"`);
    // Path at one unit per font unit, baseline at y = 0, y pointing down.
    const d = glyph.getPath(0, 0, font.unitsPerEm).toPathData(0);
    g[ch] = [Math.round(glyph.advanceWidth), d];
  }
  atlas[style] = {
    upem: font.unitsPerEm,
    cap: font.tables.os2.sCapHeight,
    xh: font.tables.os2.sxHeight,
    g,
  };
}

const out = path.join(root, 'design', 'glyphs.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(atlas));
console.log(`wrote ${path.relative(root, out)} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
