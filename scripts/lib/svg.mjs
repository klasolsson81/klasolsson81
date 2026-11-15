// Small SVG helpers shared by every generator.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const tokens = JSON.parse(fs.readFileSync(path.join(root, 'design', 'tokens.json'), 'utf8'));
export const THEMES = ['dark', 'light'];

export const r = (n) => Math.round(n * 100) / 100;
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Every animation in the repo sits behind this: readers who ask for less motion get the still. */
export const REDUCED = '@media (prefers-reduced-motion:reduce){*{animation:none!important}}';

export function svgDoc({ w, h, title, style = '', defs = '', body }) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(title)}">` +
    `<title>${esc(title)}</title>` +
    (style ? `<style>${style}${REDUCED}</style>` : '') +
    (defs ? `<defs>${defs}</defs>` : '') +
    body +
    `</svg>\n`
  );
}

/** The drawing-sheet card every asset sits on: opaque, bordered, with a drafting grid. */
export function sheet({ w, h, t, id = 'grid', radius = 10, inset = 14, fade = true }) {
  const defs =
    `<pattern id="${id}a" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M12 0H0V12" fill="none" stroke="${t.gridMinor}"/></pattern>` +
    `<pattern id="${id}b" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0H0V60" fill="none" stroke="${t.gridMajor}"/></pattern>` +
    `<clipPath id="${id}c"><rect x="${inset}" y="${inset}" width="${w - inset * 2}" height="${h - inset * 2}"/></clipPath>`;
  const body =
    `<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="${radius}" fill="${t.canvas}" stroke="${t.line}"/>` +
    `<g clip-path="url(#${id}c)"${fade ? ' class="grid"' : ''}>` +
    `<rect x="${inset}" y="${inset}" width="${w - inset * 2}" height="${h - inset * 2}" fill="url(#${id}a)"/>` +
    `<rect x="${inset}" y="${inset}" width="${w - inset * 2}" height="${h - inset * 2}" fill="url(#${id}b)"/>` +
    `</g>` +
    `<rect x="${inset + 0.5}" y="${inset + 0.5}" width="${w - inset * 2 - 1}" height="${h - inset * 2 - 1}" fill="none" stroke="${t.line}"/>`;
  return { defs, body };
}

export function write(rel, content) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  return fs.statSync(file).size;
}
