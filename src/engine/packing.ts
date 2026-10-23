/**
 * Packing list builder. Picks a small, mix-and-match capsule from the user's
 * closet: versatile bottoms first, then tops that pair well with them, plus
 * shoes, layers and accessories driven by the destination's weather and the
 * trip's activities.
 */
import { getCategory, suitsWardrobe } from './categories';
import { getColor, pairHarmony } from './colors';
import { OCCASION_FORMALITY, bottomWarmthTarget, upperWarmthTarget } from './scoring';
import type { ClothesFor, ClothingItem, CustomCategory, Occasion, PackingEntry, Trip } from '@/types/models';

export interface PackingInput {
  items: ClothingItem[];
  trip: Pick<Trip, 'startDate' | 'endDate' | 'activities' | 'laundryAvailable' | 'carryOnOnly'>;
  forecast: { minC: number; maxC: number; rainy: boolean };
  customCategories?: CustomCategory[];
  clothesFor?: ClothesFor;
  /** Pack dirty items too (the user plans to wash before leaving). */
  includeDirty?: boolean;
}

export interface PackingPlan {
  nights: number;
  entries: PackingEntry[];
  notes: string[];
}

export function tripNights(start: string, end: string) {
  return Math.max(0, Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000));
}

export function buildPackingList(input: PackingInput): PackingPlan {
  const { trip, forecast } = input;
  const custom = input.customCategories ?? [];
  const nights = tripNights(trip.startDate, trip.endDate);
  const days = nights + 1;
  const notes: string[] = [];
  const usable = input.items.filter((i) => suitsWardrobe(i.categoryId, input.clothesFor)).filter(
    (i) => i.availability === 'available' && (input.includeDirty || i.clean),
  );
  const slot = (i: ClothingItem) => getCategory(i.categoryId, custom).slot;
  const midT = (forecast.minC + forecast.maxC) / 2;

  // How many of each piece. Laundry access caps the count at ~4 days' worth.
  const cycle = trip.laundryAvailable ? Math.min(days, 4) : days;
  let topsN = Math.max(1, Math.ceil(cycle * (trip.carryOnOnly ? 0.75 : 0.9)));
  let bottomsN = Math.max(1, Math.min(trip.carryOnOnly ? 2 : 3, Math.ceil(days / 3)));
  if (days <= 1) {
    topsN = 1;
    bottomsN = 1;
  }

  const [, upHi] = upperWarmthTarget(midT);
  const [botLo, botHi] = bottomWarmthTarget(midT);
  const casualActivities = trip.activities.filter((a) => !['formalEvent', 'interview', 'workout'].includes(a));
  const [fLo, fHi] = casualActivities.length
    ? [
        Math.min(...casualActivities.map((a) => OCCASION_FORMALITY[a][0])),
        Math.max(...casualActivities.map((a) => OCCASION_FORMALITY[a][1])),
      ]
    : OCCASION_FORMALITY.travel;
  const formalityOk = (i: ClothingItem) => i.formality >= fLo - 1 && i.formality <= fHi + 1;

  // Bottoms: versatile (neutral) + right warmth.
  const allBottoms = usable.filter((i) => slot(i) === 'bottom' && formalityOk(i));
  // Shorts on a cold trip are never right if anything else exists.
  const weatherOk = allBottoms.filter((i) => !(forecast.maxC < 16 && i.warmth <= 1));
  const bottomCands = (weatherOk.length ? weatherOk : allBottoms)
    .map((i) => ({
      i,
      s:
        (getColor(i.primaryColor).neutral ? 1 : 0.4) +
        (i.warmth >= botLo && i.warmth <= botHi ? 1 : -0.5 * Math.min(Math.abs(i.warmth - botLo), Math.abs(i.warmth - botHi))) +
        (i.pattern === 'solid' ? 0.3 : 0) +
        (i.favorite ? 0.2 : 0),
    }))
    .sort((a, b) => b.s - a.s);
  const bottoms = pickDistinct(bottomCands.map((c) => c.i), bottomsN);

  // Tops: pair well with every chosen bottom and suit the temperature.
  const topCands = usable
    .filter((i) => slot(i) === 'top' && formalityOk(i))
    .map((i) => ({
      i,
      s:
        (bottoms.length ? avg(bottoms.map((b) => pairHarmony(i.primaryColor, b.primaryColor))) : 0.8) * 2 +
        (i.warmth <= Math.max(2, upHi - 1) ? 0.6 : 0) +
        (midT < 12 && i.warmth >= 3 ? 0.6 : 0) +
        (i.favorite ? 0.2 : 0),
    }))
    .sort((a, b) => b.s - a.s);
  const tops = pickDistinct(topCands.map((c) => c.i), topsN);

  const chosen: ClothingItem[] = [...tops, ...bottoms];

  // Outer layer.
  if (forecast.minC < 14 || forecast.rainy) {
    const outers = usable
      .filter((i) => slot(i) === 'outerwear')
      .sort(
        (a, b) =>
          (forecast.rainy ? Number(b.waterResistant) - Number(a.waterResistant) : 0) * 2 +
          (Math.abs(a.warmth - targetOuterWarmth(forecast.minC)) - Math.abs(b.warmth - targetOuterWarmth(forecast.minC))),
      );
    if (outers[0]) chosen.push(outers[0]);
    else notes.push(forecast.rainy ? 'Rain is expected — consider packing a rain jacket.' : 'It will be cool — consider packing a jacket.');
  }

  // Shoes: one versatile pair, plus activity-specific pairs.
  const shoes = usable.filter((i) => slot(i) === 'footwear');
  const kind = (i: ClothingItem) => getCategory(i.categoryId, custom).footwearKind;
  const pickShoe = (pred: (i: ClothingItem) => boolean) => shoes.find((s) => pred(s) && !chosen.includes(s));
  const everyday =
    pickShoe((s) => (forecast.rainy ? s.waterResistant : true) && (kind(s) === 'sneaker' || kind(s) === 'boot')) ??
    pickShoe(() => true);
  if (everyday) chosen.push(everyday);
  else notes.push('No shoes in your closet yet — remember to pack a pair.');

  const special = new Set<Occasion>(trip.activities);
  if (special.has('workout')) {
    const s = pickShoe((x) => kind(x) === 'athletic');
    if (s) chosen.push(s);
    const gym = usable.filter((i) => i.styleTags.includes('athletic') && slot(i) !== 'footwear' && !chosen.includes(i)).slice(0, 2);
    chosen.push(...gym);
  }
  if (special.has('formalEvent') || special.has('interview')) {
    const s = pickShoe((x) => kind(x) === 'dress');
    if (s) chosen.push(s);
    const dressy = usable
      .filter((i) => i.formality >= 4 && slot(i) !== 'footwear' && !chosen.includes(i))
      .sort((a, b) => b.formality - a.formality);
    const one = dressy.find((i) => slot(i) === 'onePiece');
    if (one) chosen.push(one);
    else {
      const t = dressy.find((i) => slot(i) === 'top' || slot(i) === 'outerwear');
      const b = dressy.find((i) => slot(i) === 'bottom');
      if (t) chosen.push(t);
      if (b) chosen.push(b);
      if (!t && !b) notes.push('Nothing formal is clean — check your closet before the event.');
    }
  }
  if (special.has('outdoors')) {
    const s = pickShoe((x) => kind(x) === 'boot' || kind(x) === 'athletic');
    if (s) chosen.push(s);
  }
  if (special.has('date') || special.has('party')) {
    const dress = usable.find((i) => slot(i) === 'onePiece' && i.formality >= 3 && !chosen.includes(i));
    if (dress) chosen.push(dress);
  }

  // Accessories by weather.
  const acc = usable.filter((i) => slot(i) === 'accessory');
  const accKind = (i: ClothingItem) => getCategory(i.categoryId, custom).accessoryKind;
  if (forecast.maxC >= 20) {
    const s = acc.find((i) => accKind(i) === 'sunglasses');
    if (s) chosen.push(s);
  }
  if (forecast.minC < 5) {
    const w = acc.filter((i) => (accKind(i) === 'hat' || accKind(i) === 'scarf') && i.warmth >= 3).slice(0, 2);
    chosen.push(...w);
  }

  const unique = [...new Map(chosen.map((c) => [c.id, c])).values()];
  const entries: PackingEntry[] = unique.map((i) => ({ itemId: i.id, label: i.name, quantity: 1, packed: false }));

  // Essentials that aren't in a closet catalog.
  const basics = trip.laundryAvailable ? Math.min(days + 1, 5) : days + 1;
  entries.push(
    { label: 'Underwear', quantity: basics, packed: false, custom: true },
    { label: 'Socks', quantity: basics, packed: false, custom: true },
    { label: 'Sleepwear', quantity: 1, packed: false, custom: true },
    { label: 'Toiletries', quantity: 1, packed: false, custom: true },
    { label: 'Phone charger', quantity: 1, packed: false, custom: true },
  );
  if (forecast.rainy) entries.push({ label: 'Compact umbrella', quantity: 1, packed: false, custom: true });
  if (special.has('outdoors') || forecast.maxC >= 24) entries.push({ label: 'Sunscreen', quantity: 1, packed: false, custom: true });

  if (tops.length < topsN) notes.push(`You have ${tops.length} suitable clean tops; ${topsN} would cover the trip.`);
  if (bottoms.length < bottomsN && bottoms.length) notes.push('Bottoms will repeat — pick versatile ones.');
  if (!bottoms.length && !unique.some((i) => slot(i) === 'onePiece')) notes.push('No suitable bottoms found in your closet.');
  if (trip.laundryAvailable && days > 4) notes.push('Planned around one laundry stop mid-trip.');
  const combos = tops.length * Math.max(1, bottoms.length);
  if (combos > 1) notes.push(`${tops.length} tops × ${bottoms.length} bottoms = ${combos} outfit combinations.`);

  return { nights, entries, notes };
}

function targetOuterWarmth(minC: number) {
  if (minC < 0) return 5;
  if (minC < 8) return 4;
  return 2;
}

function avg(xs: number[]) {
  return xs.reduce((s, x) => s + x, 0) / Math.max(1, xs.length);
}

/** Prefer different colors so the capsule doesn't pack three identical pieces. */
function pickDistinct(list: ClothingItem[], n: number): ClothingItem[] {
  const out: ClothingItem[] = [];
  for (const i of list) {
    if (out.length >= n) break;
    if (!out.some((o) => o.primaryColor === i.primaryColor && o.categoryId === i.categoryId)) out.push(i);
  }
  for (const i of list) {
    if (out.length >= n) break;
    if (!out.includes(i)) out.push(i);
  }
  return out;
}
