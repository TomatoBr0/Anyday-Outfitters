import { ClothingItem } from '@/types/app';

const CLOTHING_STORAGE_KEY = 'anyday_outfitters_clothing_items';

export const getClothingItems = (): ClothingItem[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  const itemsJson = localStorage.getItem(CLOTHING_STORAGE_KEY);
  return itemsJson ? JSON.parse(itemsJson) : [];
};

export const addClothingItem = (newItem: ClothingItem) => {
  if (typeof window === 'undefined') {
    return;
  }
  const currentItems = getClothingItems();
  const updatedItems = [...currentItems, newItem];
  localStorage.setItem(CLOTHING_STORAGE_KEY, JSON.stringify(updatedItems));
};

// This function can be used to initialize dummy data or clear storage if needed
export const setClothingItems = (items: ClothingItem[]) => {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(CLOTHING_STORAGE_KEY, JSON.stringify(items));
};