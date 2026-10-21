import { Outfit } from '@/types/app';

const OUTFIT_STORAGE_KEY = 'anyday_outfitters_outfits';

export const getOutfits = (): Outfit[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  const outfitsJson = localStorage.getItem(OUTFIT_STORAGE_KEY);
  return outfitsJson ? JSON.parse(outfitsJson) : [];
};

export const addOutfit = (newOutfit: Outfit) => {
  if (typeof window === 'undefined') {
    return;
  }
  const currentOutfits = getOutfits();
  const updatedOutfits = [...currentOutfits, newOutfit];
  localStorage.setItem(OUTFIT_STORAGE_KEY, JSON.stringify(updatedOutfits));
};

export const updateOutfit = (updatedOutfit: Outfit) => {
  if (typeof window === 'undefined') {
    return;
  }
  const currentOutfits = getOutfits();
  const updatedOutfits = currentOutfits.map(outfit =>
    outfit.id === updatedOutfit.id ? updatedOutfit : outfit
  );
  localStorage.setItem(OUTFIT_STORAGE_KEY, JSON.stringify(updatedOutfits));
};

export const deleteOutfit = (outfitId: string) => {
  if (typeof window === 'undefined') {
    return;
  }
  const currentOutfits = getOutfits();
  const updatedOutfits = currentOutfits.filter(outfit => outfit.id !== outfitId);
  localStorage.setItem(OUTFIT_STORAGE_KEY, JSON.stringify(updatedOutfits));
};

// This function can be used to initialize dummy data or clear storage if needed
export const setOutfits = (outfits: Outfit[]) => {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(OUTFIT_STORAGE_KEY, JSON.stringify(outfits));
};