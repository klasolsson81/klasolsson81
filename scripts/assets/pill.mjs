// A link pill per product: brand-coloured live dot, the domain, what it is
// and whose it is, and an arrow. Three of them fill the 846 px column.
import { svgDoc } from '../lib/svg.mjs';
import { createText } from '../lib/text.mjs';

// One slow pulse, the same phase on all three pills, for about 45 seconds.
const CSS =
  '.halo{animation:halo 6s ease-out 8}' +
  '@keyframes halo{0%{opacity:.5;transform:scale(1)}30%,100%{opacity:0;transform:scale(2.7)}}';

export function pill({ t, color, domain, note }) {
  const W = 276;
  const H = 54;
  const T = createText();
  const body =
    `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="7" fill="${t.surface}" stroke="${t.line}"/>` +
    `<circle class="halo" cx="22" cy="22" r="4.5" fill="${color}" style="transform-origin:22px 22px"/>` +
    `<circle cx="22" cy="22" r="4.5" fill="${color}"/>` +
    T.draw(domain, { x: 40, y: 22 + T.capHeight('mono-500', 13.5) / 2, font: 'mono-500', size: 13.5, fill: t.ink }) +
    T.draw(note, { x: 40, y: 42, font: 'mono-400', size: 11, fill: t.inkSoft }) +
    T.draw('LIVE', { x: W - 36, y: 22 + T.capHeight('mono-700', 9.5) / 2, font: 'mono-700', size: 9.5, fill: t.muted, anchor: 'end', tracking: 1.4 }) +
    `<path d="M${W - 27} 26.5l8-8m-6.5 0h6.5v6.5" fill="none" stroke="${t.muted}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`;
  return svgDoc({ w: W, h: H, title: `${domain}, live. ${note}.`, style: CSS, defs: T.defs(), body });
}
