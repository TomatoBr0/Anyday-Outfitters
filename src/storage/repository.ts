/**
 * Data access layer. The app only talks to `DataRepository`, so a cloud-synced
 * implementation (Supabase/Firebase) can be added later without touching UI.
 *
 * Local implementation: one AsyncStorage key per collection, written only when
 * that collection changes. Photos live on the filesystem (see services/images).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { defaultPreferences, migrate } from './migrations';
import { SCHEMA_VERSION, type AppData } from '@/types/models';

export type Collection = Exclude<keyof AppData, 'schemaVersion'>;
export const COLLECTIONS: Collection[] = ['items', 'outfits', 'wearLogs', 'feedback', 'events', 'trips', 'preferences'];

export interface DataRepository {
  load(): Promise<AppData>;
  save<K extends Collection>(collection: K, value: AppData[K]): Promise<void>;
  clear(): Promise<void>;
}

const PREFIX = 'getup:v1:';

export class LocalRepository implements DataRepository {
  async load(): Promise<AppData> {
    const keys = [...COLLECTIONS.map((c) => PREFIX + c), PREFIX + 'schemaVersion'];
    const pairs = await AsyncStorage.multiGet(keys);
    const raw: Record<string, unknown> = {};
    for (const [k, v] of pairs) {
      if (v == null) continue;
      try {
        raw[k.slice(PREFIX.length)] = JSON.parse(v);
      } catch {
        // A corrupt collection shouldn't take the whole app down; it resets to default.
      }
    }
    const data = migrate(raw);
    if (raw.schemaVersion !== SCHEMA_VERSION) {
      await AsyncStorage.setItem(PREFIX + 'schemaVersion', JSON.stringify(SCHEMA_VERSION));
    }
    return data;
  }

  async save<K extends Collection>(collection: K, value: AppData[K]) {
    await AsyncStorage.setItem(PREFIX + collection, JSON.stringify(value));
  }

  async clear() {
    await AsyncStorage.multiRemove([...COLLECTIONS.map((c) => PREFIX + c), PREFIX + 'schemaVersion']);
  }
}

export function emptyData(): AppData {
  return {
    schemaVersion: SCHEMA_VERSION,
    items: [],
    outfits: [],
    wearLogs: [],
    feedback: [],
    events: [],
    trips: [],
    preferences: defaultPreferences(),
  };
}
