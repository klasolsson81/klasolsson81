// Prepares the KalasKoll showcase sources from existing 2880x1800 screenshots.
// Only frames without personal details are used, and the invitation's QR code
// (a working RSVP link in the original) is replaced with one for kalaskoll.se.
// usage: node scripts/capture/kalaskoll.mjs <dir with 01-landing.png, 04-party-detail.png, 06-rsvp-mobile.png>
import path from 'node:path';
import fs from 'node:fs';
import sharp from 'sharp';
import QRCode from 'qrcode';
import { root } from '../lib/svg.mjs';

const src = process.argv[2];
if (!src) throw new Error('pass the screenshot directory');
const out = path.join(root, '.work', 'shots', 'kalaskoll');
fs.mkdirSync(out, { recursive: true });

// Landing page: everything above the promo banner and the feedback widget.
await sharp(path.join(src, '01-landing.png')).extract({ left: 0, top: 0, width: 2880, height: 1560 }).toFile(path.join(out, 'landing.png'));

// RSVP on a phone: the invitation and the yes/no choice, above the feedback widget.
await sharp(path.join(src, '06-rsvp-mobile.png')).extract({ left: 0, top: 0, width: 1170, height: 2090 }).toFile(path.join(out, 'rsvp.png'));

// Invitation card, cropped out of the party page. The white QR box sits at
// x 1568-1823, y 1326-1593 in the original; its inside is repainted.
const card = { left: 1248, top: 416, width: 894, height: 1376 };
const box = { left: 1568 - card.left, top: 1326 - card.top, width: 255, height: 267 };
const qr = await QRCode.toBuffer('https://kalaskoll.se', { margin: 0, width: 190, color: { dark: '#111111', light: '#ffffff' } });
const inset = 16;
const blank = await sharp({ create: { width: box.width - inset * 2, height: box.height - inset * 2, channels: 3, background: '#ffffff' } }).png().toBuffer();
await sharp(path.join(src, '04-party-detail.png'))
  .extract(card)
  .composite([
    { input: blank, left: box.left + inset, top: box.top + inset },
    { input: qr, left: box.left + Math.round((box.width - 190) / 2), top: box.top + Math.round((box.height - 190) / 2) },
  ])
  .toFile(path.join(out, 'card.png'));

console.log('wrote', fs.readdirSync(out).join(', '));
