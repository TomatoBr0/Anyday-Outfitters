import { DEFAULT_AUTO_DIRTY } from '@/engine/categories';
import { SCHEMA_VERSION, type AppData, type UserPreferences } from '@/types/models';

export function defaultPreferences(): UserPreferences {
  return {
    onboarded: false,
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
    items: arr(raw.items),
    outfits: arr(raw.outfits),
    wearLogs: arr(raw.wearLogs),
    feedback: arr(raw.feedback),
    events: arr(raw.events),
    trips: arr(raw.trips),
    preferences: prefs,
  };
}
