import type { CategoryGroup, ClothesFor, CustomCategory, Formality, Slot, StyleTag, Warmth } from '@/types/models';

export interface CategoryDef {
  id: string;
  label: string;
  group: CategoryGroup;
  slot: Slot;
  /** Defaults applied when a new item is created in this category. */
  defaults: {
    warmth: Warmth;
    formality: Formality;
    wearsBeforeWash: number;
    waterResistant?: boolean;
    styleTags?: StyleTag[];
  };
  /** Outer layers are optional; mid layers (sweaters/hoodies) can sit under them. */
  layer?: 'base' | 'mid' | 'outer';
  /** Footwear trait used by weather rules. */
  footwearKind?: 'sneaker' | 'boot' | 'dress' | 'sandal' | 'athletic';
  accessoryKind?: 'hat' | 'belt' | 'watch' | 'jewelry' | 'bag' | 'sunglasses' | 'scarf' | 'socks';
}

export const CATEGORIES: CategoryDef[] = [
  // Tops
  { id: 'tshirt', label: 'T-shirt', group: 'tops', slot: 'top', layer: 'base', defaults: { warmth: 1, formality: 1, wearsBeforeWash: 1 } },
  { id: 'longsleeve', label: 'Long sleeve', group: 'tops', slot: 'top', layer: 'base', defaults: { warmth: 2, formality: 2, wearsBeforeWash: 1 } },
  { id: 'polo', label: 'Polo', group: 'tops', slot: 'top', layer: 'base', defaults: { warmth: 1, formality: 2, wearsBeforeWash: 1, styleTags: ['preppy'] } },
  { id: 'buttondown', label: 'Button-down', group: 'tops', slot: 'top', layer: 'base', defaults: { warmth: 2, formality: 3, wearsBeforeWash: 1 } },
  { id: 'blouse', label: 'Blouse', group: 'tops', slot: 'top', layer: 'base', defaults: { warmth: 1, formality: 3, wearsBeforeWash: 1 } },
  { id: 'tank', label: 'Tank top', group: 'tops', slot: 'top', layer: 'base', defaults: { warmth: 1, formality: 1, wearsBeforeWash: 1 } },
  { id: 'sweater', label: 'Sweater', group: 'tops', slot: 'top', layer: 'mid', defaults: { warmth: 3, formality: 3, wearsBeforeWash: 4 } },
  { id: 'hoodie', label: 'Hoodie', group: 'tops', slot: 'top', layer: 'mid', defaults: { warmth: 3, formality: 1, wearsBeforeWash: 3, styleTags: ['streetwear', 'casual'] } },
  { id: 'jacket', label: 'Jacket', group: 'tops', slot: 'outerwear', layer: 'outer', defaults: { warmth: 3, formality: 2, wearsBeforeWash: 10 } },
  { id: 'blazer', label: 'Blazer', group: 'tops', slot: 'outerwear', layer: 'outer', defaults: { warmth: 2, formality: 4, wearsBeforeWash: 8 } },
  { id: 'raincoat', label: 'Rain jacket', group: 'tops', slot: 'outerwear', layer: 'outer', defaults: { warmth: 2, formality: 2, wearsBeforeWash: 15, waterResistant: true, styleTags: ['outdoor'] } },
  { id: 'coat', label: 'Coat', group: 'tops', slot: 'outerwear', layer: 'outer', defaults: { warmth: 5, formality: 3, wearsBeforeWash: 20 } },
  // Bottoms
  { id: 'jeans', label: 'Jeans', group: 'bottoms', slot: 'bottom', defaults: { warmth: 3, formality: 2, wearsBeforeWash: 5 } },
  // Id stays 'trousers' so saved items keep working; it's labelled Pants.
  { id: 'trousers', label: 'Pants', group: 'bottoms', slot: 'bottom', defaults: { warmth: 2, formality: 3, wearsBeforeWash: 3 } },
  { id: 'shorts', label: 'Shorts', group: 'bottoms', slot: 'bottom', defaults: { warmth: 1, formality: 1, wearsBeforeWash: 2 } },
  { id: 'sweatpants', label: 'Sweatpants', group: 'bottoms', slot: 'bottom', defaults: { warmth: 3, formality: 1, wearsBeforeWash: 3, styleTags: ['athletic', 'casual'] } },
  { id: 'skirt', label: 'Skirt', group: 'bottoms', slot: 'bottom', defaults: { warmth: 1, formality: 3, wearsBeforeWash: 2 } },
  { id: 'leggings', label: 'Leggings', group: 'bottoms', slot: 'bottom', defaults: { warmth: 2, formality: 1, wearsBeforeWash: 1, styleTags: ['athletic'] } },
  // Footwear
  { id: 'sneakers', label: 'Sneakers', group: 'footwear', slot: 'footwear', footwearKind: 'sneaker', defaults: { warmth: 2, formality: 2, wearsBeforeWash: 999 } },
  { id: 'boots', label: 'Boots', group: 'footwear', slot: 'footwear', footwearKind: 'boot', defaults: { warmth: 4, formality: 3, wearsBeforeWash: 999, waterResistant: true } },
  { id: 'dressshoes', label: 'Dress shoes', group: 'footwear', slot: 'footwear', footwearKind: 'dress', defaults: { warmth: 2, formality: 5, wearsBeforeWash: 999 } },
  { id: 'loafers', label: 'Loafers', group: 'footwear', slot: 'footwear', footwearKind: 'dress', defaults: { warmth: 2, formality: 4, wearsBeforeWash: 999, styleTags: ['preppy', 'classic'] } },
  { id: 'sandals', label: 'Sandals', group: 'footwear', slot: 'footwear', footwearKind: 'sandal', defaults: { warmth: 1, formality: 1, wearsBeforeWash: 999 } },
  { id: 'athletic', label: 'Athletic shoes', group: 'footwear', slot: 'footwear', footwearKind: 'athletic', defaults: { warmth: 2, formality: 1, wearsBeforeWash: 999, styleTags: ['athletic'] } },
  // Accessories
  { id: 'hat', label: 'Hat', group: 'accessories', slot: 'accessory', accessoryKind: 'hat', defaults: { warmth: 2, formality: 1, wearsBeforeWash: 10 } },
  { id: 'beanie', label: 'Beanie', group: 'accessories', slot: 'accessory', accessoryKind: 'hat', defaults: { warmth: 4, formality: 1, wearsBeforeWash: 10 } },
  { id: 'scarf', label: 'Scarf', group: 'accessories', slot: 'accessory', accessoryKind: 'scarf', defaults: { warmth: 4, formality: 3, wearsBeforeWash: 15 } },
  { id: 'belt', label: 'Belt', group: 'accessories', slot: 'accessory', accessoryKind: 'belt', defaults: { warmth: 1, formality: 3, wearsBeforeWash: 999 } },
  { id: 'watch', label: 'Watch', group: 'accessories', slot: 'accessory', accessoryKind: 'watch', defaults: { warmth: 1, formality: 3, wearsBeforeWash: 999 } },
  { id: 'jewelry', label: 'Jewelry', group: 'accessories', slot: 'accessory', accessoryKind: 'jewelry', defaults: { warmth: 1, formality: 3, wearsBeforeWash: 999 } },
  { id: 'bag', label: 'Bag', group: 'accessories', slot: 'accessory', accessoryKind: 'bag', defaults: { warmth: 1, formality: 2, wearsBeforeWash: 999 } },
  // Tracked for the closet and laundry; outfits never pick socks as an accessory.
  { id: 'socks', label: 'Socks', group: 'accessories', slot: 'accessory', accessoryKind: 'socks', defaults: { warmth: 2, formality: 2, wearsBeforeWash: 1 } },
  { id: 'sunglasses', label: 'Sunglasses', group: 'accessories', slot: 'accessory', accessoryKind: 'sunglasses', defaults: { warmth: 1, formality: 2, wearsBeforeWash: 999 } },
  // Other
  { id: 'dress', label: 'Dress', group: 'other', slot: 'onePiece', defaults: { warmth: 2, formality: 3, wearsBeforeWash: 1 } },
  { id: 'jumpsuit', label: 'Jumpsuit', group: 'other', slot: 'onePiece', defaults: { warmth: 2, formality: 2, wearsBeforeWash: 1 } },
  { id: 'suit', label: 'Suit', group: 'other', slot: 'onePiece', defaults: { warmth: 3, formality: 5, wearsBeforeWash: 4, styleTags: ['formal'] } },
  { id: 'activewear', label: 'Activewear set', group: 'other', slot: 'onePiece', defaults: { warmth: 1, formality: 1, wearsBeforeWash: 1, styleTags: ['athletic'] } },
];

export const GROUP_LABELS: Record<CategoryGroup, string> = {
  tops: 'Tops',
  bottoms: 'Bottoms',
  footwear: 'Shoes',
  accessories: 'Accessories',
  other: 'Dresses & sets',
};

const byId = new Map(CATEGORIES.map((c) => [c.id, c]));

/** Retired category ids and what they became (old posts and backups still use them). */
export const RETIRED_CATEGORIES: Record<string, string> = { chinos: 'trousers' };

export function getCategory(id: string, custom: CustomCategory[] = []): CategoryDef {
  const found = byId.get(RETIRED_CATEGORIES[id] ?? id);
  if (found) return found;
  const c = custom.find((x) => x.id === id);
  if (c) {
    return {
      id: c.id,
      label: c.label,
      group: c.group,
      slot: c.slot,
      defaults: { warmth: 2, formality: 2, wearsBeforeWash: 2 },
      layer: c.slot === 'outerwear' ? 'outer' : c.slot === 'top' ? 'base' : undefined,
    };
  }
  // Unknown ids (e.g. deleted custom category) degrade to a generic accessory
  // so an item never silently becomes part of a core slot.
  return { id, label: 'Other', group: 'other', slot: 'accessory', defaults: { warmth: 1, formality: 2, wearsBeforeWash: 999 } };
}

export function allCategories(custom: CustomCategory[] = []): CategoryDef[] {
  return [...CATEGORIES, ...custom.map((c) => getCategory(c.id, custom))];
}

/**
 * Categories whose items move to the hamper automatically once they reach
 * their own wears-before-wash count. Shoes and accessories never do by default.
 */
export const DEFAULT_AUTO_DIRTY = CATEGORIES.filter(
  (c) => c.group === 'tops' || c.group === 'bottoms' || c.group === 'other',
).map((c) => c.id);

/** Pieces left out of suggestions, examples and the sample closet for menswear. */
const WOMENSWEAR_ONLY = new Set(['dress', 'skirt']);
export const suitsWardrobe = (categoryId: string, clothesFor: ClothesFor = 'all') => clothesFor !== 'mens' || !WOMENSWEAR_ONLY.has(categoryId);
