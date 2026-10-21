// Real-app captures of the social features for the launch film.
import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://localhost:8082';
const out = '../marketing/video/captures';
const prefs = { onboarded: true, displayName: 'Maya', styles: ['minimalist', 'casual', 'streetwear'], fitByGroup: {}, coldSensitivity: 'neutral', tempUnit: 'F', theme: 'light', autoDirtyCategories: [], repeatWindowDays: 5, haptics: true, customCategories: [] };
const social = { joined: true, showDemo: true };
const browser = await chromium.launch();
async function open(height = 932) {
  const ctx = await browser.newContext({ viewport: { width: 430, height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route('**/open-meteo.com/**', (r) => r.fulfill({ status: 503, body: '' }));
  await ctx.addInitScript(([p]) => { if (!localStorage.getItem('getup:v1:preferences')) localStorage.setItem('getup:v1:preferences', JSON.stringify(p)); }, [prefs, social]);
  const page = await ctx.newPage();
  await page.goto(base); await page.waitForTimeout(1400);
  await page.getByText('Try the sample closet').click(); await page.waitForTimeout(600);
  // Create a social profile through the real UI.
  await page.getByLabel('Social', { exact: true }).click(); await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Create profile' }).click(); await page.waitForTimeout(400);
  await page.getByPlaceholder('yourname').fill('maya.k');
  await page.getByPlaceholder('Your name').fill('Maya');
  await page.getByLabel('I agree to the Community Guidelines').click();
  await page.getByRole('button', { name: 'Create profile' }).last().click(); await page.waitForTimeout(3200);
  return { ctx, page };
}
let { ctx, page } = await open(2400);
await page.screenshot({ path: `${out}/social-tall.png` });
await ctx.close();
({ ctx, page } = await open());
await page.evaluate(() => window.scrollTo(0, 0));
await page.getByRole('button', { name: 'Recreate with my closet' }).first().evaluate((n) => n.scrollIntoView({ block: 'center' }));
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/social-post.png` });
await page.getByRole('button', { name: 'Recreate with my closet' }).first().click(); await page.waitForTimeout(900);
await page.screenshot({ path: `${out}/recreate.png` });
await browser.close();
console.log('done');
