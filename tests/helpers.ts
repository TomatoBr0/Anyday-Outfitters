import { createItem, type NewItemInput } from '@/engine/itemFactory';
import type { EngineContext, WeatherSnapshot } from '@/engine/types';
import type { ClothingItem } from '@/types/models';

let n = 0;
export function item(input: NewItemInput): ClothingItem {
  n += 1;
  return createItem(`i${n}`, input, [], '2026-10-01T00:00:00.000Z');
}

export function ctx(items: ClothingItem[], over: Partial<EngineContext> = {}): EngineContext {
  return {
    items,
    date: '2026-10-21',
    occasion: 'everyday',
    preferredStyles: [],
    fitByGroup: {},
    coldSensitivity: 'neutral',
    wearLogs: [],
    feedback: [],
    customCategories: [],
    repeatWindowDays: 5,
    seed: 1,
    ...over,
  };
}

export function weather(over: Partial<WeatherSnapshot> = {}): WeatherSnapshot {
  return {
    feelsLikeC: 18,
    tempC: 18,
    highC: 21,
    lowC: 12,
    precipProbability: 5,
    windKph: 8,
    condition: 'clear',
    ...over,
  };
}

/** A balanced closet used by most tests. */
export function basicCloset() {
  return {
    tee: item({ name: 'White tee', categoryId: 'tshirt', primaryColor: 'white', styleTags: ['casual', 'minimalist'] }),
    tee2: item({ name: 'Black tee', categoryId: 'tshirt', primaryColor: 'black', styleTags: ['casual', 'streetwear'] }),
    sweater: item({ name: 'Cream sweater', categoryId: 'sweater', primaryColor: 'cream', styleTags: ['classic'] }),
    oxford: item({ name: 'Oxford', categoryId: 'buttondown', primaryColor: 'lightblue', styleTags: ['smartCasual', 'businessCasual'] }),
    jeans: item({ name: 'Jeans', categoryId: 'jeans', primaryColor: 'denim', styleTags: ['casual', 'classic'] }),
    shorts: item({ name: 'Shorts', categoryId: 'shorts', primaryColor: 'olive', styleTags: ['casual'] }),
    trousers: item({ name: 'Trousers', categoryId: 'trousers', primaryColor: 'charcoal', styleTags: ['businessCasual', 'formal'] }),
    sneakers: item({ name: 'Sneakers', categoryId: 'sneakers', primaryColor: 'white', styleTags: ['casual', 'minimalist'] }),
    boots: item({ name: 'Boots', categoryId: 'boots', primaryColor: 'brown', styleTags: ['classic', 'workwear'] }),
    sandals: item({ name: 'Sandals', categoryId: 'sandals', primaryColor: 'tan', styleTags: ['casual'] }),
    loafers: item({ name: 'Loafers', categoryId: 'loafers', primaryColor: 'black', styleTags: ['classic', 'formal'] }),
    rain: item({ name: 'Rain shell', categoryId: 'raincoat', primaryColor: 'tan', styleTags: ['outdoor'] }),
    coat: item({ name: 'Wool coat', categoryId: 'coat', primaryColor: 'charcoal', styleTags: ['classic'] }),
    blazer: item({ name: 'Blazer', categoryId: 'blazer', primaryColor: 'navy', styleTags: ['smartCasual', 'formal'] }),
    beanie: item({ name: 'Beanie', categoryId: 'beanie', primaryColor: 'forest', styleTags: ['casual'] }),
    shades: item({ name: 'Sunglasses', categoryId: 'sunglasses', primaryColor: 'black' }),
  };
}

export function list(c: Record<string, ClothingItem>) {
  return Object.values(c);
}
