// Compose store screenshots, feature graphic, social posts and OG image from real app captures.
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'fs';
import { resolve } from 'path';
const root = resolve('..');
const S = `${root}/marketing/screens`;
const NM = `${root}/node_modules/@expo-google-fonts`;
const fontCss = `
@font-face{font-family:Fraunces;font-weight:600;src:url(file://${NM}/fraunces/600SemiBold/Fraunces_600SemiBold.ttf)}
@font-face{font-family:Fraunces;font-weight:400;font-style:italic;src:url(file://${NM}/fraunces/400Regular_Italic/Fraunces_400Regular_Italic.ttf)}
@font-face{font-family:Inter;font-weight:400;src:url(file://${NM}/inter/400Regular/Inter_400Regular.ttf)}
@font-face{font-family:Inter;font-weight:600;src:url(file://${NM}/inter/600SemiBold/Inter_600SemiBold.ttf)}
*{box-sizing:border-box;margin:0}body{font-family:Inter}`;
const mark = readFileSync(`${root}/branding/logo/getup-lockup-horizontal.svg`, 'utf8');
const markRev = readFileSync(`${root}/branding/logo/getup-lockup-horizontal-reversed.svg`, 'utf8');
const C = { linen: '#F5F1EA', ink: '#1C1B19', clay: '#A24C31', sage: '#4F6249', night: '#121110', cream: '#F2EDE4' };

const phone = (img, w) => `<div style="width:${w}px;aspect-ratio:1290/2796;border-radius:${w * 0.12}px;background:${C.ink};padding:${w * 0.028}px;box-shadow:0 ${w * 0.05}px ${w * 0.12}px rgba(58,46,31,.28)">
  <div style="width:100%;height:100%;border-radius:${w * 0.095}px;overflow:hidden;background:#fff"><img src="file://${S}/${img}" style="width:100%;display:block"></div></div>`;

const store = (head, sub, img, dark = false) => `<html><head><style>${fontCss}</style></head>
<body style="width:1290px;height:2796px;background:${dark ? C.night : C.linen};display:flex;flex-direction:column;align-items:center;padding-top:190px;overflow:hidden">
<div style="font-family:Fraunces;font-weight:600;font-size:118px;line-height:1.05;letter-spacing:-2px;color:${dark ? C.cream : C.ink};text-align:center;max-width:1080px">${head}</div>
<div style="font-size:46px;line-height:1.35;color:${dark ? '#A39B8F' : '#5E5850'};text-align:center;max-width:960px;margin-top:40px">${sub}</div>
<div style="margin-top:110px">${phone(img, 920)}</div></body></html>`;

const jobs = [
  ['app-store/01-dressed-in-one-tap.png', 1290, 2796, store('Dressed in<br><i style="font-weight:400;color:#A24C31">one tap.</i>', 'A complete outfit every morning — from clothes you already own.', '01-today.png')],
  ['app-store/02-your-closet.png', 1290, 2796, store('Your closet,<br>organized.', 'Snap your clothes. Search, filter and track what’s clean.', '02-closet.png')],
  ['app-store/03-build-around.png', 1290, 2796, store('Build around<br>what you love.', 'Lock a favorite piece. Getup styles the rest.', '03-create.png')],
  ['app-store/04-plan-ahead.png', 1290, 2796, store('Ready for<br>what’s next.', 'Plan outfits for events, with the forecast built in.', '04-plan.png')],
  ['app-store/05-wear-more.png', 1290, 2796, store('Wear more of<br>what you own.', 'See what you actually wear — and rediscover the rest.', '06-profile.png')],
  ['play/feature-graphic-1024x500.png', 1024, 500, `<html><head><style>${fontCss}</style></head><body style="width:1024px;height:500px;background:${C.linen};display:flex;align-items:center;overflow:hidden;padding-left:70px;gap:40px">
    <div style="flex:1"><div style="width:250px">${mark}</div><div style="font-family:Fraunces;font-weight:600;font-size:54px;line-height:1.05;margin-top:26px;color:${C.ink}">Get up. Get dressed.<br><i style="font-weight:400;color:${C.clay}">Get going.</i></div></div>
    <div style="align-self:flex-start;margin-top:60px;margin-right:70px">${phone('01-today.png', 260)}</div></body></html>`],
  ['social/og-image-1200x630.png', 1200, 630, `<html><head><style>${fontCss}</style></head><body style="width:1200px;height:630px;background:${C.linen};display:flex;align-items:center;overflow:hidden;padding-left:90px;gap:40px">
    <div style="flex:1"><div style="width:280px">${mark}</div><div style="font-family:Fraunces;font-weight:600;font-size:66px;line-height:1.04;margin-top:30px;color:${C.ink}">Your closet.<br>Your weather.<br><i style="font-weight:400;color:${C.clay}">Your outfit.</i></div></div>
    <div style="align-self:flex-start;margin-top:70px;margin-right:90px">${phone('01-today.png', 300)}</div></body></html>`],
  ['social/instagram-post-1080x1350.png', 1080, 1350, `<html><head><style>${fontCss}</style></head><body style="width:1080px;height:1350px;background:${C.ink};color:${C.cream};padding:90px;overflow:hidden;position:relative">
    <div style="width:240px">${markRev}</div>
    <div style="font-family:Fraunces;font-weight:600;font-size:84px;line-height:1.04;margin-top:70px;max-width:470px">What should I wear today?</div>
    <div style="font-size:34px;line-height:1.4;color:#A39B8F;margin-top:30px;max-width:420px">Answered before your coffee’s ready.</div>
    <div style="position:absolute;right:70px;top:300px">${phone('01-today.png', 450)}</div></body></html>`],
  ['social/story-1080x1920.png', 1080, 1920, `<html><head><style>${fontCss}</style></head><body style="width:1080px;height:1920px;background:${C.linen};padding:120px 90px;overflow:hidden;display:flex;flex-direction:column;align-items:center">
    <div style="width:300px">${mark}</div>
    <div style="font-family:Fraunces;font-weight:600;font-size:104px;line-height:1.02;margin-top:70px;text-align:center;color:${C.ink}">Get up.<br>Get dressed.<br><i style="font-weight:400;color:${C.clay}">Get going.</i></div>
    <div style="margin-top:90px">${phone('01-today.png', 620)}</div></body></html>`],
  ['social/x-header-1500x500.png', 1500, 500, `<html><head><style>${fontCss}</style></head><body style="width:1500px;height:500px;background:${C.linen};display:flex;align-items:center;justify-content:space-between;padding:0 120px;overflow:hidden">
    <div style="font-family:Fraunces;font-weight:600;font-size:64px;line-height:1.05;color:${C.ink}">Get up. Get dressed.<br><i style="font-weight:400;color:${C.clay}">Get going.</i></div>
    <div style="width:360px">${mark}</div></body></html>`],
];

const browser = await chromium.launch();
for (const [file, w, h, html] of jobs) {
  const path = `${root}/marketing/${file}`;
  mkdirSync(path.slice(0, path.lastIndexOf('/')), { recursive: true });
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const tmp = `${root}/tools/.tmp-promo.html`;
  writeFileSync(tmp, html);
  await page.goto(`file://${tmp}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  await page.screenshot({ path });
  await page.close();
  console.log('wrote', file);
}
await browser.close();
rmSync(`${root}/tools/.tmp-promo.html`, { force: true });
