/**
 * Reproducible recommendation benchmark. Run with:  npm run bench
 *
 * Providers:
 *  - deterministic : src/engine (always runs; on-device, offline)
 *  - jev           : runs ONLY if JEV_API_KEY is set (paid API; not run by default)
 *  - local-ml      : not implemented (no training data yet); reported as such
 *
 * Objective metrics are computed automatically. Recommendation *quality* needs
 * human raters: the run writes bench/out/rating-sheet.csv for that. No numbers
 * are invented: providers that didn't run are reported as "not run".
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

import { SAMPLE_CLOSET } from '@/data/sampleCloset';
import { getCategory } from '@/engine/categories';
import { generateOutfits } from '@/engine/generate';
import { createItem } from '@/engine/itemFactory';
import { effectiveTempC, formalityBand, isRainy } from '@/engine/scoring';
import type { EngineContext, WeatherSnapshot } from '@/engine/types';
import type { ClothingItem, Occasion } from '@/types/models';

const OUT = join(__dirname, 'out');

// ---- fixed inputs ----------------------------------------------------------
const closet = (dirty: string[] = []): ClothingItem[] =>
  SAMPLE_CLOSET.map((s, i) => createItem(`s${i}`, { ...s, clean: !dirty.includes(s.name!) }, [], '2026-10-01T00:00:00Z'));
const small = (): ClothingItem[] => closet().filter((i) => ['White crew tee', 'Grey hoodie', 'Mid-wash jeans', 'Khaki chinos', 'White leather sneakers'].includes(i.name));
const w = (feels: number, precip = 5, condition: WeatherSnapshot['condition'] = 'clear', wind = 10): WeatherSnapshot => ({ feelsLikeC: feels, tempC: feels, highC: feels + 4, lowC: feels - 5, precipProbability: precip, windKph: wind, condition });

export const SCENARIOS: { id: string; items: () => ClothingItem[]; occasion: Occasion; weather?: WeatherSnapshot }[] = [
  { id: 'mild-everyday', items: () => closet(), occasion: 'everyday', weather: w(17) },
  { id: 'hot-everyday', items: () => closet(), occasion: 'everyday', weather: w(31) },
  { id: 'freezing-class', items: () => closet(), occasion: 'class', weather: w(-4, 10, 'snow') },
  { id: 'rain-work', items: () => closet(), occasion: 'work', weather: w(11, 85, 'rain') },
  { id: 'windy-outdoors', items: () => closet(), occasion: 'outdoors', weather: w(9, 20, 'cloudy', 40) },
  { id: 'interview', items: () => closet(), occasion: 'interview', weather: w(18) },
  { id: 'date-night', items: () => closet(), occasion: 'date', weather: w(14) },
  { id: 'workout', items: () => closet(), occasion: 'workout', weather: w(20) },
  { id: 'laundry-day', items: () => closet(['White crew tee', 'Black boxy tee', 'Mid-wash jeans', 'Black straight jeans']), occasion: 'everyday', weather: w(16) },
  { id: 'tiny-closet', items: small, occasion: 'everyday', weather: w(16) },
  { id: 'no-weather', items: () => closet(), occasion: 'everyday' },
];

const ctxFor = (s: (typeof SCENARIOS)[number]): EngineContext => ({
  items: s.items(),
  date: '2026-10-21',
  weather: s.weather,
  occasion: s.occasion,
  preferredStyles: ['minimalist', 'casual'],
  fitByGroup: {},
  coldSensitivity: 'neutral',
  wearLogs: [],
  feedback: [],
  customCategories: [],
  repeatWindowDays: 5,
  seed: 7,
});

// ---- objective checks (no human judgment) ---------------------------------
function checks(items: ClothingItem[], ctx: EngineContext) {
  const slot = (i: ClothingItem) => getCategory(i.categoryId).slot;
  const core = items.filter((i) => slot(i) !== 'accessory');
  const t = ctx.weather ? effectiveTempC(ctx.weather, ctx.coldSensitivity) : undefined;
  const [lo, hi] = formalityBand(ctx);
  const avgF = core.reduce((s, i) => s + i.formality, 0) / Math.max(1, core.length);
  return {
    complete: (core.some((i) => slot(i) === 'top') && core.some((i) => slot(i) === 'bottom')) || core.some((i) => slot(i) === 'onePiece'),
    hasShoes: core.some((i) => slot(i) === 'footwear'),
    noDirty: items.every((i) => i.clean && i.availability === 'available'),
    weatherOk:
      t === undefined ||
      ((t >= 5 || !items.some((i) => i.categoryId === 'shorts' || i.categoryId === 'sandals')) &&
        (t < 27 || !items.some((i) => i.categoryId === 'coat' || i.categoryId === 'sweater')) &&
        (!isRainy(ctx.weather) || !items.some((i) => i.categoryId === 'sandals'))),
    occasionOk: avgF >= lo - 0.5 && avgF <= hi + 0.5,
  };
}

// ---- providers -------------------------------------------------------------
interface Provider {
  name: string;
  available: () => boolean;
  recommend: (ctx: EngineContext) => Promise<ClothingItem[] | undefined>;
}

const deterministic: Provider = {
  name: 'deterministic',
  available: () => true,
  recommend: async (ctx) => {
    const r = generateOutfits(ctx, { count: 1 }).outfits[0];
    return r?.itemIds.map((id) => ctx.items.find((i) => i.id === id)!);
  },
};

/**
 * Jev: asks one Score question per candidate outfit and picks the best. The
 * request shape follows docs.typesafe.ai (state + typed questions); VERIFY it
 * against the current docs before spending money. Candidates come from the
 * deterministic engine (top 5), so Jev acts as a re-ranker — the realistic use.
 */
const jev: Provider = {
  name: 'jev',
  available: () => !!process.env.JEV_API_KEY,
  recommend: async (ctx) => {
    const cands = generateOutfits(ctx, { count: 5 }).outfits;
    if (!cands.length) return undefined;
    const describe = (ids: string[]) => ids.map((id) => ctx.items.find((i) => i.id === id)!).map((i) => `${i.primaryColor} ${getCategory(i.categoryId).label}`).join(', ');
    const state = { occasion: ctx.occasion, weather: ctx.weather, preferredStyles: ctx.preferredStyles, candidates: cands.map((c, k) => ({ id: k, outfit: describe(c.itemIds) })) };
    const questions = Object.fromEntries(cands.map((_, k) => [`q${k}`, { type: 'score', question: `How suitable is candidate ${k} for this occasion and weather?`, levels: 5 }]));
    const res = await fetch('https://api.typesafe.ai/v1/systemone', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.JEV_API_KEY}` },
      body: JSON.stringify({ state: JSON.stringify(state), questions }),
    });
    if (!res.ok) throw new Error(`jev ${res.status}`);
    const json = await res.json();
    const scores = cands.map((_, k) => Number(json?.answers?.[`q${k}`]?.score ?? json?.[`q${k}`]?.score ?? 0));
    const best = scores.indexOf(Math.max(...scores));
    return cands[best].itemIds.map((id) => ctx.items.find((i) => i.id === id)!);
  },
};

const PROVIDERS = [deterministic, jev];

describe('recommendation benchmark', () => {
  jest.setTimeout(120_000);
  it('runs all available providers on fixed scenarios', async () => {
    mkdirSync(OUT, { recursive: true });
    const summary: Record<string, unknown> = { date: new Date().toISOString(), scenarios: SCENARIOS.length, providers: {} };
    const rows: string[] = ['provider,scenario,outfit,suitability_1to5,notes'];
    for (const p of PROVIDERS) {
      if (!p.available()) {
        (summary.providers as Record<string, unknown>)[p.name] = { status: 'not run', reason: p.name === 'jev' ? 'JEV_API_KEY not set (paid API)' : 'unavailable' };
        continue;
      }
      const lat: number[] = [];
      let failures = 0;
      const agg = { complete: 0, hasShoes: 0, noDirty: 0, weatherOk: 0, occasionOk: 0 };
      for (const s of SCENARIOS) {
        const ctx = ctxFor(s);
        const runs = p.name === 'deterministic' ? 50 : 1;
        let out: ClothingItem[] | undefined;
        for (let k = 0; k < runs; k++) {
          const t0 = performance.now();
          try {
            out = await p.recommend(ctx);
          } catch {
            failures++;
          }
          lat.push(performance.now() - t0);
        }
        if (out) {
          const c = checks(out, ctx);
          for (const key of Object.keys(agg) as (keyof typeof agg)[]) agg[key] += Number(c[key]);
          rows.push(`${p.name},${s.id},"${out.map((i) => i.name).join(' + ')}",,`);
        } else rows.push(`${p.name},${s.id},(none),,`);
      }
      lat.sort((a, b) => a - b);
      (summary.providers as Record<string, unknown>)[p.name] = {
        status: 'ran',
        latencyMs: { p50: +lat[Math.floor(lat.length * 0.5)].toFixed(2), p95: +lat[Math.floor(lat.length * 0.95)].toFixed(2), samples: lat.length },
        failures,
        objectivePassRate: Object.fromEntries(Object.entries(agg).map(([k, v]) => [k, `${v}/${SCENARIOS.length}`])),
        offline: p.name === 'deterministic',
        costPer1000: p.name === 'deterministic' ? 0 : 'see docs/JEV_RESEARCH.md',
      };
    }
    (summary.providers as Record<string, unknown>)['local-ml'] = { status: 'not run', reason: 'no labeled feedback data yet to train on' };
    writeFileSync(join(OUT, 'results.json'), JSON.stringify(summary, null, 2));
    writeFileSync(join(OUT, 'rating-sheet.csv'), rows.join('\n'));
    console.log(JSON.stringify(summary, null, 2));
    expect((summary.providers as Record<string, { status: string }>).deterministic.status).toBe('ran');
  });
});
