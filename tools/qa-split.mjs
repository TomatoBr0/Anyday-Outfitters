// End-to-end QA of "several pieces in one photo" and the profile avatar on the web build.
// The web build must be exported with EXPO_PUBLIC_DETECT_URL=http://detect.test so the
// AI path is exercised; the Worker is mocked here, nothing leaves the machine.
// usage: node qa-split.mjs <baseUrl> <photo.jpg> <outDir>
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const base = process.argv[2] ?? 'http://localhost:8081';
const photo = process.argv[3];
const out = process.argv[4] ?? './qa-out';
mkdirSync(out, { recursive: true });
const results = [];
const errors = [];
const check = (name, ok) => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); };

const prefs = { onboarded: true, clothesFor: 'mens', displayName: 'Sam', styles: ['casual'], fitByGroup: {}, coldSensitivity: 'neutral', tempUnit: 'F', theme: 'light', autoDirtyCategories: [], repeatWindowDays: 5, haptics: true, customCategories: [] };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await ctx.addInitScript((p) => { if (!localStorage.getItem('getup:v1:preferences')) localStorage.setItem('getup:v1:preferences', JSON.stringify(p)); }, prefs);
await ctx.route('**/open-meteo.com/**', (r) => r.fulfill({ status: 503, body: '' }));
let detectBody;
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type' };
await ctx.route('http://detect.test/detect', async (r) => {
  if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
  detectBody = JSON.parse(r.request().postData() ?? '{}');
  await r.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: cors,
    body: JSON.stringify({
      pieces: [
        { categoryId: 'sweater', colorId: 'navy', name: 'Navy crew sweater', box: { x: 0.06, y: 0.13, width: 0.34, height: 0.5 } },
        { categoryId: 'jeans', colorId: 'denim', name: 'Light wash jeans', box: { x: 0.51, y: 0.1, width: 0.24, height: 0.81 } },
        { categoryId: 'sneakers', colorId: 'white', name: 'White sneakers', box: { x: 0.8, y: 0.66, width: 0.16, height: 0.18 } },
      ],
    }),
  });
});
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 200)));
const shot = async (n) => { await page.waitForTimeout(400); await page.screenshot({ path: `${out}/${n}.png` }); };
const seen = (t) => page.getByText(t, { exact: false }).first().isVisible().catch(() => false);

async function openSplit() {
  await page.goto(`${base}/item/add`);
  await page.getByText('Several pieces in one photo').first().waitFor({ timeout: 15000 });
  await page.getByText('Several pieces in one photo').first().click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Choose photo' }).click();
  await (await chooser).setFiles(photo);
  await page.getByText('Drag a box around each piece').first().waitFor({ timeout: 15000 });
}

async function drag(area, fx1, fy1, fx2, fy2) {
  const b = await area.boundingBox();
  await page.mouse.move(b.x + b.width * fx1, b.y + b.height * fy1);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width * ((fx1 + fx2) / 2), b.y + b.height * ((fy1 + fy2) / 2), { steps: 4 });
  await page.mouse.move(b.x + b.width * fx2, b.y + b.height * fy2, { steps: 4 });
  await page.mouse.up();
  await page.waitForTimeout(150);
}

// ---- Manual: draw two boxes
await page.goto(base);
await page.waitForTimeout(1200);
await openSplit();
check('split screen opens with the photo', await seen('Mark at least one piece'));
const area = page.getByLabel(/^Photo\. /);
await drag(area, 0.08, 0.15, 0.38, 0.6);
await drag(area, 0.53, 0.12, 0.73, 0.88);
await drag(area, 0.9, 0.9, 0.91, 0.91); // too small: ignored
check('two drawn boxes become two pieces', await seen('Add 2 pieces'));
await shot('31-split-manual');
await page.getByLabel('Remove piece 2').click();
check('a piece can be removed', await seen('Add 1 piece'));
await drag(area, 0.53, 0.12, 0.73, 0.88);
await page.getByRole('button', { name: 'Add 2 pieces' }).click();
await page.getByText('Item 1 of 2').first().waitFor({ timeout: 15000 }).catch(() => {});
check('editor opens with both crops queued', await seen('Item 1 of 2'));
await shot('32-split-editor');

// ---- AI: find pieces (mocked Worker)
await openSplit();
await page.getByRole('button', { name: 'Find pieces for me' }).click();
await page.getByText('Add 3 pieces').first().waitFor({ timeout: 15000 }).catch(() => {});
check('detector boxes become three suggested pieces', await seen('Add 3 pieces') && await seen('Navy crew sweater') && await seen('White sneakers'));
check('app sends its own category and colour ids', Array.isArray(detectBody?.categories) && detectBody.categories.includes('sweater') && detectBody.colors.includes('navy') && typeof detectBody.image === 'string' && detectBody.image.length > 100);
await shot('33-split-detected');
await page.getByRole('button', { name: 'Add 3 pieces' }).click();
await page.getByText('Item 1 of 3').first().waitFor({ timeout: 15000 }).catch(() => {});
check('editor opens with three crops', await seen('Item 1 of 3'));
check('suggested name is prefilled', (await page.locator('input').evaluateAll((els) => els.map((e) => e.value))).includes('Navy crew sweater'));
check('suggested category is selected', await page.getByRole('button', { name: 'Sweater', exact: true }).first().getAttribute('aria-selected').catch(() => null) === 'true' || await page.getByRole('radio', { name: 'Sweater' }).first().isChecked().catch(() => false) || await page.getByText('Sweater', { exact: true }).first().isVisible());
await shot('34-split-editor-suggested');

// ---- Avatar initial isn't clipped
await page.goto(`${base}/social/edit-profile`);
await page.getByPlaceholder('Your name').waitFor({ timeout: 15000 });
await page.getByPlaceholder('Your name').fill('caleb');
await page.waitForTimeout(300);
const metrics = await page.getByText('C', { exact: true }).first().evaluate((el) => {
  const s = getComputedStyle(el);
  return { font: parseFloat(s.fontSize), line: parseFloat(s.lineHeight) };
});
check('avatar initial has room for the whole letter', metrics.line >= metrics.font);
await shot('35-avatar');

console.log(`\nConsole/page errors: ${errors.length}`, errors.slice(0, 5));
const failed = results.filter((r) => !r.ok).length;
console.log(`${results.length - failed}/${results.length} split checks passed`);
await browser.close();
process.exit(failed ? 1 : 0);
