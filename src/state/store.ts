/**
 * App state (zustand). Persisted collections are written through the
 * repository whenever they change; weather and UI state are memory-only.
 */
import { create } from 'zustand';

import { SAMPLE_CLOSET } from '@/data/sampleCloset';
import { createItem, type NewItemInput } from '@/engine/itemFactory';
import { suitsWardrobe } from '@/engine/categories';
import { applyWear, setClean } from '@/engine/laundry';
import { deleteAllImages, deleteImage } from '@/services/images';
import { getForecast, type Forecast } from '@/services/weather';
import { COLLECTIONS, LocalRepository, emptyData, type Collection, type DataRepository } from '@/storage/repository';
import type {
  AppData,
  Availability,
  ClothingItem,
  FeedbackKind,
  ID,
  ISODate,
  Outfit,
  PlannedEvent,
  Trip,
  UserPreferences,
  WearLog,
} from '@/types/models';
import { toISODate } from '@/utils/dates';
import { newId } from '@/utils/id';

export type WeatherStatus = 'idle' | 'loading' | 'ready' | 'error' | 'noLocation';

interface State extends AppData {
  hydrated: boolean;
  forecast?: Forecast;
  weatherStatus: WeatherStatus;
}

interface Actions {
  hydrate(): Promise<void>;
  // closet
  addItems(inputs: NewItemInput[]): ID[];
  updateItem(id: ID, patch: Partial<ClothingItem>): void;
  deleteItem(id: ID): void;
  toggleFavorite(id: ID): void;
  setCleanState(ids: ID[], clean: boolean): void;
  setAvailability(id: ID, availability: Availability): void;
  loadSamples(): void;
  removeSamples(): void;
  // outfits
  saveOutfit(itemIds: ID[], meta?: Partial<Outfit>): ID;
  updateOutfit(id: ID, patch: Partial<Outfit>): void;
  deleteOutfit(id: ID): void;
  wearOutfit(itemIds: ID[], opts?: { date?: ISODate; outfitId?: ID }): WearLog;
  undoWear(logId: ID): void;
  addFeedback(itemIds: ID[], kind: FeedbackKind): void;
  // planning
  upsertEvent(e: Omit<PlannedEvent, 'id'> & { id?: ID }): ID;
  deleteEvent(id: ID): void;
  upsertTrip(t: Omit<Trip, 'id' | 'createdAt'> & { id?: ID; createdAt?: string }): ID;
  deleteTrip(id: ID): void;
  togglePacked(tripId: ID, index: number): void;
  // settings
  setPreferences(patch: Partial<UserPreferences>): void;
  refreshWeather(force?: boolean): Promise<void>;
  resetAll(): Promise<void>;
}

export type Store = State & Actions;

let repo: DataRepository = new LocalRepository();
/** Swap the repository (tests, or a future cloud-synced implementation). */
export function setRepository(r: DataRepository) {
  repo = r;
}

const now = () => new Date().toISOString();

export const useStore = create<Store>()((set, get) => ({
  ...emptyData(),
  hydrated: false,
  weatherStatus: 'idle',

  async hydrate() {
    try {
      const data = await repo.load();
      set({ ...data, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  addItems(inputs) {
    const custom = get().preferences.customCategories;
    const created = inputs.map((i) => createItem(newId(), i, custom));
    set({ items: [...created, ...get().items] });
    return created.map((c) => c.id);
  },

  updateItem(id, patch) {
    set({ items: get().items.map((i) => (i.id === id ? { ...i, ...patch, id, updatedAt: now() } : i)) });
  },

  deleteItem(id) {
    const item = get().items.find((i) => i.id === id);
    if (item) deleteImage(item.imagePath);
    set({
      items: get().items.filter((i) => i.id !== id),
      // Outfits that lose a piece keep the rest; empty ones disappear.
      outfits: get()
        .outfits.map((o) => ({ ...o, itemIds: o.itemIds.filter((x) => x !== id) }))
        .filter((o) => o.itemIds.length > 0),
    });
  },

  toggleFavorite(id) {
    const it = get().items.find((i) => i.id === id);
    if (it) get().updateItem(id, { favorite: !it.favorite });
  },

  setCleanState(ids, clean) {
    set({ items: setClean(get().items, ids, clean) });
  },

  setAvailability(id, availability) {
    get().updateItem(id, { availability });
  },

  loadSamples() {
    const existing = new Set(get().items.filter((i) => i.sample).map((i) => i.name));
    const clothesFor = get().preferences.clothesFor;
    get().addItems(SAMPLE_CLOSET.filter((s) => !existing.has(s.name!) && suitsWardrobe(s.categoryId, clothesFor)).map((s) => ({ ...s, sample: true })));
  },

  removeSamples() {
    const ids = new Set(get().items.filter((i) => i.sample).map((i) => i.id));
    set({
      items: get().items.filter((i) => !ids.has(i.id)),
      outfits: get()
        .outfits.map((o) => ({ ...o, itemIds: o.itemIds.filter((x) => !ids.has(x)) }))
        .filter((o) => o.itemIds.length > 0),
    });
  },

  saveOutfit(itemIds, meta = {}) {
    const sig = [...itemIds].sort().join('+');
    const existing = get().outfits.find((o) => [...o.itemIds].sort().join('+') === sig);
    if (existing) {
      get().updateOutfit(existing.id, { saved: meta.saved ?? true, ...meta });
      return existing.id;
    }
    const o: Outfit = { id: newId(), itemIds, createdAt: now(), saved: true, ...meta };
    set({ outfits: [o, ...get().outfits] });
    return o.id;
  },

  updateOutfit(id, patch) {
    set({ outfits: get().outfits.map((o) => (o.id === id ? { ...o, ...patch, id } : o)) });
  },

  deleteOutfit(id) {
    set({
      outfits: get().outfits.filter((o) => o.id !== id),
      events: get().events.map((e) => (e.outfitId === id ? { ...e, outfitId: undefined } : e)),
    });
  },

  wearOutfit(itemIds, opts = {}) {
    const date = opts.date ?? toISODate();
    const { items, preferences } = get();
    const previous = items
      .filter((i) => itemIds.includes(i.id))
      .map(({ id, clean, wearsSinceWash, lastWornOn, wearCount }) => ({ id, clean, wearsSinceWash, lastWornOn, wearCount }));
    const log: WearLog = { id: newId(), date, itemIds, outfitId: opts.outfitId, createdAt: now(), previous };
    set({
      items: applyWear(items, itemIds, date, preferences.autoDirtyCategories),
      wearLogs: [log, ...get().wearLogs],
    });
    return log;
  },

  undoWear(logId) {
    const log = get().wearLogs.find((l) => l.id === logId);
    if (!log) return;
    const prev = new Map((log.previous ?? []).map((p) => [p.id, p]));
    set({
      wearLogs: get().wearLogs.filter((l) => l.id !== logId),
      items: get().items.map((i) => (prev.has(i.id) ? { ...i, ...prev.get(i.id)!, updatedAt: now() } : i)),
    });
  },

  addFeedback(itemIds, kind) {
    set({ feedback: [{ id: newId(), itemIds, kind, createdAt: now() }, ...get().feedback].slice(0, 500) });
  },

  upsertEvent(e) {
    const id = e.id ?? newId();
    const next: PlannedEvent = { ...e, id };
    const exists = get().events.some((x) => x.id === id);
    set({ events: exists ? get().events.map((x) => (x.id === id ? next : x)) : [...get().events, next] });
    return id;
  },

  deleteEvent(id) {
    set({ events: get().events.filter((e) => e.id !== id) });
  },

  upsertTrip(t) {
    const id = t.id ?? newId();
    const next: Trip = { ...t, id, createdAt: t.createdAt ?? now() };
    const exists = get().trips.some((x) => x.id === id);
    set({ trips: exists ? get().trips.map((x) => (x.id === id ? next : x)) : [next, ...get().trips] });
    return id;
  },

  deleteTrip(id) {
    set({ trips: get().trips.filter((t) => t.id !== id) });
  },

  togglePacked(tripId, index) {
    set({
      trips: get().trips.map((t) =>
        t.id === tripId
          ? { ...t, packingList: t.packingList.map((p, i) => (i === index ? { ...p, packed: !p.packed } : p)) }
          : t,
      ),
    });
  },

  setPreferences(patch) {
    const prev = get().preferences;
    set({ preferences: { ...prev, ...patch } });
    const loc = patch.location;
    if (loc && (loc.latitude !== prev.location?.latitude || loc.longitude !== prev.location?.longitude)) {
      get().refreshWeather(true);
    }
  },

  async refreshWeather(force = false) {
    const loc = get().preferences.location;
    if (!loc) {
      set({ weatherStatus: 'noLocation' });
      return;
    }
    set({ weatherStatus: 'loading' });
    try {
      const forecast = await getForecast(loc.latitude, loc.longitude, { force });
      set({ forecast, weatherStatus: forecast.source === 'estimate' ? 'error' : 'ready' });
    } catch {
      set({ weatherStatus: 'error' });
    }
  },

  async resetAll() {
    deleteAllImages();
    await repo.clear();
    set({ ...emptyData(), hydrated: true, forecast: undefined, weatherStatus: 'idle' });
  },
}));

// ---- persistence: write each collection when its reference changes (debounced)
const pending = new Set<Collection>();
let timer: ReturnType<typeof setTimeout> | undefined;

function flush() {
  const s = useStore.getState();
  const work = [...pending];
  pending.clear();
  for (const c of work) repo.save(c, s[c]).catch(() => {});
}

useStore.subscribe((s, prev) => {
  if (!s.hydrated || !prev.hydrated) return;
  for (const c of COLLECTIONS) if (s[c] !== prev[c]) pending.add(c);
  if (pending.size) {
    clearTimeout(timer);
    timer = setTimeout(flush, 200);
  }
});

/** Force pending writes (used before app backgrounding). */
export function flushPersistence() {
  clearTimeout(timer);
  flush();
}
