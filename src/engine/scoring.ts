/**
 * Soft-preference scoring. Every function returns 0..1 plus optional
 * human-readable reasons so the UI can explain *why* an outfit was chosen.
 *
 * Hard constraints (clean, available, weather extremes) live in filters.ts and
 * never reach this file.
 */
import { getCategory } from './categories';
import { outfitColorScore } from './colors';
import type { EngineContext, ScoreBreakdown, WeatherSnapshot } from './types';
import type { ClothingItem, Formality, ID, Occasion, StyleTag } from '@/types/models';

/** Starting weights. Rationale is documented in docs/RECOMMENDATION_ENGINE.md. */
export const WEIGHTS: ScoreBreakdown = {
  style: 0.22,
  color: 0.2,
  weather: 0.22,
  occasion: 0.14,
  preference: 0.12,
  rotation: 0.1,
};

// ---------------------------------------------------------------- weather

const SENSITIVITY_OFFSET = { runsCold: -4, neutral: 0, runsWarm: 4 } as const;

/** Feels-like temperature adjusted for the user's comfort preference and wind. */
export function effectiveTempC(w: WeatherSnapshot, sensitivity: EngineContext['coldSensitivity']): number {
  const windChill = w.windKph >= 30 ? -2 : w.windKph >= 20 ? -1 : 0;
  return w.feelsLikeC + SENSITIVITY_OFFSET[sensitivity] + windChill;
}

/** Target total upper-body warmth (top + outer layer) for a temperature. */
export function upperWarmthTarget(t: number): [number, number] {
  if (t >= 26) return [1, 2];
  if (t >= 20) return [1, 3];
  if (t >= 14) return [2, 4];
  if (t >= 8) return [4, 6];
  if (t >= 0) return [6, 8];
  return [7, 10];
}

export function bottomWarmthTarget(t: number): [number, number] {
  if (t >= 24) return [1, 2];
  if (t >= 16) return [1, 3];
  if (t >= 8) return [2, 3];
  return [3, 5];
}

export function isRainy(w?: WeatherSnapshot): boolean {
  return !!w && (w.precipProbability >= 50 || ['rain', 'drizzle', 'storm', 'snow'].includes(w.condition));
}

export function needsOuterLayer(w: WeatherSnapshot | undefined, t: number | undefined): boolean {
  if (!w || t === undefined) return false;
  return t < 14 || isRainy(w) || w.windKph >= 35;
}

function bandScore(value: number, [lo, hi]: [number, number]): number {
  if (value >= lo && value <= hi) return 1;
  const off = value < lo ? lo - value : value - hi;
  return Math.max(0, 1 - off * 0.3);
}

export function weatherScore(
  items: ClothingItem[],
  ctx: EngineContext,
): { score: number; reasons: string[]; warnings: string[] } {
  const w = ctx.weather;
  if (!w) return { score: 0.7, reasons: [], warnings: [] };
  const t = effectiveTempC(w, ctx.coldSensitivity);
  const reasons: string[] = [];
  const warnings: string[] = [];
  const cat = (i: ClothingItem) => getCategory(i.categoryId, ctx.customCategories);

  const upper = items.filter((i) => ['top', 'outerwear', 'onePiece'].includes(cat(i).slot));
  const bottom = items.find((i) => cat(i).slot === 'bottom');
  const onePiece = items.find((i) => cat(i).slot === 'onePiece');
  const outer = items.find((i) => cat(i).slot === 'outerwear');
  const shoes = items.find((i) => cat(i).slot === 'footwear');

  const upperWarmth = upper.reduce((s, i) => s + i.warmth, 0);
  const upperS = bandScore(upperWarmth, upperWarmthTarget(t));
  const bottomS = bottom
    ? bandScore(bottom.warmth, bottomWarmthTarget(t))
    : onePiece
      ? bandScore(onePiece.warmth, bottomWarmthTarget(t)) * 0.9 + 0.1
      : 0.7;

  let score = upperS * 0.55 + bottomS * 0.3 + 0.15;

  if (isRainy(w)) {
    const shoesOk = shoes ? shoes.waterResistant : false;
    const outerOk = outer ? outer.waterResistant : false;
    if (shoes && cat(shoes).footwearKind === 'sandal') score -= 0.25;
    if (shoesOk) score += 0.1;
    else score -= 0.15;
    if (outerOk) {
      score += 0.08;
      reasons.push('Rain-ready outer layer');
    } else if (!outer) {
      score -= 0.15;
      warnings.push(`${Math.round(w.precipProbability)}% chance of rain — grab an umbrella`);
    }
    if (shoesOk) reasons.push('Footwear handles wet ground');
  }

  if (t >= 26 && upperS >= 0.9) reasons.push('Light layers for the heat');
  else if (t < 8 && upperS >= 0.9) reasons.push('Layered up for the cold');
  else if (upperS >= 0.9 && bottomS >= 0.9) reasons.push('Right weight for today’s temperature');

  if (t < 14 && !outer && !onePiece && upperWarmth < upperWarmthTarget(t)[0]) {
    warnings.push('Might feel chilly without a jacket');
  }
  if (w.windKph >= 35 && outer) reasons.push('Outer layer blocks the wind');

  return { score: clamp01(score), reasons, warnings };
}

// ---------------------------------------------------------------- occasion

export const OCCASION_FORMALITY: Record<Occasion, [Formality, Formality]> = {
  everyday: [1, 3],
  class: [1, 3],
  work: [3, 4],
  date: [2, 4],
  party: [2, 4],
  formalEvent: [4, 5],
  interview: [4, 5],
  workout: [1, 1],
  outdoors: [1, 2],
  travel: [1, 3],
};

export const OCCASION_LABELS: Record<Occasion, string> = {
  everyday: 'Everyday',
  class: 'Class',
  work: 'Work',
  date: 'Date',
  party: 'Party',
  formalEvent: 'Formal event',
  interview: 'Interview',
  workout: 'Workout',
  outdoors: 'Outdoors',
  travel: 'Travel',
};

export function formalityBand(ctx: Pick<EngineContext, 'occasion' | 'targetFormality'>): [number, number] {
  if (ctx.targetFormality) {
    const f = ctx.targetFormality;
    return [Math.max(1, f - 1), f];
  }
  return OCCASION_FORMALITY[ctx.occasion];
}

export function occasionScore(items: ClothingItem[], ctx: EngineContext): { score: number; reasons: string[] } {
  const core = items.filter((i) => getCategory(i.categoryId, ctx.customCategories).slot !== 'accessory');
  if (!core.length) return { score: 0.5, reasons: [] };
  const band = formalityBand(ctx);
  const avg = core.reduce((s, i) => s + i.formality, 0) / core.length;
  let score = bandScore(avg, band);
  const reasons: string[] = [];

  if (ctx.occasion === 'workout') {
    const athletic = core.filter((i) => i.styleTags.includes('athletic')).length / core.length;
    score = score * 0.4 + athletic * 0.6;
    if (athletic >= 0.66) reasons.push('Built to move in');
  } else if (ctx.occasion === 'outdoors') {
    const outdoorish = core.filter((i) => i.styleTags.some((t) => t === 'outdoor' || t === 'athletic' || t === 'workwear')).length;
    score = Math.min(1, score + outdoorish * 0.05);
  }

  if (score >= 0.9 && ctx.occasion !== 'everyday') {
    reasons.push(`Fits a ${OCCASION_LABELS[ctx.occasion].toLowerCase()} dress code`);
  }
  return { score: clamp01(score), reasons };
}

// ---------------------------------------------------------------- style

const STYLE_FAMILIES: StyleTag[][] = [
  ['athletic', 'streetwear', 'casual'],
  ['formal', 'businessCasual', 'smartCasual', 'classic', 'preppy', 'minimalist'],
  ['outdoor', 'workwear', 'vintage', 'casual'],
  ['trend', 'streetwear', 'vintage', 'minimalist'],
  ['minimalist', 'casual', 'smartCasual'],
];

export const STYLE_LABELS: Record<StyleTag, string> = {
  streetwear: 'Streetwear',
  minimalist: 'Minimalist',
  casual: 'Casual',
  smartCasual: 'Smart casual',
  athletic: 'Athletic',
  vintage: 'Vintage',
  preppy: 'Preppy',
  businessCasual: 'Business casual',
  formal: 'Formal',
  workwear: 'Workwear',
  outdoor: 'Outdoor',
  classic: 'Classic',
  trend: 'Trend-driven',
};

export function tagAffinity(a: StyleTag, b: StyleTag): number {
  if (a === b) return 1;
  return STYLE_FAMILIES.some((f) => f.includes(a) && f.includes(b)) ? 0.8 : 0.4;
}

function itemPairStyle(a: ClothingItem, b: ClothingItem): number {
  if (!a.styleTags.length || !b.styleTags.length) return 0.75;
  let best = 0;
  for (const x of a.styleTags) for (const y of b.styleTags) best = Math.max(best, tagAffinity(x, y));
  return best;
}

export function styleScore(items: ClothingItem[], ctx: EngineContext): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  const core = items.filter((i) => getCategory(i.categoryId, ctx.customCategories).slot !== 'accessory');
  let pair = 0;
  let n = 0;
  for (let i = 0; i < core.length; i++)
    for (let j = i + 1; j < core.length; j++) {
      pair += itemPairStyle(core[i], core[j]);
      n++;
    }
  const cohesion = n ? pair / n : 0.75;

  // Formality spread: sneakers with a blazer is fine, flip-flops with a suit is not.
  const fs = core.map((i) => i.formality);
  const spread = fs.length ? Math.max(...fs) - Math.min(...fs) : 0;
  const spreadPenalty = spread >= 3 ? 0.25 : spread === 2 ? 0.05 : 0;

  // Match against the styles the user said they like.
  let prefMatch = 0.6;
  if (ctx.preferredStyles.length) {
    const scores = core.map((i) =>
      i.styleTags.length
        ? Math.max(...i.styleTags.map((t) => Math.max(...ctx.preferredStyles.map((p) => tagAffinity(t, p)))))
        : 0.6,
    );
    prefMatch = scores.reduce((s, x) => s + x, 0) / Math.max(1, scores.length);
    const dominant = dominantStyle(core);
    if (dominant && ctx.preferredStyles.includes(dominant) && prefMatch >= 0.8) {
      reasons.push(`Leans ${STYLE_LABELS[dominant].toLowerCase()}, like you asked`);
    }
  }

  // Fit balance: two oversized pieces read sloppy unless the look is street.
  const fits = core.map((i) => i.fit).filter(Boolean);
  const oversizedCount = fits.filter((f) => f === 'oversized').length;
  const streety = core.some((i) => i.styleTags.includes('streetwear'));
  const fitPenalty = oversizedCount >= 2 && !streety ? 0.08 : 0;

  // Respect per-category fit preferences when the item has a fit recorded.
  let fitBonus = 0;
  for (const i of core) {
    const want = ctx.fitByGroup[getCategory(i.categoryId, ctx.customCategories).group];
    if (want && i.fit === want) fitBonus += 0.02;
  }

  const score = cohesion * 0.55 + prefMatch * 0.45 - spreadPenalty - fitPenalty + fitBonus;
  if (cohesion >= 0.9 && !reasons.length) reasons.push('Pieces share the same style language');
  return { score: clamp01(score), reasons };
}

export function dominantStyle(items: ClothingItem[]): StyleTag | undefined {
  const counts = new Map<StyleTag, number>();
  for (const i of items) for (const t of i.styleTags) counts.set(t, (counts.get(t) ?? 0) + 1);
  let best: StyleTag | undefined;
  let max = 0;
  for (const [t, c] of counts) if (c > max) [best, max] = [t, c];
  return best;
}

// ---------------------------------------------------------------- color

export function colorScore(items: ClothingItem[], ctx: EngineContext): { score: number; reasons: string[] } {
  const colors = items.flatMap((i) => {
    const slot = getCategory(i.categoryId, ctx.customCategories).slot;
    const w = slot === 'accessory' ? 0.4 : slot === 'footwear' ? 0.7 : 1;
    return [
      { color: i.primaryColor, weight: w },
      ...i.secondaryColors.map((c) => ({ color: c, weight: w * 0.35 })),
    ];
  });
  let { score, note } = outfitColorScore(colors);
  // Two busy patterns compete; one pattern plus solids is the safe default.
  const patterned = items.filter((i) => i.pattern !== 'solid' && i.pattern !== 'texture').length;
  if (patterned >= 2) score -= 0.12 * (patterned - 1);
  return { score: clamp01(score), reasons: note && score >= 0.85 ? [note] : [] };
}

// ---------------------------------------------------------------- preference (learned)

/**
 * Feedback → affinity. This is a transparent counting model, not ML:
 * each like/dislike nudges the involved items and item pairs, decaying
 * with age (half-life 60 days) so tastes can change.
 */
export interface Affinity {
  item: Map<ID, number>;
  pair: Map<string, number>;
}

const FEEDBACK_VALUE = { like: 1, dislike: -1, notMyStyle: -1.5 } as const;

export function pairKey(a: ID, b: ID) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function buildAffinity(ctx: Pick<EngineContext, 'feedback' | 'wearLogs' | 'date'>): Affinity {
  const item = new Map<ID, number>();
  const pair = new Map<string, number>();
  const now = Date.parse(ctx.date);
  const add = (ids: ID[], v: number) => {
    for (const id of ids) item.set(id, (item.get(id) ?? 0) + v);
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++) {
        const k = pairKey(ids[i], ids[j]);
        pair.set(k, (pair.get(k) ?? 0) + v);
      }
  };
  for (const f of ctx.feedback) {
    const ageDays = Math.max(0, (now - Date.parse(f.createdAt)) / 86_400_000);
    add(f.itemIds, FEEDBACK_VALUE[f.kind] * Math.pow(0.5, ageDays / 60));
  }
  // Actually wearing an outfit is a mild positive signal.
  for (const log of ctx.wearLogs) {
    const ageDays = Math.max(0, (now - Date.parse(log.date)) / 86_400_000);
    add(log.itemIds, 0.3 * Math.pow(0.5, ageDays / 60));
  }
  return { item, pair };
}

export function preferenceScore(items: ClothingItem[], aff: Affinity): { score: number; reasons: string[] } {
  let s = 0;
  for (const i of items) {
    s += (aff.item.get(i.id) ?? 0) * 0.15;
    if (i.favorite) s += 0.25;
  }
  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++) s += (aff.pair.get(pairKey(items[i].id, items[j].id)) ?? 0) * 0.35;
  const score = 1 / (1 + Math.exp(-s)); // squash to 0..1, 0.5 = no signal
  const reasons: string[] = [];
  if (items.some((i) => i.favorite)) reasons.push('Includes a favorite');
  else if (s > 0.6) reasons.push('Similar to outfits you liked');
  return { score, reasons };
}

// ---------------------------------------------------------------- rotation

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
}

export function rotationScore(items: ClothingItem[], ctx: EngineContext): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  const core = items.filter((i) => getCategory(i.categoryId, ctx.customCategories).slot !== 'accessory');
  let s = 0;
  let forgotten: ClothingItem | undefined;
  for (const i of core) {
    const slot = getCategory(i.categoryId, ctx.customCategories).slot;
    // Shoes and outerwear repeat naturally; don't punish them much.
    const tolerance = slot === 'footwear' || slot === 'outerwear' ? 0.3 : 1;
    if (!i.lastWornOn) {
      s += 0.9;
      continue;
    }
    const d = daysBetween(i.lastWornOn, ctx.date);
    if (d < ctx.repeatWindowDays) s += 1 - tolerance * (1 - d / ctx.repeatWindowDays) * 0.8;
    else s += 1;
    if (d >= 21 && !forgotten) forgotten = i;
  }
  let score = core.length ? s / core.length : 1;

  // Exact outfit worn recently → strong repeat penalty.
  const ids = new Set(core.map((i) => i.id));
  for (const log of ctx.wearLogs) {
    const d = daysBetween(log.date, ctx.date);
    if (d < 0 || d > 14) continue;
    const overlap = log.itemIds.filter((x) => ids.has(x)).length;
    if (overlap >= Math.min(3, ids.size)) score -= 0.35 * (1 - d / 15);
  }
  if (forgotten) reasons.push(`Brings back your ${forgotten.name.toLowerCase()}`);
  return { score: clamp01(score), reasons };
}

export function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}
