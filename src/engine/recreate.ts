/**
 * Recreate With My Closet.
 *
 * Given the tagged pieces of an inspiration outfit, find the closest pieces
 * in the user's own wardrobe. Deterministic and explainable: every match
 * carries a 0–1 similarity, a match level, and human-readable reasons.
 *
 * Levels (never overstated):
 *   exact      — same category and same color (and fit/pattern don't conflict)
 *   close      — same category, near color, or same-slot sibling with matching color
 *   compatible — fills the same role in a similar style, but looks different
 *   missing    — nothing suitable in the closet
 */
import { getCategory } from './categories';
import { COLORS, getColor } from './colors';
import { tagAffinity } from './scoring';
import type { ClothingItem, CustomCategory, ID, Slot } from '@/types/models';
import type { PostItemTag } from '@/types/social';

export type MatchLevel = 'exact' | 'close' | 'compatible' | 'missing';

export interface PieceMatch {
  inspiration: PostItemTag;
  slot: Slot;
  item?: ClothingItem;
  similarity: number; // 0..1
  level: MatchLevel;
  reasons: string[];
  /** Ranked alternatives for swapping (excluding the chosen one). */
  alternatives: { item: ClothingItem; similarity: number; level: MatchLevel }[];
  /** The chosen item isn't currently wearable (dirty/unavailable). */
  unavailable?: boolean;
}

export interface RecreateResult {
  matches: PieceMatch[];
  /** 0–100, mean of piece similarities (missing pieces count as 0). */
  overall: number;
  summary: string;
  itemIds: ID[];
}

export const RECREATE_WEIGHTS = { category: 0.34, color: 0.3, style: 0.16, formality: 0.1, fit: 0.05, pattern: 0.05 };

// ---- color similarity in CIELAB, so "navy vs denim" is close and "navy vs orange" is far.
function hexToLab(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const [r, g, b] = [lin((n >> 16) & 255), lin((n >> 8) & 255), lin(n & 255)];
  const X = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const Y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const Z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
const LAB = new Map(COLORS.map((c) => [c.id, hexToLab(c.hex)]));

export function colorSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a === 'multi' || b === 'multi') return 0.3;
  const la = LAB.get(a) ?? LAB.get('grey')!;
  const lb = LAB.get(b) ?? LAB.get('grey')!;
  // Lightness counts half: light- vs mid-wash denim reads as the same color family.
  const d = Math.hypot((la[0] - lb[0]) * 0.5, la[1] - lb[1], la[2] - lb[2]);
  return Math.max(0, 1 - d / 60);
}

function categorySimilarity(a: string, b: string, custom: CustomCategory[]): number {
  if (a === b) return 1;
  const ca = getCategory(a, custom);
  const cb = getCategory(b, custom);
  if (ca.slot !== cb.slot) return 0;
  if (ca.layer && ca.layer === cb.layer) return 0.7; // e.g. sweater ↔ hoodie
  if (ca.footwearKind && ca.footwearKind === cb.footwearKind) return 0.85;
  if (ca.accessoryKind && ca.accessoryKind !== cb.accessoryKind) return 0.1;
  return 0.5; // same slot, different kind (jeans ↔ chinos)
}

function styleSimilarity(a: PostItemTag['styleTags'], b: ClothingItem['styleTags']): number {
  if (!a?.length || !b.length) return 0.6;
  let best = 0;
  for (const x of a) for (const y of b) best = Math.max(best, tagAffinity(x, y));
  return best;
}

export function pieceSimilarity(insp: PostItemTag, item: ClothingItem, custom: CustomCategory[] = []) {
  const cat = categorySimilarity(insp.categoryId, item.categoryId, custom);
  const col = colorSimilarity(insp.primaryColor, item.primaryColor);
  const sty = styleSimilarity(insp.styleTags, item.styleTags);
  const form = insp.formality ? Math.max(0, 1 - Math.abs(insp.formality - item.formality) / 3) : 0.7;
  const fit = insp.fit && item.fit ? (insp.fit === item.fit ? 1 : 0.4) : 0.6;
  const pat = insp.pattern ? (insp.pattern === item.pattern ? 1 : 0.3) : 0.7;
  const W = RECREATE_WEIGHTS;
  const similarity = cat * W.category + col * W.color + sty * W.style + form * W.formality + fit * W.fit + pat * W.pattern;

  let level: MatchLevel;
  if (cat === 1 && col === 1 && fit >= 0.6 && pat >= 0.7) level = 'exact';
  else if ((cat >= 0.7 && col >= 0.6) || (cat >= 0.5 && col === 1)) level = 'close';
  else if (cat > 0 && similarity >= 0.45) level = 'compatible';
  else level = 'missing';

  const reasons: string[] = [];
  const ic = getCategory(item.categoryId, custom).label.toLowerCase();
  const pc = getCategory(insp.categoryId, custom).label.toLowerCase();
  if (cat === 1) reasons.push(`Same piece type (${ic})`);
  else if (cat > 0) reasons.push(`Your ${ic} stands in for the ${pc}`);
  if (col === 1) reasons.push(`Same color (${getColor(item.primaryColor).label.toLowerCase()})`);
  else if (col >= 0.6) reasons.push(`Close color: ${getColor(item.primaryColor).label.toLowerCase()} vs ${getColor(insp.primaryColor).label.toLowerCase()}`);
  else reasons.push(`Different color: ${getColor(item.primaryColor).label.toLowerCase()} instead of ${getColor(insp.primaryColor).label.toLowerCase()}`);
  if (insp.fit && item.fit && insp.fit !== item.fit) reasons.push(`${item.fit} fit instead of ${insp.fit}`);
  if (sty >= 0.8 && insp.styleTags?.length) reasons.push('Same style family');
  return { similarity, level, reasons };
}

export interface RecreateOptions {
  customCategories?: CustomCategory[];
  /** Allow dirty/unavailable items (flagged) when nothing wearable fits. */
  allowUnavailable?: boolean;
}

export function recreateOutfit(inspiration: PostItemTag[], closet: ClothingItem[], opts: RecreateOptions = {}): RecreateResult {
  const custom = opts.customCategories ?? [];
  const wearable = (i: ClothingItem) => i.clean && i.availability === 'available';
  const used = new Set<ID>();
  // Most distinctive pieces first so they get first pick of the closet.
  const order = inspiration
    .map((p, idx) => ({ p, idx, slot: getCategory(p.categoryId, custom).slot }))
    .sort((a, b) => slotRank(a.slot) - slotRank(b.slot));

  const results: PieceMatch[] = [];
  for (const { p, idx, slot } of order) {
    const ranked = closet
      .filter((i) => getCategory(i.categoryId, custom).slot === slot)
      .map((i) => ({ item: i, ...pieceSimilarity(p, i, custom), ok: wearable(i) }))
      .filter((r) => r.level !== 'missing')
      .sort((a, b) => Number(b.ok) - Number(a.ok) || b.similarity - a.similarity);
    const pick = ranked.find((r) => !used.has(r.item.id) && (r.ok || opts.allowUnavailable));
    if (pick) used.add(pick.item.id);
    const alternatives = ranked
      .filter((r) => r !== pick && r.ok)
      .slice(0, 6)
      .map((r) => ({ item: r.item, similarity: r.similarity, level: r.level }));
    results[idx] = pick
      ? { inspiration: p, slot, item: pick.item, similarity: pick.similarity, level: pick.level, reasons: pick.reasons, alternatives, unavailable: !pick.ok }
      : {
          inspiration: p,
          slot,
          similarity: 0,
          level: 'missing',
          reasons: [closet.some((i) => getCategory(i.categoryId, custom).slot === slot) ? 'Nothing clean that fits this role' : `No ${slotLabel(slot)} in your closet yet`],
          alternatives,
        };
  }

  const overall = results.length ? Math.round((results.reduce((s, m) => s + m.similarity, 0) / results.length) * 100) : 0;
  const counts = { exact: 0, close: 0, compatible: 0, missing: 0 };
  for (const m of results) counts[m.level]++;
  const parts = [
    counts.exact && `${counts.exact} exact`,
    counts.close && `${counts.close} close`,
    counts.compatible && `${counts.compatible} stand-in${counts.compatible > 1 ? 's' : ''}`,
    counts.missing && `${counts.missing} missing`,
  ].filter(Boolean);
  return { matches: results, overall, summary: parts.join(' · '), itemIds: results.flatMap((m) => (m.item ? [m.item.id] : [])) };
}

/** Re-score after the user swaps a piece. */
export function swapMatch(match: PieceMatch, item: ClothingItem, custom: CustomCategory[] = []): PieceMatch {
  const s = pieceSimilarity(match.inspiration, item, custom);
  const prev = match.item;
  return {
    ...match,
    item,
    similarity: s.similarity,
    level: s.level === 'missing' ? 'compatible' : s.level,
    reasons: s.reasons,
    unavailable: !(item.clean && item.availability === 'available'),
    alternatives: [...match.alternatives.filter((a) => a.item.id !== item.id), ...(prev ? [{ item: prev, similarity: match.similarity, level: match.level }] : [])].sort(
      (a, b) => b.similarity - a.similarity,
    ),
  };
}

function slotRank(s: Slot) {
  return { onePiece: 0, top: 1, bottom: 2, outerwear: 3, footwear: 4, accessory: 5 }[s];
}
function slotLabel(s: Slot) {
  return { onePiece: 'dresses or sets', top: 'tops', bottom: 'bottoms', outerwear: 'outer layers', footwear: 'shoes', accessory: 'accessories' }[s];
}

/** Turn wardrobe items into post tags, sharing only the fields the user allowed. */
export function itemsToTags(items: ClothingItem[], disclose: { brand?: boolean; productName?: boolean } = {}): PostItemTag[] {
  return items.map((i) => ({
    categoryId: i.categoryId,
    primaryColor: i.primaryColor,
    secondaryColors: i.secondaryColors,
    pattern: i.pattern,
    fit: i.fit,
    styleTags: i.styleTags,
    formality: i.formality,
    warmth: i.warmth,
    brand: disclose.brand ? i.brand : undefined,
    productName: disclose.productName ? i.name : undefined,
  }));
}
