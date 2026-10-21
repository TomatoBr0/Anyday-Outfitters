// Export brand PNGs from branding/logo SVGs.
import { chromium } from 'playwright';
import { mkdirSync, copyFileSync } from 'fs';
import { resolve } from 'path';
const root = resolve('..');
const L = `${root}/branding/logo`;
const E = `${root}/branding/exports`;
mkdirSync(E, { recursive: true });
const jobs = [
  ['getup-lockup-horizontal.svg', 'getup-lockup-horizontal@2x.png', 1200, '#F5F1EA'],
  ['getup-lockup-horizontal-reversed.svg', 'getup-lockup-horizontal-reversed@2x.png', 1200, '#121110'],
  ['getup-lockup-stacked.svg', 'getup-lockup-stacked@2x.png', 800, '#F5F1EA'],
  ['getup-mark.svg', 'getup-mark-1024.png', 1024, null],
  ['getup-mark-reversed.svg', 'getup-mark-reversed-1024.png', 1024, null],
  ['getup-mark-mono-black.svg', 'getup-mark-mono-black-512.png', 512, null],
  ['getup-wordmark.svg', 'getup-wordmark@2x.png', 1000, null],
  ['getup-app-icon.svg', 'social-avatar-400.png', 400, null],
];
const browser = await chromium.launch();
for (const [svg, png, width, bg] of jobs) {
  const page = await browser.newPage({ viewport: { width: width + 160, height: 2000 } });
  await page.setContent(`<html><body style="margin:0;background:${bg ?? 'transparent'}"><div id="w" style="display:inline-block;padding:${bg ? 80 : 0}px"><img src="file://${L}/${svg}" style="width:${width}px;display:block"></div></body></html>`);
  await page.waitForTimeout(100);
  await page.locator('#w').screenshot({ path: `${E}/${png}`, omitBackground: !bg });
  await page.close();
  console.log('wrote', png);
}
await browser.close();
for (const f of ['icon.png', 'icon-dark.png', 'android-icon-foreground.png', 'android-icon-background.png', 'android-icon-monochrome.png', 'favicon.png'])
  copyFileSync(`${root}/assets/images/${f}`, `${root}/branding/icons/${f}`);
