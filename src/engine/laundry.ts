import type { ClothingItem, ID, ISODate } from '@/types/models';

/**
 * Record a wear. Each item counts the wear; items whose category is in
 * `autoDirtyCategories` go to the hamper once they reach their own
 * wears-before-wash count (a jacket may last 10 wears, a tee 1).
 */
export function applyWear(
  items: ClothingItem[],
  wornIds: ID[],
  date: ISODate,
  autoDirtyCategories: string[],
  now = new Date().toISOString(),
): ClothingItem[] {
  const worn = new Set(wornIds);
  return items.map((i) => {
    if (!worn.has(i.id)) return i;
    const wearsSinceWash = i.wearsSinceWash + 1;
    const goesDirty = autoDirtyCategories.includes(i.categoryId) && wearsSinceWash >= i.wearsBeforeWash;
    return {
      ...i,
      wearCount: i.wearCount + 1,
      lastWornOn: !i.lastWornOn || i.lastWornOn < date ? date : i.lastWornOn,
      wearsSinceWash,
      clean: goesDirty ? false : i.clean,
      updatedAt: now,
    };
  });
}

export function setClean(items: ClothingItem[], ids: ID[], clean: boolean, now = new Date().toISOString()): ClothingItem[] {
  const set = new Set(ids);
  return items.map((i) =>
    set.has(i.id) ? { ...i, clean, wearsSinceWash: clean ? 0 : i.wearsSinceWash, updatedAt: now } : i,
  );
}
