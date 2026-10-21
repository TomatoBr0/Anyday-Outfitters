// Generate app icon / splash / favicon PNGs from the Getup mark.
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const HOOK = 'M50 33V28.6c0-2.6 1.9-4 4-5.4a8 8 0 1 0-12.1-6.9';
const HANGER = 'M50 33 15.6 63.2c-2.6 2.3-1 6.3 2.4 6.3h64c3.4 0 5-4 2.4-6.3L50 33Z';
const SUN = 'M34 69.5a16 16 0 0 1 32 0Z';
const C = { linen: '#F5F1EA', ink: '#1C1B19', clay: '#B5583A', cream: '#F2EDE4', night: '#121110', clayDark: '#E07A57' };

// The mark's bounding box is ~x 13-87, y 8-70; center it in a square.
const mark = ({ ink = C.ink, sun = C.clay, sw = 6.5, mono = false } = {}) => `
  <g transform="translate(0 11)">
    ${mono ? '' : `<path d="${SUN}" fill="${sun}"/>`}
    <path d="${HANGER}" fill="none" stroke="${ink}" stroke-width="${sw}" stroke-linejoin="round"/>
    <path d="${HOOK}" fill="none" stroke="${ink}" stroke-width="${sw}" stroke-linecap="round"/>
    ${mono ? `<path d="${SUN}" fill="${ink}"/>` : ''}
  </g>`;

const svg = (size, inner, { bg, scale = 1 } = {}) => `<!doctype html><html><body style="margin:0;background:transparent">
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  ${bg ? `<rect width="100" height="100" fill="${bg}"/>` : ''}
  <g transform="translate(50 50) scale(${scale}) translate(-50 -50)">${inner}</g>
</svg></body></html>`;

export const targets = (out) => [
  // iOS/App Store icon: full-bleed, iOS applies the mask.
  [`${out}/icon.png`, 1024, svg(1024, mark({ sw: 7 }), { bg: C.linen, scale: 0.78 })],
  [`${out}/icon-dark.png`, 1024, svg(1024, mark({ ink: C.cream, sun: C.clayDark, sw: 7 }), { bg: C.night, scale: 0.78 })],
  // Android adaptive: foreground inside the 66% safe zone.
  [`${out}/android-icon-foreground.png`, 1024, svg(1024, mark({ sw: 7 }), { scale: 0.56 })],
  [`${out}/android-icon-background.png`, 1024, svg(1024, '', { bg: C.linen })],
  [`${out}/android-icon-monochrome.png`, 1024, svg(1024, mark({ ink: '#000', mono: true, sw: 7 }), { scale: 0.56 })],
  [`${out}/splash-icon.png`, 512, svg(512, mark(), { scale: 0.9 })],
  [`${out}/splash-icon-dark.png`, 512, svg(512, mark({ ink: C.cream, sun: C.clayDark }), { scale: 0.9 })],
  [`${out}/favicon.png`, 96, svg(96, mark({ sw: 8 }), { bg: C.linen, scale: 0.86 })],
];

const out = process.argv[2] ?? '../assets/images';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const [file, size, html] of targets(out)) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(html);
  await page.screenshot({ path: file, omitBackground: true });
  await page.close();
  console.log('wrote', file);
}
await browser.close();
