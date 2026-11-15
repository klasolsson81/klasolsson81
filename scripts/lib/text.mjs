// Text as outlines. Each glyph used in a document is emitted once in <defs>
// and placed with <use>, so a line of text costs a few bytes per character.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
let cached;
export function loadAtlas() {
  cached ??= JSON.parse(fs.readFileSync(path.join(root, 'design', 'glyphs.json'), 'utf8'));
  return cached;
}

const r = (n) => Math.round(n * 100) / 100;

/** One instance per SVG document: it tracks which glyphs that document uses. */
export function createText(atlas = loadAtlas()) {
  const used = new Map();
  const ids = new Map();

  function glyphId(font, ch) {
    const key = `${font}|${ch}`;
    let id = ids.get(key);
    if (!id) {
      id = `g${ids.size.toString(36)}`;
      ids.set(key, id);
      used.set(id, atlas[font].g[ch][1]);
    }
    return id;
  }

  function glyph(font, ch) {
    const f = atlas[font];
    if (!f) throw new Error(`unknown font style "${font}"`);
    const g = f.g[ch];
    if (!g) throw new Error(`"${ch}" is not in the glyph atlas; add it to CHARSET in build-glyphs.mjs`);
    return g;
  }

  /** Width in user units. `tracking` is extra space between characters, in user units. */
  function measure(str, { font, size, tracking = 0 }) {
    const s = size / atlas[font].upem;
    let w = 0;
    const chars = [...str];
    for (const ch of chars) w += glyph(font, ch)[0] * s;
    return w + tracking * Math.max(0, chars.length - 1);
  }

  /** `y` is the baseline. Returns an SVG fragment. */
  function draw(str, { x, y, font, size, fill, anchor = 'start', tracking = 0, attrs = '' }) {
    const f = atlas[font];
    const s = size / f.upem;
    const w = measure(str, { font, size, tracking });
    const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
    let cx = 0;
    const uses = [];
    for (const ch of str) {
      const [adv, d] = glyph(font, ch);
      if (d) uses.push(`<use href="#${glyphId(font, ch)}" x="${Math.round(cx)}"/>`);
      cx += adv + tracking / s;
    }
    return `<g transform="translate(${r(x0)} ${r(y)}) scale(${r(s * 1000) / 1000})" fill="${fill}"${attrs ? ' ' + attrs : ''}>${uses.join('')}</g>`;
  }

  /** Greedy word wrap to `maxWidth`. */
  function wrap(str, opts, maxWidth) {
    const lines = [];
    let line = '';
    for (const word of str.split(' ')) {
      const next = line ? `${line} ${word}` : word;
      if (line && measure(next, opts) > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  const capHeight = (font, size) => (atlas[font].cap * size) / atlas[font].upem;
  const defs = () => [...used].map(([id, d]) => `<path id="${id}" d="${d}"/>`).join('');

  return { measure, draw, wrap, defs, capHeight };
}
