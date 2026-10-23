/**
 * Outfit generator.
 *
 * 1. Hard filters: clean + available (unless overridden), weather extremes.
 * 2. Pre-rank each slot's candidates and keep the top K so enumeration stays fast.
 * 3. Enumerate valid structures (top+bottom or one-piece, + shoes, ± outer layer).
 * 4. Score every combination with the weighted model in scoring.ts.
 * 5. Pick a diverse set, then dress it with weather-appropriate accessories.
 *
 * Pure and synchronous — runs offline in a few milliseconds on a phone.
 */
import { getCategory, suitsWardrobe } from './categories';
import {
  WEIGHTS,
  buildAffinity,
  clamp01,
  colorScore,
  dominantStyle,
  effectiveTempC,
  formalityBand,
  isRainy,
  needsOuterLayer,
  occasionScore,
  preferenceScore,
  rotationScore,
  styleScore,
  weatherScore,
  type Affinity,
  STYLE_LABELS,
  daysBetween,
} from './scoring';
import type {
  EngineContext,
  EngineIssue,
  EngineResult,
  Recommendation,
  ScoreBreakdown,
} from './types';
import type { ClothingItem, ID, Slot } from '@/types/models';

const K_CORE = 12;
const K_SHOES = 6;
const K_OUTER = 4;

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function isWearable(i: ClothingItem) {
  return i.clean && i.availability === 'available';
}

export function outfitSignature(ids: ID[]) {
  return [...ids].sort().join('+');
}

type Pools = Record<Slot, ClothingItem[]>;

function emptyPools(): Pools {
  return { top: [], bottom: [], onePiece: [], outerwear: [], footwear: [], accessory: [] };
}

function slotOf(i: ClothingItem, ctx: EngineContext): Slot {
  return getCategory(i.categoryId, ctx.customCategories).slot;
}

/** Apply hard constraints and return per-slot pools plus any issues to surface. */
export function buildPools(ctx: EngineContext): { pools: Pools; issues: EngineIssue[]; locked: ClothingItem[] } {
  const issues: EngineIssue[] = [];
  const all = emptyPools();
  const wearable = emptyPools();
  const locked = ctx.items.filter((i) => ctx.lockedItemIds?.includes(i.id));

  for (const i of ctx.items) {
    if (!suitsWardrobe(i.categoryId, ctx.clothesFor) && !ctx.lockedItemIds?.includes(i.id)) continue;
    const s = slotOf(i, ctx);
    all[s].push(i);
    if (ctx.allowUnavailable || isWearable(i)) wearable[s].push(i);
  }

  const pools = wearable;

  // Weather hard limits — only applied when an alternative exists, otherwise we
  // keep the item and tell the user why the pick is a compromise.
  if (ctx.weather) {
    const t = effectiveTempC(ctx.weather, ctx.coldSensitivity);
    const restrict = (slot: Slot, keep: (i: ClothingItem) => boolean, msg: string) => {
      const kept = pools[slot].filter(keep);
      if (kept.length && kept.length < pools[slot].length) pools[slot] = kept;
      else if (!kept.length && pools[slot].length) issues.push({ kind: 'weatherFallback', message: msg });
    };
    if (t < 5) {
      restrict('bottom', (i) => i.warmth >= 2, 'Only light bottoms are clean — it’s cold out.');
      restrict('footwear', (i) => getCategory(i.categoryId, ctx.customCategories).footwearKind !== 'sandal', 'Only sandals are available for a cold day.');
    }
    if (t >= 27) {
      restrict('outerwear', (i) => i.warmth <= 3, 'Only heavy outerwear is available.');
      restrict('top', (i) => i.warmth <= 2, 'Only warm tops are clean for a hot day.');
    }
    if (isRainy(ctx.weather)) {
      restrict('footwear', (i) => getCategory(i.categoryId, ctx.customCategories).footwearKind !== 'sandal', 'Only sandals are available on a rainy day.');
    }
  }

  // Locked items always make it in, even if dirty — that's an explicit choice.
  for (const l of locked) {
    const s = slotOf(l, ctx);
    if (!pools[s].some((x) => x.id === l.id)) pools[s].push(l);
  }

  if (!ctx.items.length) {
    issues.push({ kind: 'empty' });
    return { pools, issues, locked };
  }

  const hasTopStructure = pools.top.length > 0 && pools.bottom.length > 0;
  if (!hasTopStructure && !pools.onePiece.length) {
    for (const slot of ['top', 'bottom'] as const) {
      if (!pools[slot].length) {
        issues.push(
          all[slot].length
            ? { kind: 'unavailable', slot, message: `All your ${slot === 'top' ? 'tops' : 'bottoms'} are in the laundry.` }
            : { kind: 'missing', slot, message: `Add a ${slot === 'top' ? 'top' : 'bottom'} to get full outfits.` },
        );
      }
    }
  }
  if (!pools.footwear.length) {
    issues.push(
      all.footwear.length
        ? { kind: 'unavailable', slot: 'footwear', message: 'Your shoes are marked unavailable.' }
        : { kind: 'missing', slot: 'footwear', message: 'Add a pair of shoes to complete outfits.' },
    );
  }
  return { pools, issues, locked };
}

/** Quick single-item suitability used to trim candidate lists. */
function preScore(i: ClothingItem, ctx: EngineContext, aff: Affinity): number {
  let s = 0.5;
  const [lo, hi] = formalityBand(ctx);
  s += i.formality >= lo && i.formality <= hi ? 0.2 : -0.1 * Math.min(Math.abs(i.formality - lo), Math.abs(i.formality - hi));
  if (ctx.preferredStyles.some((p) => i.styleTags.includes(p))) s += 0.15;
  if (i.favorite) s += 0.1;
  s += (aff.item.get(i.id) ?? 0) * 0.05;
  if (i.lastWornOn) {
    const d = daysBetween(i.lastWornOn, ctx.date);
    if (d < ctx.repeatWindowDays) s -= 0.15 * (1 - d / ctx.repeatWindowDays);
  }
  if (ctx.weather) {
    const t = effectiveTempC(ctx.weather, ctx.coldSensitivity);
    const slot = slotOf(i, ctx);
    if (slot === 'top' || slot === 'onePiece') {
      if (t >= 24 && i.warmth >= 3) s -= 0.2;
      if (t < 10 && i.warmth <= 1) s -= 0.15;
    }
    if (slot === 'outerwear' && isRainy(ctx.weather) && i.waterResistant) s += 0.25;
    if (slot === 'footwear' && isRainy(ctx.weather) && i.waterResistant) s += 0.2;
    if (slot === 'outerwear' && t < 5) s += (i.warmth - 3) * 0.1;
  }
  if (ctx.occasion === 'workout' && i.styleTags.includes('athletic')) s += 0.3;
  return s;
}

function topK(list: ClothingItem[], k: number, ctx: EngineContext, aff: Affinity, lockedIds: Set<ID>): ClothingItem[] {
  const locked = list.filter((i) => lockedIds.has(i.id));
  if (locked.length) return locked;
  return [...list].sort((a, b) => preScore(b, ctx, aff) - preScore(a, ctx, aff)).slice(0, k);
}

export function scoreOutfit(items: ClothingItem[], ctx: EngineContext, aff: Affinity) {
  const w = weatherScore(items, ctx);
  const st = styleScore(items, ctx);
  const co = colorScore(items, ctx);
  const oc = occasionScore(items, ctx);
  const pr = preferenceScore(items, aff);
  const ro = rotationScore(items, ctx);
  const breakdown: ScoreBreakdown = {
    style: st.score,
    color: co.score,
    weather: w.score,
    occasion: oc.score,
    preference: pr.score,
    rotation: ro.score,
  };
  const total = (Object.keys(WEIGHTS) as (keyof ScoreBreakdown)[]).reduce(
    (s, k) => s + WEIGHTS[k] * breakdown[k],
    0,
  );
  const reasons = [...w.reasons, ...st.reasons, ...co.reasons, ...oc.reasons, ...pr.reasons, ...ro.reasons];
  return { total, breakdown, reasons, warnings: w.warnings };
}

/** Pick up to two accessories that genuinely help: weather first, then style. */
export function chooseAccessories(core: ClothingItem[], pool: ClothingItem[], ctx: EngineContext): ClothingItem[] {
  if (!pool.length) return [];
  const chosen: ClothingItem[] = [];
  const kind = (i: ClothingItem) => getCategory(i.categoryId, ctx.customCategories).accessoryKind;
  const t = ctx.weather ? effectiveTempC(ctx.weather, ctx.coldSensitivity) : undefined;
  const pickBest = (cands: ClothingItem[]) =>
    [...cands].sort((a, b) => Number(b.favorite) - Number(a.favorite) || a.wearCount - b.wearCount)[0];

  if (t !== undefined && t < 6) {
    const warm = pool.filter((i) => (kind(i) === 'hat' || kind(i) === 'scarf') && i.warmth >= 3);
    const p = pickBest(warm);
    if (p) chosen.push(p);
  }
  if (ctx.weather && ctx.weather.condition === 'clear' && (t ?? 0) >= 18) {
    const p = pickBest(pool.filter((i) => kind(i) === 'sunglasses'));
    if (p) chosen.push(p);
  }
  if (chosen.length < 2) {
    const [lo] = formalityBand(ctx);
    const style = pool.filter(
      (i) =>
        !chosen.includes(i) &&
        (kind(i) === 'watch' || kind(i) === 'belt' || kind(i) === 'jewelry' || kind(i) === 'bag') &&
        i.formality >= lo - 1 &&
        (i.favorite || lo >= 3),
    );
    const p = pickBest(style);
    if (p) chosen.push(p);
  }
  return chosen.slice(0, 2);
}

const TITLES = {
  rain: ['Rain-ready layers', 'Puddle-proof', 'Dry & put-together', 'Rainy-day uniform'],
  workout: ['Ready to move', 'Gym-bound', 'Built to sweat'],
  interview: ['Sharp first impression', 'Interview-ready'],
  formalEvent: ['Dressed up', 'Evening sharp'],
  date: ['Date-night easy', 'Low-key romantic', 'Dinner-ready'],
  cold: ['Bundled & put together', 'Cold-day layers', 'Warm and sharp'],
  hot: ['Hot-day light', 'Keep it breezy', 'Sun-ready'],
  neutral: ['Easy neutrals', 'Tonal & calm', 'Quiet neutrals'],
  streetwear: ['Street-ready', 'Off-duty street'],
  minimalist: ['Quietly sharp', 'Clean lines'],
  casual: ['Everyday easy', 'Weekday easy', 'Low-effort good'],
  smartCasual: ['Smart, not stiff', 'Polished casual'],
  athletic: ['Off-duty athletic', 'Sporty easy'],
  vintage: ['Thrifted charm', 'Lived-in classic'],
  preppy: ['Campus classic', 'Crisp & preppy'],
  businessCasual: ['Desk to dinner', 'Office-easy'],
  formal: ['Dressed up', 'Tailored'],
  workwear: ['Built tough', 'Utility day'],
  outdoor: ['Trail to town', 'Outdoor-ready'],
  classic: ['Timeless', 'Classic combo'],
  trend: ['On-trend', 'Fresh take'],
  fallback: ['Today’s pick', 'Good to go'],
} as const;

const NEUTRALS = ['black', 'white', 'grey', 'charcoal', 'cream', 'beige', 'navy', 'tan', 'brown', 'denim', 'olive'];

function titleFor(items: ClothingItem[], ctx: EngineContext, breakdown: ScoreBreakdown, sig: string): string {
  const pick = (opts: readonly string[]) => opts[hashString(sig) % opts.length];
  const t = ctx.weather ? effectiveTempC(ctx.weather, ctx.coldSensitivity) : undefined;
  const hasOuter = items.some((i) => slotOf(i, ctx) === 'outerwear');
  if (ctx.weather && isRainy(ctx.weather) && hasOuter) return pick(TITLES.rain);
  if (ctx.occasion === 'workout') return pick(TITLES.workout);
  if (ctx.occasion === 'interview') return pick(TITLES.interview);
  if (ctx.occasion === 'formalEvent') return pick(TITLES.formalEvent);
  if (ctx.occasion === 'date') return pick(TITLES.date);
  if (t !== undefined && t < 4) return pick(TITLES.cold);
  if (t !== undefined && t >= 27) return pick(TITLES.hot);
  if (breakdown.color >= 0.92 && items.every((i) => NEUTRALS.includes(i.primaryColor))) return pick(TITLES.neutral);
  const dom = dominantStyle(items);
  if (dom) return pick(TITLES[dom] ?? [`${STYLE_LABELS[dom]} look`]);
  return pick(TITLES.fallback);
}

function dedupe(xs: string[]) {
  return [...new Set(xs)];
}

export function generateOutfits(ctx: EngineContext, opts: { count?: number } = {}): EngineResult {
  const count = opts.count ?? 5;
  const { pools, issues, locked } = buildPools(ctx);
  if (issues.some((i) => i.kind === 'empty')) return { outfits: [], issues };

  const aff = buildAffinity(ctx);
  const lockedIds = new Set(locked.map((l) => l.id));
  const rand = mulberry32(ctx.seed ?? hashString(ctx.date));
  const exclude = new Set(ctx.excludeSignatures ?? []);

  const lockedSlots = new Set(locked.map((l) => slotOf(l, ctx)));
  const useTops = !lockedSlots.has('onePiece');
  const useOnePiece = !lockedSlots.has('top') && !lockedSlots.has('bottom');

  const tops = useTops ? topK(pools.top, K_CORE, ctx, aff, lockedIds) : [];
  const bottoms = useTops ? topK(pools.bottom, K_CORE, ctx, aff, lockedIds) : [];
  const ones = useOnePiece ? topK(pools.onePiece, K_CORE, ctx, aff, lockedIds) : [];
  const shoes = topK(pools.footwear, K_SHOES, ctx, aff, lockedIds);
  const outers = topK(pools.outerwear, K_OUTER, ctx, aff, lockedIds);
  const t = ctx.weather ? effectiveTempC(ctx.weather, ctx.coldSensitivity) : undefined;
  const outerRequired = lockedSlots.has('outerwear');
  const outerOptions: (ClothingItem | undefined)[] = outerRequired ? outers : [undefined, ...outers];
  const shoeOptions: (ClothingItem | undefined)[] = shoes.length ? shoes : [undefined];

  const bases: ClothingItem[][] = [];
  for (const tp of tops) for (const b of bottoms) bases.push([tp, b]);
  for (const o of ones) bases.push([o]);

  if (!bases.length) return { outfits: [], issues };

  type Cand = { items: ClothingItem[]; total: number; breakdown: ScoreBreakdown; reasons: string[]; warnings: string[]; sig: string };
  const cands: Cand[] = [];
  for (const base of bases) {
    for (const sh of shoeOptions) {
      for (const ou of outerOptions) {
        // Don't pile a coat on in the heat even when it's technically allowed.
        if (ou && t !== undefined && t >= 24 && !isRainy(ctx.weather)) continue;
        const items = [...base, ...(sh ? [sh] : []), ...(ou ? [ou] : [])];
        const sig = outfitSignature(items.map((i) => i.id));
        if (exclude.has(sig)) continue;
        const s = scoreOutfit(items, ctx, aff);
        // Encourage an outer layer when the weather calls for one.
        let total = s.total;
        if (!ou && needsOuterLayer(ctx.weather, t) && outers.length) total -= 0.04;
        total += (rand() - 0.5) * 0.04; // tie-break jitter for variety
        cands.push({ items, total, breakdown: s.breakdown, reasons: s.reasons, warnings: s.warnings, sig });
      }
    }
  }
  cands.sort((a, b) => b.total - a.total);

  // Diversity: prefer outfits that differ from already-picked ones by ≥2 core pieces.
  const picked: Cand[] = [];
  const overlap = (a: Cand, b: Cand) => a.items.filter((x) => b.items.includes(x)).length;
  for (const minDiff of [2, 1, 0]) {
    for (const c of cands) {
      if (picked.length >= count) break;
      if (picked.includes(c)) continue;
      if (picked.every((p) => c.items.length - overlap(c, p) >= minDiff || minDiff === 0)) {
        if (minDiff === 0 && picked.some((p) => p.sig === c.sig)) continue;
        picked.push(c);
      }
    }
    if (picked.length >= count) break;
  }

  const outfits: Recommendation[] = picked.map((c) => {
    const accessories = chooseAccessories(c.items, pools.accessory.filter((a) => !lockedIds.has(a.id)), ctx);
    const lockedAcc = locked.filter((l) => slotOf(l, ctx) === 'accessory');
    const allAcc = dedupeItems([...lockedAcc, ...accessories]).slice(0, 3);
    const items = [...c.items, ...allAcc];
    const bySlot: Recommendation['bySlot'] = {};
    for (const i of c.items) bySlot[slotOf(i, ctx) as Exclude<Slot, 'accessory'>] = i.id;
    if (allAcc.length) bySlot.accessories = allAcc.map((a) => a.id);
    const warnings = [...c.warnings];
    for (const l of locked) if (!isWearable(l)) warnings.push(`${l.name} is marked ${l.clean ? l.availability : 'dirty'} — included because you pinned it`);
    if (!c.items.some((i) => slotOf(i, ctx) === 'footwear')) warnings.push('No shoes available — add a pair to complete the look');
    const reasons = dedupe(c.reasons);
    if (ctx.weather && accessories.some((a) => getCategory(a.categoryId, ctx.customCategories).accessoryKind === 'sunglasses'))
      reasons.push('Sunglasses for a bright day');
    return {
      itemIds: items.map((i) => i.id),
      bySlot,
      score: Math.round(clamp01(c.total) * 100),
      breakdown: c.breakdown,
      title: titleFor(c.items, ctx, c.breakdown, c.sig),
      reasons: reasons.slice(0, 4),
      warnings: dedupe(warnings),
      signature: c.sig,
    };
  });

  return { outfits, issues };
}

function dedupeItems(items: ClothingItem[]) {
  const seen = new Set<ID>();
  return items.filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)));
}

/** Ranked replacements for one slot while keeping the rest of the outfit fixed. */
export function swapCandidates(current: ClothingItem[], slot: Slot, ctx: EngineContext, limit = 8) {
  const { pools } = buildPools({ ...ctx, lockedItemIds: [] });
  const aff = buildAffinity(ctx);
  const rest = current.filter((i) => slotOf(i, ctx) !== slot);
  const currentIds = new Set(current.map((i) => i.id));
  // Swapping a top for a one-piece (or vice versa) changes the structure; keep it simple.
  return pools[slot]
    .filter((i) => !currentIds.has(i.id))
    .map((i) => {
      const items = slot === 'accessory' ? [...current, i] : [...rest, i];
      return { item: i, score: Math.round(clamp01(scoreOutfit(items, ctx, aff).total) * 100) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
