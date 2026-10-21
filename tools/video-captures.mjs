// Extra real-app captures for the launch video.
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const base = process.argv[2] ?? 'http://localhost:8082';
const out = '../marketing/video/captures';
mkdirSync(out, { recursive: true });
const iso = (d) => d.toISOString().slice(0, 10);
const days = [...Array(16)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return iso(d); });
const fc = (rain) => ({
  current: { temperature_2m: rain ? 11 : 13, apparent_temperature: rain ? 8 : 11, weather_code: rain ? 63 : 1, wind_speed_10m: 14, is_day: 1 },
  daily: { time: days, weather_code: days.map(() => (rain ? 63 : 1)), temperature_2m_max: days.map(() => (rain ? 13 : 17)), temperature_2m_min: days.map(() => (rain ? 7 : 9)),
    apparent_temperature_max: days.map(() => (rain ? 11 : 16)), apparent_temperature_min: days.map(() => (rain ? 5 : 7)), precipitation_probability_max: days.map(() => (rain ? 90 : 10)), wind_speed_10m_max: days.map(() => 16), uv_index_max: days.map(() => 2) },
});
const prefs = { onboarded: true, displayName: 'Maya', styles: ['minimalist', 'casual', 'smartCasual'], fitByGroup: {}, coldSensitivity: 'neutral', tempUnit: 'F', theme: 'light', autoDirtyCategories: ['tshirt'], repeatWindowDays: 5, haptics: true, customCategories: [], location: { name: 'Brooklyn', latitude: 40.68, longitude: -73.94, source: 'manual' } };
const browser = await chromium.launch();
async function session(rain, height = 932) {
  const ctx = await browser.newContext({ viewport: { width: 430, height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route('**/api.open-meteo.com/**', (r) => r.fulfill({ json: fc(rain) }));
  await ctx.addInitScript((p) => { if (!localStorage.getItem('getup:v1:preferences')) localStorage.setItem('getup:v1:preferences', JSON.stringify(p)); }, prefs);
  const page = await ctx.newPage();
  await page.goto(base); await page.waitForTimeout(1400);
  await page.getByText('Try the sample closet').click(); await page.waitForTimeout(1000);
  return { ctx, page };
}
let { ctx, page } = await session(true);
await page.screenshot({ path: `${out}/today-rain.png` });
await page.getByRole('button', { name: 'Wear today' }).first().click(); await page.waitForTimeout(900);
await page.screenshot({ path: `${out}/dressed.png` });
await ctx.close();
({ ctx, page } = await session(false));
await page.screenshot({ path: `${out}/today-clear.png` });
await ctx.close();
({ ctx, page } = await session(false, 2600));
await page.getByLabel('Closet', { exact: true }).click(); await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/closet-tall.png` });
await ctx.close();
// Onboarding welcome
const c2 = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
const p2 = await c2.newPage(); await p2.goto(base); await p2.waitForTimeout(2000);
await p2.screenshot({ path: `${out}/welcome.png` });
await browser.close();
console.log('done');
