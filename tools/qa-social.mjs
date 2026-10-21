// End-to-end QA of the social features on the web build (iPhone viewport, demo backend).
// usage: node qa-social.mjs <baseUrl> <outDir>
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const base = process.argv[2] ?? 'http://localhost:8082';
const out = process.argv[3] ?? './qa-social-out';
mkdirSync(out, { recursive: true });
const results = [];
const errors = [];
const check = (name, ok) => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); };

const prefs = { onboarded: true, displayName: 'Maya', styles: ['minimalist', 'casual', 'streetwear'], fitByGroup: {}, coldSensitivity: 'neutral', tempUnit: 'F', theme: process.argv[4] ?? 'light', autoDirtyCategories: ['tshirt'], repeatWindowDays: 5, haptics: true, customCategories: [] };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await ctx.addInitScript((p) => { if (!localStorage.getItem('getup:v1:preferences')) localStorage.setItem('getup:v1:preferences', JSON.stringify(p)); }, prefs);
await ctx.route('**/open-meteo.com/**', (r) => r.fulfill({ status: 503, body: '' }));
const page = await ctx.newPage();
// RN-web Alert is a no-op; auto-pick the first option of any Alert by stubbing window.confirm/alert isn't enough, so we avoid Alert flows here.
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 200)));
const shot = async (n) => { await page.waitForTimeout(400); await page.screenshot({ path: `${out}/${n}.png` }); };
const tapTop = async (loc) => {
  const n = await loc.count();
  for (let i = 0; i < n; i++) {
    const el = loc.nth(i);
    if (!(await el.isVisible().catch(() => false))) continue;
    await el.evaluate((node) => node.scrollIntoView({ block: 'center' })).catch(() => {});
    await page.waitForTimeout(120);
    const box = await el.boundingBox(); if (!box) continue;
    const ok = await el.evaluate((node, b) => { const h = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2); return !!h && (node === h || node.contains(h)); }, box);
    if (ok) return el.click();
  }
  throw new Error('no on-top match: ' + loc);
};
const seen = async (t) => {
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

await page.goto(base);
await page.waitForTimeout(1500);
await page.getByText('Try the sample closet').click();
await page.waitForTimeout(700);

// Social tab + demo feed
await tapTop(page.getByLabel('Social', { exact: true }));
await page.waitForTimeout(700);
check('Social tab opens with demo banner', await seen('Demo mode'));
check('Discover feed shows demo posts', await seen('jules.layers') || await seen('noor.minimal'));
await shot('s01-discover');

// Interactions require a profile
await tapTop(page.getByRole('button', { name: 'Create profile' }));
await page.waitForTimeout(500);
await page.getByPlaceholder('yourname').fill('maya.k');
await page.getByPlaceholder('Your name').fill('Maya');
await page.getByPlaceholder('A line about your style').fill('Neutrals, mostly.');
await tapTop(page.getByRole('button', { name: 'Minimalist', exact: true }));
await tapTop(page.getByLabel('I agree to the Community Guidelines'));
await shot('s02-create-profile');
await tapTop(page.getByRole('button', { name: 'Create profile' }));
await page.waitForTimeout(600);
check('profile created (banner gone)', !(await seen('Make your style profile')));

// Like a post (optimistic count change)
const likeBtn = page.getByLabel('Like', { exact: true }).first();
await tapTop(page.getByLabel('Like', { exact: true }));
await page.waitForTimeout(300);
check('like toggles to Unlike', (await page.getByLabel('Unlike', { exact: true }).count()) > 0);
void likeBtn;

// Save
await tapTop(page.getByLabel('Save', { exact: true }));
await page.waitForTimeout(250);
check('save confirms', await seen('Saved to inspiration'));

// Recreate With My Closet on the cream hoodie post
await page.getByText('Cream hoodie + light-wash jeans', { exact: false }).first().scrollIntoViewIfNeeded();
const card = page.getByText('Cream hoodie + light-wash jeans', { exact: false }).first();
await card.evaluate((n) => n.scrollIntoView({ block: 'center' }));
await tapTop(page.getByRole('button', { name: 'Recreate with my closet' }));
await page.waitForTimeout(800);
check('recreate screen shows similarity', await seen('Similarity'));
check('recreate labels matches honestly', (await seen('Close match')) || (await seen('Stand-in')) || (await seen('Exact match')));
await shot('s03-recreate');
await page.waitForTimeout(2800); // let the toast clear
await tapTop(page.getByRole('button', { name: 'Save outfit' }));
await page.waitForTimeout(250);
check('recreated outfit saved', await seen('Saved to your outfits'));
await tapTop(page.getByLabel('Back'));
await page.waitForTimeout(400);

// Open post detail and comment
await tapTop(page.getByLabel('Open post'));
await page.waitForTimeout(500);
await page.getByPlaceholder('Add a comment…').fill('Love this palette');
await tapTop(page.getByRole('button', { name: 'Post', exact: true }));
await page.waitForTimeout(300);
check('comment appears', await seen('Love this palette'));
await shot('s04-post-detail');
await tapTop(page.getByLabel('Back'));
await page.waitForTimeout(300);

// Follow a private account → request
await tapTop(page.getByLabel('Search people and styles'));
await page.waitForTimeout(400);
await page.getByPlaceholder('People, @usernames, #styles, pieces').fill('sky');
await page.waitForTimeout(300);
await tapTop(page.getByRole('button', { name: 'Follow' }));
await page.waitForTimeout(300);
check('private account follow becomes a request', await seen('Requested'));
await page.getByPlaceholder('People, @usernames, #styles, pieces').fill('outdoor');
await page.waitForTimeout(300);
check('search finds posts by style', await seen('Outfits'));
await shot('s05-search');
await page.getByPlaceholder('People, @usernames, #styles, pieces').fill('noor');
await page.waitForTimeout(300);
await tapTop(page.getByRole('button', { name: 'Follow' }));
await page.waitForTimeout(200);
await tapTop(page.getByLabel('Back'));
await page.waitForTimeout(300);

// Following feed
await tapTop(page.getByRole('tab', { name: 'Following' }));
await page.waitForTimeout(400);
check('following feed shows followed account', await seen('noor.minimal'));
await shot('s06-following');

// Compose a post from Today's outfit
await tapTop(page.getByLabel('Today', { exact: true }));
await page.waitForTimeout(500);
await tapTop(page.getByLabel('Share outfit'));
await page.waitForTimeout(600);
await page.getByPlaceholder('What’s the vibe?').fill('Monday neutrals from my own closet');
await shot('s07-compose');
await tapTop(page.getByRole('button', { name: 'Preview' }));
await page.waitForTimeout(400);
check('preview shown before publishing', await seen('Everyone can see this'));
await shot('s08-preview');
await tapTop(page.getByRole('button', { name: 'Publish' }));
await page.waitForTimeout(800);
check('post published and opened', await seen('Monday neutrals from my own closet'));

// Own profile
await tapTop(page.getByLabel('Back'));
await page.waitForTimeout(300);
await tapTop(page.getByLabel('You', { exact: true }));
await page.waitForTimeout(400);
await tapTop(page.getByText('My social profile', { exact: true }));
await page.waitForTimeout(500);
check('own profile shows post grid', await seen('@maya.k') && (await seen('Posts')));
await shot('s09-profile');

// Persistence
await page.goto(base);
await page.waitForTimeout(1800);
await tapTop(page.getByLabel('Social', { exact: true }));
await page.waitForTimeout(500);
await tapTop(page.getByRole('tab', { name: 'Following' }));
await page.waitForTimeout(400);
check('my post persists after reload', await seen('Monday neutrals'));

// Saved + collections
await tapTop(page.getByLabel('You', { exact: true }));
await page.waitForTimeout(300);
await tapTop(page.getByText('Saved inspiration', { exact: true }));
await page.waitForTimeout(400);
await page.getByPlaceholder('New collection (e.g. School outfits)').fill('School outfits');
await tapTop(page.getByRole('button', { name: 'Create' }));
await page.waitForTimeout(300);
check('collection created', await seen('School outfits (0)'));
await shot('s10-saved');
await tapTop(page.getByLabel('Back'));

// Social settings
await page.waitForTimeout(300);
await tapTop(page.getByText('Social settings', { exact: true }));
await page.waitForTimeout(400);
check('social settings open', await seen('Blocked accounts'));
await shot('s11-settings');

console.log('\nerrors:', errors.length, errors.slice(0, 5));
const failed = results.filter((r) => !r.ok).length;
console.log(`${results.length - failed}/${results.length} social checks passed`);
await browser.close();
process.exit(failed ? 1 : 0);
