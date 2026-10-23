import { getCategory } from '@/engine/categories';
import { pairHarmony } from '@/engine/colors';
import { generateOutfits, outfitSignature, swapCandidates } from '@/engine/generate';
import { applyWear, setClean } from '@/engine/laundry';
import { buildPackingList } from '@/engine/packing';
import type { ClothingItem } from '@/types/models';

import { basicCloset, ctx, item, list, weather } from './helpers';

const slotsOf = (ids: string[], items: ClothingItem[]) =>
  ids.map((id) => getCategory(items.find((i) => i.id === id)!.categoryId).slot);

describe('hard constraints', () => {
  it('never recommends dirty clothing', () => {
    const c = basicCloset();
    c.tee.clean = false;
    c.jeans.clean = false;
    const items = list(c);
    const { outfits } = generateOutfits(ctx(items), { count: 10 });
    expect(outfits.length).toBeGreaterThan(0);
    for (const o of outfits) {
      expect(o.itemIds).not.toContain(c.tee.id);
      expect(o.itemIds).not.toContain(c.jeans.id);
    }
  });

  it('excludes unavailable items (lent, repair, storage)', () => {
    const c = basicCloset();
    c.sneakers.availability = 'lent';
    c.boots.availability = 'repair';
    const { outfits } = generateOutfits(ctx(list(c)), { count: 10 });
    for (const o of outfits) {
      expect(o.itemIds).not.toContain(c.sneakers.id);
      expect(o.itemIds).not.toContain(c.boots.id);
    }
  });

  it('includes a pinned dirty item and explains why', () => {
    const c = basicCloset();
    c.jeans.clean = false;
    const { outfits } = generateOutfits(ctx(list(c), { lockedItemIds: [c.jeans.id] }));
    expect(outfits.length).toBeGreaterThan(0);
    for (const o of outfits) expect(o.itemIds).toContain(c.jeans.id);
    expect(outfits[0].warnings.join(' ')).toMatch(/pinned/);
  });
});

describe('outfit structure', () => {
  it('builds top + bottom + shoes outfits', () => {
    const items = list(basicCloset());
    const { outfits } = generateOutfits(ctx(items, { weather: weather() }));
    for (const o of outfits) {
      const slots = slotsOf(o.itemIds, items);
      const hasSeparates = slots.includes('top') && slots.includes('bottom');
      const hasOnePiece = slots.includes('onePiece');
      expect(hasSeparates || hasOnePiece).toBe(true);
      expect(slots).toContain('footwear');
    }
  });

  it('supports one-piece outfits like dresses', () => {
    const dress = item({ name: 'Dress', categoryId: 'dress', primaryColor: 'black' });
    const flats = item({ name: 'Flats', categoryId: 'sneakers', primaryColor: 'black' });
    const { outfits } = generateOutfits(ctx([dress, flats]));
    expect(outfits).toHaveLength(1);
    expect(outfits[0].itemIds.sort()).toEqual([dress.id, flats.id].sort());
  });

  it('keeps stained pieces out of plans they would show in', () => {
    const c = basicCloset();
    const items = list(c);
    c.jeans.stain = 'bad';
    for (const o of generateOutfits(ctx(items), { count: 10 }).outfits) expect(o.itemIds).not.toContain(c.jeans.id);

    c.jeans.stain = 'noticeable';
    const casual = generateOutfits(ctx(items, { occasion: 'everyday' }), { count: 10 }).outfits;
    expect(casual.some((o) => o.itemIds.includes(c.jeans.id))).toBe(true);
    const withJeans = casual.find((o) => o.itemIds.includes(c.jeans.id))!;
    expect(withJeans.warnings.join(' ')).toMatch(/noticeable stain/);
    for (const o of generateOutfits(ctx(items, { occasion: 'work' }), { count: 10 }).outfits) expect(o.itemIds).not.toContain(c.jeans.id);

    c.trousers.stain = 'light';
    for (const o of generateOutfits(ctx(items, { targetFormality: 5 }), { count: 10 }).outfits) expect(o.itemIds).not.toContain(c.trousers.id);
  });

  it('pinning a badly stained piece still includes it, with a warning', () => {
    const c = basicCloset();
    c.jeans.stain = 'bad';
    const { outfits } = generateOutfits(ctx(list(c), { lockedItemIds: [c.jeans.id] }));
    expect(outfits[0].itemIds).toContain(c.jeans.id);
    expect(outfits[0].warnings.join(' ')).toMatch(/bad stain — included because you pinned it/);
  });

  it('labels trousers as Pants and maps retired Chinos to Pants', () => {
    expect(getCategory('trousers').label).toBe('Pants');
    expect(getCategory('chinos').id).toBe('trousers');
    expect(getCategory('chinos').slot).toBe('bottom');
  });

  it('tracks socks in the closet without adding them to outfits', () => {
    const c = basicCloset();
    const socks = item({ name: 'White socks', categoryId: 'socks', primaryColor: 'white', favorite: true });
    expect(getCategory('socks').group).toBe('accessories');
    expect(socks.wearsBeforeWash).toBe(1);
    const { outfits } = generateOutfits(ctx([...list(c), socks]), { count: 10 });
    expect(outfits.length).toBeGreaterThan(0);
    for (const o of outfits) expect(o.itemIds).not.toContain(socks.id);
  });

  it('leaves dresses and skirts out for menswear', () => {
    const c = basicCloset();
    const dress = item({ name: 'Dress', categoryId: 'dress', primaryColor: 'black' });
    const skirt = item({ name: 'Skirt', categoryId: 'skirt', primaryColor: 'navy' });
    const items = [...list(c), dress, skirt];
    const { outfits } = generateOutfits(ctx(items, { clothesFor: 'mens' }), { count: 10 });
    expect(outfits.length).toBeGreaterThan(0);
    for (const o of outfits) expect(o.itemIds).not.toContain(dress.id);
    for (const o of outfits) expect(o.itemIds).not.toContain(skirt.id);
    expect(swapCandidates(outfits[0].itemIds.map((id) => items.find((i) => i.id === id)!), 'bottom', ctx(items, { clothesFor: 'mens' })).map((s) => s.item.id)).not.toContain(skirt.id);
    const plan = buildPackingList({ items, trip: { startDate: '2026-11-01', endDate: '2026-11-04', activities: ['formalEvent'], laundryAvailable: false, carryOnOnly: false }, forecast: { minC: 10, maxC: 18, rainy: false }, clothesFor: 'mens' });
    expect(plan.entries.map((e) => e.itemId)).not.toContain(dress.id);
  });

  it('keeps a locked item in every result', () => {
    const c = basicCloset();
    const { outfits } = generateOutfits(ctx(list(c), { lockedItemIds: [c.trousers.id] }), { count: 5 });
    expect(outfits.length).toBeGreaterThan(1);
    for (const o of outfits) expect(o.itemIds).toContain(c.trousers.id);
  });
});

describe('fallbacks', () => {
  it('handles an empty closet', () => {
    const r = generateOutfits(ctx([]));
    expect(r.outfits).toEqual([]);
    expect(r.issues[0].kind).toBe('empty');
  });

  it('reports a missing category instead of crashing', () => {
    const r = generateOutfits(ctx([item({ categoryId: 'tshirt' }), item({ categoryId: 'sneakers' })]));
    expect(r.outfits).toEqual([]);
    expect(r.issues.some((i) => i.kind === 'missing' && i.slot === 'bottom')).toBe(true);
  });

  it('says when everything in a slot is in the laundry', () => {
    const top = item({ categoryId: 'tshirt', clean: false });
    const r = generateOutfits(ctx([top, item({ categoryId: 'jeans' }), item({ categoryId: 'sneakers' })]));
    expect(r.outfits).toEqual([]);
    expect(r.issues.some((i) => i.kind === 'unavailable' && i.slot === 'top')).toBe(true);
  });

  it('still dresses you with no shoes, with a warning', () => {
    const r = generateOutfits(ctx([item({ categoryId: 'tshirt' }), item({ categoryId: 'jeans' })]));
    expect(r.outfits).toHaveLength(1);
    expect(r.outfits[0].warnings.join(' ')).toMatch(/shoes/i);
    expect(r.issues.some((i) => i.kind === 'missing' && i.slot === 'footwear')).toBe(true);
  });

  it('works with a tiny closet and a single pair of shoes', () => {
    const items = [
      item({ categoryId: 'tshirt', primaryColor: 'white' }),
      item({ categoryId: 'tshirt', primaryColor: 'black' }),
      item({ categoryId: 'jeans', primaryColor: 'denim' }),
      item({ categoryId: 'sneakers', primaryColor: 'white' }),
    ];
    const r = generateOutfits(ctx(items), { count: 5 });
    expect(r.outfits).toHaveLength(2);
    expect(new Set(r.outfits.map((o) => o.signature)).size).toBe(2);
  });

  it('returns no outfits when nothing suitable is available', () => {
    const items = [item({ categoryId: 'tshirt', clean: false }), item({ categoryId: 'jeans', availability: 'storage' })];
    const r = generateOutfits(ctx(items));
    expect(r.outfits).toEqual([]);
    expect(r.issues.length).toBeGreaterThan(0);
  });
});

describe('weather', () => {
  it('avoids shorts and sandals in freezing weather', () => {
    const items = list(basicCloset());
    const { outfits } = generateOutfits(ctx(items, { weather: weather({ feelsLikeC: -3, tempC: -1, highC: 1, lowC: -5 }) }), { count: 6 });
    const names = outfits.flatMap((o) => o.itemIds.map((id) => items.find((i) => i.id === id)!.categoryId));
    expect(names).not.toContain('shorts');
    expect(names).not.toContain('sandals');
  });

  it('puts a warm outer layer on cold days', () => {
    const items = list(basicCloset());
    const { outfits } = generateOutfits(ctx(items, { weather: weather({ feelsLikeC: 1, tempC: 3, lowC: -1, highC: 5 }) }));
    const slots = slotsOf(outfits[0].itemIds, items);
    expect(slots).toContain('outerwear');
  });

  it('skips heavy layers in the heat', () => {
    const items = list(basicCloset());
    const { outfits } = generateOutfits(ctx(items, { weather: weather({ feelsLikeC: 32, tempC: 31, highC: 34 }) }), { count: 5 });
    for (const o of outfits) {
      const cats = o.itemIds.map((id) => items.find((i) => i.id === id)!.categoryId);
      expect(cats).not.toContain('coat');
      expect(cats).not.toContain('sweater');
    }
  });

  it('prefers rain-friendly footwear and outerwear when it rains', () => {
    const c = basicCloset();
    const items = list(c);
    const { outfits } = generateOutfits(
      ctx(items, { weather: weather({ feelsLikeC: 12, precipProbability: 85, condition: 'rain' }) }),
    );
    expect(outfits[0].itemIds).toContain(c.rain.id);
    expect(outfits[0].itemIds).not.toContain(c.sandals.id);
    expect(outfits[0].itemIds).toContain(c.boots.id);
  });

  it('respects personal temperature sensitivity', () => {
    const items = list(basicCloset());
    const mild = weather({ feelsLikeC: 15, tempC: 15 });
    const cold = generateOutfits(ctx(items, { weather: mild, coldSensitivity: 'runsCold' }), { count: 3 });
    const warm = generateOutfits(ctx(items, { weather: mild, coldSensitivity: 'runsWarm' }), { count: 3 });
    // Average clothing warmth across the top picks (accessories like sunglasses aren't layers).
    const core = (ids: string[]) => ids.map((id) => items.find((i) => i.id === id)!).filter((i) => getCategory(i.categoryId).slot !== 'accessory');
    const avgWarmth = (r: typeof cold) => r.outfits.reduce((s, o) => s + core(o.itemIds).reduce((t, i) => t + i.warmth, 0), 0) / r.outfits.length;
    expect(avgWarmth(cold)).toBeGreaterThan(avgWarmth(warm));
  });
});

describe('occasion', () => {
  it('dresses up for an interview', () => {
    const c = basicCloset();
    const items = list(c);
    const { outfits } = generateOutfits(ctx(items, { occasion: 'interview' }));
    const top = outfits[0];
    expect(top.itemIds).toEqual(expect.arrayContaining([c.trousers.id]));
    expect(top.itemIds).not.toContain(c.shorts.id);
    expect(top.itemIds).not.toContain(c.sandals.id);
  });

  it('keeps it casual for everyday', () => {
    const c = basicCloset();
    const { outfits } = generateOutfits(ctx(list(c), { occasion: 'everyday', weather: weather({ feelsLikeC: 22 }) }));
    expect(outfits[0].itemIds).not.toContain(c.loafers.id);
  });
});

describe('color', () => {
  it('rates neutral pairings above clashing brights', () => {
    expect(pairHarmony('navy', 'white')).toBeGreaterThan(pairHarmony('orange', 'green'));
    expect(pairHarmony('denim', 'rust')).toBeGreaterThan(0.85);
  });

  it('prefers a harmonious outfit over a clashing one', () => {
    const items = [
      item({ categoryId: 'tshirt', primaryColor: 'yellow' }),
      item({ categoryId: 'tshirt', primaryColor: 'white' }),
      item({ categoryId: 'trousers', primaryColor: 'green', formality: 2 }),
      item({ categoryId: 'sneakers', primaryColor: 'white' }),
    ];
    const { outfits } = generateOutfits(ctx(items));
    expect(outfits[0].itemIds).toContain(items[1].id);
  });
});

describe('variety and repetition', () => {
  it('avoids repeating an outfit worn yesterday', () => {
    const c = basicCloset();
    const items = list(c);
    const first = generateOutfits(ctx(items, { weather: weather() })).outfits[0];
    const worn = applyWear(items, first.itemIds, '2026-10-20', []);
    const next = generateOutfits(
      ctx(worn, {
        weather: weather(),
        wearLogs: [{ id: 'w1', date: '2026-10-20', itemIds: first.itemIds, createdAt: '' }],
      }),
    ).outfits[0];
    expect(next.signature).not.toBe(first.signature);
  });

  it('regenerate never shows the same combination twice', () => {
    const items = list(basicCloset());
    const a = generateOutfits(ctx(items), { count: 3 });
    const b = generateOutfits(ctx(items, { excludeSignatures: a.outfits.map((o) => o.signature), seed: 2 }), { count: 3 });
    const seen = new Set(a.outfits.map((o) => o.signature));
    for (const o of b.outfits) expect(seen.has(o.signature)).toBe(false);
  });

  it('returns distinct outfits within one result', () => {
    const { outfits } = generateOutfits(ctx(list(basicCloset())), { count: 5 });
    expect(new Set(outfits.map((o) => o.signature)).size).toBe(outfits.length);
  });

  it('learns from dislikes', () => {
    const items = list(basicCloset());
    const base = generateOutfits(ctx(items, { weather: weather() })).outfits[0];
    const fb = [1, 2, 3].map((k) => ({ id: `f${k}`, itemIds: base.itemIds, kind: 'dislike' as const, createdAt: '2026-10-20T00:00:00Z' }));
    const after = generateOutfits(ctx(items, { weather: weather(), feedback: fb })).outfits[0];
    expect(after.signature).not.toBe(base.signature);
  });
});

describe('swap', () => {
  it('suggests replacements for one slot only from wearable items', () => {
    const c = basicCloset();
    c.boots.clean = true;
    c.loafers.availability = 'lent';
    const items = list(c);
    const current = [c.tee, c.jeans, c.sneakers];
    const swaps = swapCandidates(current, 'footwear', ctx(items));
    const ids = swaps.map((s) => s.item.id);
    expect(ids).toContain(c.boots.id);
    expect(ids).not.toContain(c.loafers.id);
    expect(ids).not.toContain(c.sneakers.id);
  });
});

describe('laundry', () => {
  it('marks items dirty only after their wears-before-wash count', () => {
    const tee = item({ categoryId: 'tshirt' }); // 1 wear
    const jacket = item({ categoryId: 'jacket' }); // 10 wears
    const after = applyWear([tee, jacket], [tee.id, jacket.id], '2026-10-21', ['tshirt', 'jacket']);
    expect(after[0].clean).toBe(false);
    expect(after[1].clean).toBe(true);
    expect(after[1].wearsSinceWash).toBe(1);
    expect(after[0].wearCount).toBe(1);
    expect(after[0].lastWornOn).toBe('2026-10-21');
  });

  it('does not auto-dirty categories the user has not opted into', () => {
    const tee = item({ categoryId: 'tshirt' });
    const [after] = applyWear([tee], [tee.id], '2026-10-21', []);
    expect(after.clean).toBe(true);
  });

  it('washing resets the wear counter', () => {
    const tee = { ...item({ categoryId: 'tshirt' }), clean: false, wearsSinceWash: 3 };
    const [after] = setClean([tee], [tee.id], true);
    expect(after.clean).toBe(true);
    expect(after.wearsSinceWash).toBe(0);
  });
});

describe('packing', () => {
  it('packs a weather-appropriate capsule without excess duplicates', () => {
    const c = basicCloset();
    const plan = buildPackingList({
      items: list(c),
      trip: { startDate: '2026-11-01', endDate: '2026-11-05', activities: ['everyday'], laundryAvailable: false, carryOnOnly: true },
      forecast: { minC: 4, maxC: 11, rainy: true },
    });
    const ids = plan.entries.map((e) => e.itemId).filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(c.rain.id);
    expect(ids).not.toContain(c.shorts.id);
    expect(plan.entries.find((e) => e.label === 'Compact umbrella')).toBeTruthy();
    expect(plan.nights).toBe(4);
  });

  it('adds dress shoes for a formal event', () => {
    const c = basicCloset();
    const plan = buildPackingList({
      items: list(c),
      trip: { startDate: '2026-11-01', endDate: '2026-11-03', activities: ['everyday', 'formalEvent'], laundryAvailable: false, carryOnOnly: false },
      forecast: { minC: 15, maxC: 22, rainy: false },
    });
    expect(plan.entries.map((e) => e.itemId)).toContain(c.loafers.id);
  });
});

describe('signatures', () => {
  it('is order independent', () => {
    expect(outfitSignature(['b', 'a'])).toBe(outfitSignature(['a', 'b']));
  });
});
