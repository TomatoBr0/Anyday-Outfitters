// Render the launch film frame-by-frame and encode with ffmpeg.
// usage: node video.mjs <vertical|horizontal> <out.mp4> [--teaser] [--fps 30] [--keyframes t1,t2,...] [--audio file]
import { chromium } from 'playwright';
import { execFileSync } from 'child_process';
import { mkdirSync, rmSync } from 'fs';
import { resolve } from 'path';

const args = process.argv.slice(2);
const format = args[0] ?? 'vertical';
const out = resolve(args[1] ?? `../marketing/video/getup-launch-${format}.mp4`);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const fps = +opt('--fps', 30);
const teaser = args.includes('--teaser');
const keyframes = opt('--keyframes');
const audio = opt('--audio');
const [W, H] = format === 'vertical' ? [1080, 1920] : [1920, 1080];

// Teaser = hand-picked cuts from the main timeline (15 s total).
const segments = teaser ? [[5.8, 9.0], [18.4, 21.4], [25.3, 31.3], [42.2, 45]] : [[0, 45]];
const times = [];
for (const [a, b] of segments) for (let t = a; t < b - 1e-6; t += 1 / fps) times.push(+t.toFixed(4));

const page = await (await chromium.launch()).newPage({ viewport: { width: W, height: H } });
await page.goto(`file://${resolve('../marketing/video/src/launch.html')}?f=${format}`);
await page.evaluate(() => window.ready);

if (keyframes) {
  for (const t of keyframes.split(',').map(Number)) {
    await page.evaluate((x) => window.seek(x), t);
    await page.screenshot({ path: `${out.replace(/\.mp4$/, '')}-${t}.png` });
  }
  process.exit(0);
}

const dir = resolve(`../.video-frames-${format}${teaser ? '-teaser' : ''}`);
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
for (let i = 0; i < times.length; i++) {
  await page.evaluate((x) => window.seek(x), times[i]);
  await page.screenshot({ path: `${dir}/f${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 92 });
  if (i % 150 === 0) console.log(`frame ${i}/${times.length}`);
}
const ff = ['-y', '-framerate', String(fps), '-i', `${dir}/f%05d.jpg`];
if (audio) ff.push('-i', resolve(audio), '-shortest', '-c:a', 'aac', '-b:a', '160k');
ff.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', out);
execFileSync('ffmpeg', ff, { stdio: 'inherit' });
rmSync(dir, { recursive: true, force: true });
console.log('wrote', out);
process.exit(0);
