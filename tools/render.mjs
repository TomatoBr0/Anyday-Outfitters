// Render an HTML or SVG file to PNG with headless Chromium.
// usage: node render.mjs <input.html|svg> <out.png> <width> <height> [scale] [--transparent]
import { chromium } from 'playwright';
import { pathToFileURL } from 'url';
import { resolve } from 'path';
const [input, out, w, h, scale = '1', ...flags] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +scale });
await page.goto(pathToFileURL(resolve(input)).href);
await page.evaluate(() => document.fonts && document.fonts.ready);
await page.waitForTimeout(150);
await page.screenshot({ path: out, omitBackground: flags.includes('--transparent') });
await browser.close();
