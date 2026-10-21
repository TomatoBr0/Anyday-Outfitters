import { getCategory } from './categories';
import type { ClothingItem, CustomCategory, ID } from '@/types/models';

export type NewItemInput = Partial<Omit<ClothingItem, 'id' | 'createdAt' | 'updatedAt'>> & {
  categoryId: string;
};

/** Build a complete item from partial input, filling category-based defaults. */
export function createItem(
  id: ID,
  input: NewItemInput,
  custom: CustomCategory[] = [],
  now = new Date().toISOString(),
): ClothingItem {
  const cat = getCategory(input.categoryId, custom);
  return {
    id,
    name: input.name?.trim() || cat.label,
    categoryId: input.categoryId,
    subcategory: input.subcategory,
    primaryColor: input.primaryColor ?? 'black',
    secondaryColors: input.secondaryColors ?? [],
    pattern: input.pattern ?? 'solid',
    material: input.material,
    fit: input.fit,
    styleTags: input.styleTags ?? cat.defaults.styleTags ?? ['casual'],
    formality: input.formality ?? cat.defaults.formality,
    warmth: input.warmth ?? cat.defaults.warmth,
    waterResistant: input.waterResistant ?? cat.defaults.waterResistant ?? false,
    seasons: input.seasons ?? [],
    clean: input.clean ?? true,
    availability: input.availability ?? 'available',
    wearsBeforeWash: input.wearsBeforeWash ?? cat.defaults.wearsBeforeWash,
    wearsSinceWash: input.wearsSinceWash ?? 0,
    lastWornOn: input.lastWornOn,
    wearCount: input.wearCount ?? 0,
    favorite: input.favorite ?? false,
    imageUri: input.imageUri,
    brand: input.brand,
    notes: input.notes,
    sample: input.sample,
    createdAt: now,
    updatedAt: now,
  };
}
