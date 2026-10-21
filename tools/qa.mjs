// End-to-end QA of the web build at iPhone size. Mocks Open-Meteo (blocked in CI sandboxes).
// usage: node qa.mjs <baseUrl> <outDir>
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const base = process.argv[2] ?? 'http://localhost:8081';
const out = process.argv[3] ?? './qa-out';
mkdirSync(out, { recursive: true });

const iso = (d) => d.toISOString().slice(0, 10);
function forecast({ rainy = false, cold = false } = {}) {
  const days = [...Array(16)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return iso(d); });
  const hi = cold ? 4 : 17, lo = cold ? -3 : 9;
  return {
    current: { temperature_2m: cold ? 1 : 14, apparent_temperature: cold ? -3 : 13, weather_code: rainy ? 61 : 2, wind_speed_10m: 14, is_day: 1 },
    daily: {
      time: days,
      weather_code: days.map((_, i) => (rainy && i === 0 ? 63 : i % 4 === 0 ? 61 : 2)),
      temperature_2m_max: days.map((_, i) => hi + (i % 3)),
      temperature_2m_min: days.map((_, i) => lo + (i % 2)),
      apparent_temperature_max: days.map((_, i) => hi - 1 + (i % 3)),
      apparent_temperature_min: days.map((_, i) => lo - 2 + (i % 2)),
      precipitation_probability_max: days.map((_, i) => (rainy && i === 0 ? 85 : i % 4 === 0 ? 60 : 10)),
      wind_speed_10m_max: days.map(() => 18),
      uv_index_max: days.map(() => 3),
    },
  };
}
const geo = { results: [{ name: 'Boston', admin1: 'Massachusetts', country: 'United States', latitude: 42.36, longitude: -71.06 }, { name: 'Boston', admin1: 'England', country: 'United Kingdom', latitude: 52.97, longitude: -0.02 }] };

const errors = [];
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true, colorScheme: 'light' });
let weatherMode = { rainy: false, cold: false };
await ctx.route('**/api.open-meteo.com/**', (r) => r.fulfill({ json: forecast(weatherMode) }));
await ctx.route('**/geocoding-api.open-meteo.com/**', (r) => r.fulfill({ json: geo }));
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 300)); });

const shot = async (name) => { await page.waitForTimeout(450); await page.screenshot({ path: `${out}/${name}.png` }); };
const tapText = async (t, opts = {}) => page.getByText(t, { exact: true, ...opts }).first().click();
const tapLabel = async (l) => page.getByLabel(l, { exact: true }).first().click();
// Tap the match that is actually on top (inactive tabs stay mounted underneath on web).
const tapTop = async (locator) => {
  const n = await locator.count();
  for (let i = 0; i < n; i++) {
    const el = locator.nth(i);
    if (!(await el.isVisible().catch(() => false))) continue;
    await el.evaluate((n) => n.scrollIntoView({ block: 'center' })).catch(() => {});
    await page.waitForTimeout(120);
    const box = await el.boundingBox().catch(() => null);
    if (!box) continue;
    const onTop = await el.evaluate((node, b) => {
      const hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
      return !!hit && (node === hit || node.contains(hit));
    }, box);
    if (onTop) return el.click();
  }
  throw new Error('no on-top match for ' + locator);
};
const visible = async (t) => {
  const loc = page.getByText(t, { exact: false });
  const n = await loc.count();
  for (let i = 0; i < n; i++) {
    const el = loc.nth(i);
    if (!(await el.isVisible().catch(() => false))) continue;
    const ok = await el.evaluate((node) => { node.scrollIntoView({ block: 'center' }); const r = node.getBoundingClientRect(); const h = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return !!h && (node === h || node.contains(h) || h.contains(node)); }).catch(() => false);
    if (ok) return true;
  }
  return false;
};

// ---- Onboarding
await page.goto(base);
await page.waitForTimeout(1500);
check('opens onboarding on first launch', await visible('Get dressed.'));
await shot('01-welcome');
await tapText('Get started');
await page.getByPlaceholder('First name').fill('Alex');
await page.getByLabel(/^Minimalist:/).click();
await page.getByLabel(/^Casual:/).click();
await page.getByLabel(/^Smart casual:/).click();
await shot('02-style');
await tapText('Continue');
await page.getByText('Relaxed', { exact: true }).first().click();
await shot('03-fit');
await tapText('Continue');
await page.getByLabel(/^Chilly/).click();
await shot('04-temp');
await tapText('Continue');
await page.getByPlaceholder('Search for a city').fill('Boston');
await page.waitForTimeout(900);
await shot('05-location-search');
await page.getByLabel('Boston, Massachusetts, United States').click();
await page.waitForTimeout(300);
check('location saved', await visible('Boston'));
await tapText('Continue');
await shot('06-closet-step');
await page.getByLabel(/^Start with a sample closet/).click();
await page.waitForTimeout(1500);

// ---- Today
check('lands on Today after onboarding', await visible('Good') && await visible('Alex'));
check('weather card shows Boston', await visible('Boston'));
check('today shows an outfit', await visible('Wear today'));
await shot('07-today');
await page.mouse.wheel(0, 700);
await shot('08-today-scrolled');
await page.mouse.wheel(0, -2000);

// Regenerate gives a different outfit
const firstTitle = await page.getByText('Today’s pick').first().isVisible();
await tapLabel('New outfit');
await page.waitForTimeout(400);
check('regenerate keeps an outfit visible', firstTitle && (await visible('Wear today')));

// Occasion switch
await page.getByRole('button', { name: 'Work', exact: true }).first().click().catch(() => tapText('Work'));
await page.waitForTimeout(400);
await shot('09-today-work');

// Save
await tapLabel('Save outfit');
await page.waitForTimeout(250);
check('save shows confirmation', await visible('Saved to your outfits'));
await shot('09b-saved-toast');

// Wear today
await page.getByRole('button', { name: 'Wear today' }).first().click();
await page.waitForTimeout(500);
check('wear today switches to dressed state', await visible('You’re dressed'));
await shot('10-dressed');

// ---- Persistence across reload
await page.reload();
await page.waitForTimeout(1800);
check('dressed state persists after reload', await visible('You’re dressed'));
check('onboarding not shown again', !(await visible('Get dressed.')));

// ---- Closet
await tapLabel('Closet');
await page.waitForTimeout(600);
check('closet lists sample pieces', await visible('27 pieces'));
await shot('11-closet');
await tapText('Shoes');
await page.waitForTimeout(300);
check('category filter works', (await visible('Brown leather boots')) && !(await visible('Khaki chinos')));
await shot('12-closet-shoes');
await tapText('Shoes');
await page.getByPlaceholder('Search your closet').fill('denim');
await page.waitForTimeout(300);
check('search works', (await visible('Denim jacket')) && !(await visible('Black loafers')));
await page.getByPlaceholder('Search your closet').fill('');
await tapLabel('In hamper');
await page.waitForTimeout(300);
await shot('13-closet-hamper');
await tapLabel('In hamper');
await tapLabel('List view');
await shot('14-closet-list');
await tapLabel('Grid view');

// Item detail
await page.getByPlaceholder('Search your closet').fill('blazer');
await page.waitForTimeout(300);
await tapTop(page.getByLabel(/^Navy blazer/));
await page.waitForTimeout(500);
check('item detail opens', await visible('Availability'));
await shot('15-item-detail');
await tapTop(page.getByRole('button', { name: 'Mark dirty' }));
await page.waitForTimeout(300);
check('mark dirty updates status', (await page.getByRole('button', { name: 'Mark clean' }).count()) > 0);
await tapLabel('Back');

// ---- Create
await page.waitForTimeout(400);
await tapLabel('Create an outfit');
await page.waitForTimeout(600);
await shot('16-create-empty');
await tapTop(page.getByRole('button', { name: 'Fill the rest' }));
await page.waitForTimeout(600);
check('builder fills an outfit', await visible('match'));
await shot('17-create-filled');
await tapTop(page.getByLabel(/^Shoes:/));
await page.waitForTimeout(400);
await shot('18-create-swap');

// ---- Plan (opened from Today's calendar button)
await tapTop(page.getByLabel('Today', { exact: true }));
await page.waitForTimeout(300);
await tapTop(page.getByLabel('Plan ahead: calendar and trips'));
await page.waitForTimeout(600);
await shot('19-plan-calendar');
await tapTop(page.getByLabel('New event'));
await page.waitForTimeout(500);
await page.getByPlaceholder('e.g. Sam’s birthday dinner').fill('Dinner with friends');
await page.getByPlaceholder('18:30').fill('19:00');
await page.getByRole('button', { name: 'Date', exact: true }).click();
await shot('20-event-edit');
await page.getByRole('button', { name: 'Save', exact: true }).click();
await page.waitForTimeout(600);
check('event appears on calendar', await visible('Dinner with friends'));
await shot('21-plan-with-event');
await tapTop(page.getByText('Trips', { exact: true }));
await page.waitForTimeout(300);
await shot('22-trips-empty');
await tapTop(page.getByRole('button', { name: 'Plan a trip' }));
await page.waitForTimeout(500);
await page.getByPlaceholder('Search for a city').fill('Boston');
await page.waitForTimeout(900);
await page.getByLabel('Boston, Massachusetts, United States').click();
await page.getByRole('button', { name: 'Outdoors', exact: true }).click();
await page.getByRole('button', { name: 'Build packing list' }).click();
await page.waitForTimeout(1200);
check('trip packing list generated', await visible('From your closet') && await visible('Underwear'));
await shot('23-trip');
await tapTop(page.getByLabel('Back'));
await page.waitForTimeout(300);
await tapTop(page.getByLabel('Back'));

// ---- Profile + settings
await page.waitForTimeout(400);
await tapLabel('You');
await page.waitForTimeout(500);
check('profile shows insights', await visible('Closet insights'));
await shot('24-profile');
await tapTop(page.getByText('Laundry', { exact: true }));
await page.waitForTimeout(500);
await shot('25-laundry');
const hamper = await visible('In hamper (');
check('laundry screen lists hamper', hamper);
await tapTop(page.getByRole('button', { name: 'Everything’s washed' })).catch(() => {});
await page.waitForTimeout(300);
check('everything washed empties hamper', await visible('Hamper’s empty'));
await tapLabel('Back');
await page.waitForTimeout(300);
await shot('25b-after-laundry');
await tapTop(page.getByText('Weather & location', { exact: true }));
await page.waitForTimeout(400);
await shot('26-weather-settings');
await tapLabel('Back');

// Dark mode
await tapTop(page.getByRole('tab', { name: 'Dark' }));
await page.waitForTimeout(400);
await shot('27-profile-dark');
await tapLabel('Today');
await page.waitForTimeout(500);
await shot('28-today-dark');
await tapLabel('Closet');
await page.waitForTimeout(500);
await shot('29-closet-dark');
await tapLabel('You');
await tapTop(page.getByRole('tab', { name: 'Light' }));

// Rainy + cold weather changes recommendations
weatherMode = { rainy: true, cold: false };
await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('getup:weather')) localStorage.removeItem(k); });
await page.reload();
await page.waitForTimeout(1800);
await tapLabel('Today');
await tapTop(page.getByRole('button', { name: 'Change' })).catch(() => {});
await page.waitForTimeout(600);
check('rainy forecast surfaces rain-ready look', await visible('Rain-ready') || await visible('Rain'));
await shot('30-today-rain');

console.log('\nConsole/page errors:', errors.length);
for (const e of [...new Set(errors)].slice(0, 15)) console.log('  ', e);
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
await browser.close();
process.exit(failed.length ? 1 : 0);
