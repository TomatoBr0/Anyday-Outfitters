import { DEFAULT_AUTO_DIRTY, RETIRED_CATEGORIES } from '@/engine/categories';
import { SCHEMA_VERSION, type AppData, type ClothingItem, type UserPreferences } from '@/types/models';

export function defaultPreferences(): UserPreferences {
  return {
    onboarded: false,
    clothesFor: 'all',
    styles: [],
    fitByGroup: {},
    coldSensitivity: 'neutral',
    tempUnit: 'F',
    theme: 'system',
    autoDirtyCategories: DEFAULT_AUTO_DIRTY,
    repeatWindowDays: 5,
    haptics: true,
    customCategories: [],
  };
}

const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/**
 * Bring any persisted shape up to the current schema. Missing or malformed
 * collections fall back to defaults; unknown preference keys are dropped.
 */
export function migrate(raw: Record<string, unknown>): AppData {
  const prefs = { ...defaultPreferences(), ...((raw.preferences as Partial<UserPreferences>) ?? {}) };
  // v1 is the first schema; future migrations go here, keyed on raw.schemaVersion.
  return {
    schemaVersion: SCHEMA_VERSION,
    items: arr<ClothingItem>(raw.items).map(retireCategory),
    outfits: arr(raw.outfits),
    wearLogs: arr(raw.wearLogs),
    feedback: arr(raw.feedback),
    events: arr(raw.events),
    trips: arr(raw.trips),
    preferences: prefs,
  };
}

const RETIRED_DETAIL: Record<string, string> = { chinos: 'Chinos' };

/** Move items off retired categories (e.g. Chinos → Pants) without losing what they were. Idempotent. */
function retireCategory(i: ClothingItem): ClothingItem {
  const to = RETIRED_CATEGORIES[i.categoryId];
  if (!to) return i;
  return { ...i, categoryId: to, subcategory: i.subcategory || RETIRED_DETAIL[i.categoryId] };
}
