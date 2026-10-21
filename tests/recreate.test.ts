import { colorSimilarity, itemsToTags, recreateOutfit, swapMatch } from '@/engine/recreate';
import type { PostItemTag } from '@/types/social';

import { item } from './helpers';

const insp: PostItemTag[] = [
  { categoryId: 'hoodie', primaryColor: 'cream', fit: 'relaxed', styleTags: ['streetwear'] },
  { categoryId: 'jeans', primaryColor: 'lightblue', fit: 'relaxed', styleTags: ['streetwear', 'casual'] },
  { categoryId: 'sneakers', primaryColor: 'white', styleTags: ['casual'] },
];

describe('recreate with my closet', () => {
  it('finds exact matches when the closet has the same pieces', () => {
    const closet = [
      item({ categoryId: 'hoodie', primaryColor: 'cream', fit: 'relaxed', styleTags: ['streetwear'] }),
      item({ categoryId: 'jeans', primaryColor: 'lightblue', fit: 'relaxed', styleTags: ['casual'] }),
      item({ categoryId: 'sneakers', primaryColor: 'white' }),
    ];
    const r = recreateOutfit(insp, closet);
    expect(r.matches.map((m) => m.level)).toEqual(['exact', 'exact', 'exact']);
    expect(r.overall).toBeGreaterThan(85);
  });

  it('labels near-color and sibling-category substitutes honestly', () => {
    const closet = [
      item({ categoryId: 'sweater', primaryColor: 'beige', styleTags: ['classic'] }),
      item({ categoryId: 'jeans', primaryColor: 'denim' }),
      item({ categoryId: 'sneakers', primaryColor: 'grey' }),
    ];
    const r = recreateOutfit(insp, closet);
    expect(r.matches[0].level).not.toBe('exact');
    expect(r.matches[0].reasons.join(' ')).toMatch(/stands in for the hoodie/);
    expect(r.matches[1].level).toBe('close');
    expect(r.matches.every((m) => m.item)).toBe(true);
  });

  it('reports missing categories instead of forcing a match', () => {
    const closet = [item({ categoryId: 'tshirt', primaryColor: 'white' }), item({ categoryId: 'jeans', primaryColor: 'denim' })];
    const r = recreateOutfit(insp, closet);
    const shoes = r.matches[2];
    expect(shoes.level).toBe('missing');
    expect(shoes.item).toBeUndefined();
    expect(shoes.reasons[0]).toMatch(/No shoes/);
    expect(r.summary).toMatch(/missing/);
  });

  it('never picks dirty or unavailable items by default', () => {
    const dirty = item({ categoryId: 'hoodie', primaryColor: 'cream', clean: false });
    const lent = item({ categoryId: 'jeans', primaryColor: 'lightblue', availability: 'lent' });
    const r = recreateOutfit(insp, [dirty, lent, item({ categoryId: 'sneakers', primaryColor: 'white' })]);
    expect(r.itemIds).not.toContain(dirty.id);
    expect(r.itemIds).not.toContain(lent.id);
    expect(r.matches[0].reasons[0]).toMatch(/Nothing clean/);
  });

  it('does not reuse one item for two pieces', () => {
    const r = recreateOutfit(
      [{ categoryId: 'tshirt', primaryColor: 'white' }, { categoryId: 'tshirt', primaryColor: 'black' }],
      [item({ categoryId: 'tshirt', primaryColor: 'white' })],
    );
    expect(r.itemIds).toHaveLength(1);
    expect(r.matches[1].level).toBe('missing');
  });

  it('is deterministic', () => {
    const closet = [item({ categoryId: 'hoodie', primaryColor: 'grey' }), item({ categoryId: 'jeans', primaryColor: 'black' }), item({ categoryId: 'boots', primaryColor: 'brown' })];
    expect(recreateOutfit(insp, closet)).toEqual(recreateOutfit(insp, closet));
  });

  it('swapping re-scores with reasons', () => {
    const a = item({ categoryId: 'jeans', primaryColor: 'black' });
    const b = item({ categoryId: 'jeans', primaryColor: 'lightblue' });
    const r = recreateOutfit([insp[1]], [a]);
    const swapped = swapMatch(r.matches[0], b);
    expect(swapped.similarity).toBeGreaterThan(r.matches[0].similarity);
    expect(swapped.alternatives.map((x) => x.item.id)).toContain(a.id);
  });

  it('color similarity orders sensibly', () => {
    expect(colorSimilarity('navy', 'denim')).toBeGreaterThan(colorSimilarity('navy', 'orange'));
    expect(colorSimilarity('cream', 'beige')).toBeGreaterThan(0.6);
  });

  it('only discloses brand/name when allowed', () => {
    const i = item({ categoryId: 'jeans', name: 'My Levi 501', brand: 'Levi', primaryColor: 'denim' });
    expect(itemsToTags([i])[0].brand).toBeUndefined();
    expect(itemsToTags([i])[0].productName).toBeUndefined();
    expect(itemsToTags([i], { brand: true })[0].brand).toBe('Levi');
  });
});
