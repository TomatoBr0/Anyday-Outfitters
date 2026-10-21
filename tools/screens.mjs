// Capture clean, seeded product screenshots from the web build (App Store 6.9" = 1290x2796).
// usage: node screens.mjs <baseUrl> <outDir> [light|dark]
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const base = process.argv[2] ?? 'http://localhost:8081';
const out = process.argv[3] ?? '../marketing/screens';
const scheme = process.argv[4] ?? 'light';
mkdirSync(out, { recursive: true });

const iso = (d) => d.toISOString().slice(0, 10);
const days = [...Array(16)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return iso(d); });
const forecast = {
  current: { temperature_2m: 13, apparent_temperature: 11, weather_code: 1, wind_speed_10m: 12, is_day: 1 },
  daily: {
    time: days, weather_code: days.map((_, i) => (i === 2 ? 61 : i % 3 ? 2 : 1)),
    temperature_2m_max: days.map((_, i) => 16 + (i % 3)), temperature_2m_min: days.map((_, i) => 8 + (i % 2)),
    apparent_temperature_max: days.map((_, i) => 15 + (i % 3)), apparent_temperature_min: days.map((_, i) => 6 + (i % 2)),
    precipitation_probability_max: days.map((_, i) => (i === 2 ? 80 : 10)), wind_speed_10m_max: days.map(() => 14), uv_index_max: days.map(() => 3),
  },
};
const prefs = { onboarded: true, displayName: 'Maya', styles: ['minimalist', 'casual', 'smartCasual'], fitByGroup: {}, coldSensitivity: 'neutral', tempUnit: 'F', theme: scheme, autoDirtyCategories: ['tshirt', 'longsleeve', 'polo', 'buttondown', 'blouse', 'tank', 'jeans', 'chinos', 'trousers', 'shorts', 'sweatpants', 'skirt', 'leggings', 'dress', 'jumpsuit', 'activewear'], repeatWindowDays: 5, haptics: true, customCategories: [], location: { name: 'Brooklyn', latitude: 40.68, longitude: -73.94, source: 'manual' } };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: scheme });
await ctx.route('**/api.open-meteo.com/**', (r) => r.fulfill({ json: forecast }));
await ctx.route('**/geocoding-api.open-meteo.com/**', (r) => r.fulfill({ json: { results: [] } }));
await ctx.addInitScript((p) => { if (!localStorage.getItem('getup:v1:preferences')) localStorage.setItem('getup:v1:preferences', JSON.stringify(p)); }, prefs);
const page = await ctx.newPage();
const shot = async (name) => { await page.waitForTimeout(700); await page.screenshot({ path: `${out}/${name}.png` }); console.log('shot', name); };
const tapTop = async (locator) => {
  const n = await locator.count();
  for (let i = 0; i < n; i++) {
    const el = locator.nth(i);
    if (!(await el.isVisible().catch(() => false))) continue;
    await el.evaluate((node) => node.scrollIntoView({ block: 'center' })).catch(() => {});
    await page.waitForTimeout(100);
    const box = await el.boundingBox(); if (!box) continue;
    const ok = await el.evaluate((node, b) => { const h = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2); return !!h && (node === h || node.contains(h)); }, box);
    if (ok) return el.click();
  }
  throw new Error('not found ' + locator);
};

await page.goto(base);
await page.waitForTimeout(1500);
await page.getByText('Try the sample closet').click();
await page.waitForTimeout(800);
// Give a few pieces some history so insights/closet look lived-in.
await page.evaluate(() => {
  const items = JSON.parse(localStorage.getItem('getup:v1:items') || '[]');
  const today = new Date();
  const ago = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
  const hist = { 'Mid-wash jeans': [9, 3], 'White leather sneakers': [12, 2], 'Grey hoodie': [6, 4], 'Black straight jeans': [5, 6], 'Navy blazer': [3, 8], 'White crew tee': [7, 9] };
  for (const it of items) if (hist[it.name]) { it.wearCount = hist[it.name][0]; it.lastWornOn = ago(hist[it.name][1]); }
  localStorage.setItem('getup:v1:items', JSON.stringify(items));
  const ev = [{ id: 'e1', title: 'Gallery opening', date: ago(-2), time: '19:00', location: 'Chelsea', occasion: 'party', formality: 3 }, { id: 'e2', title: 'Team presentation', date: ago(-4), time: '10:00', occasion: 'work', formality: 4 }];
  localStorage.setItem('getup:v1:events', JSON.stringify(ev));
});
await page.reload();
await page.waitForTimeout(1800);
await shot('01-today');
await page.getByLabel('Closet', { exact: true }).click();
await shot('02-closet');
await tapTop(page.getByLabel('Create an outfit'));
await page.waitForTimeout(400);
await tapTop(page.getByRole('button', { name: 'Fill the rest' }));
await page.waitForTimeout(500);
await page.mouse.wheel(0, 520);
await shot('03-create');
await tapTop(page.getByLabel('Plan', { exact: true }));
await page.waitForTimeout(500);
const d2 = new Date(); d2.setDate(d2.getDate() + 2);
await tapTop(page.getByLabel(new RegExp('^' + d2.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }))));
await page.waitForTimeout(400);
await page.mouse.wheel(0, 380);
await shot('04-plan');
await tapTop(page.getByText('Trips', { exact: true }));
await page.waitForTimeout(300);
await page.evaluate(() => {});
await tapLabelSafe('Plan a trip');
async function tapLabelSafe(name) { await tapTop(page.getByRole('button', { name })); }
await page.waitForTimeout(500);
await shot('05-trip-new');
await tapTop(page.getByLabel('Close'));
await tapTop(page.getByLabel('You', { exact: true }));
await shot('06-profile');
await tapTop(page.getByText('Laundry', { exact: true }));
await shot('07-laundry');
await browser.close();
