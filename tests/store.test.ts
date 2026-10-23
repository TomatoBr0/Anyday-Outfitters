/**
 * Store + persistence: simulates an app restart by re-hydrating a fresh state
 * from the same AsyncStorage contents.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { migrate } from '@/storage/migrations';
import { emptyData } from '@/storage/repository';
import { useStore, flushPersistence } from '@/state/store';

jest.mock('@react-native-async-storage/async-storage', () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@/services/images', () => ({ deleteImage: jest.fn(), deleteAllImages: jest.fn(), resolveImage: (p?: string) => p }));
let mockN = 0;
jest.mock('@/utils/id', () => ({ newId: () => `id-${++mockN}` }));

const restart = async () => {
  flushPersistence();
  await new Promise((r) => setTimeout(r, 10));
  useStore.setState({ ...emptyData(), hydrated: false });
  await useStore.getState().hydrate();
};

beforeEach(async () => {
  await AsyncStorage.clear();
  useStore.setState({ ...emptyData(), hydrated: false });
  await useStore.getState().hydrate();
});

describe('persistence', () => {
  it('keeps closet, outfits, history and preferences across restarts', async () => {
    const s = useStore.getState();
    s.setPreferences({ onboarded: true, displayName: 'Alex', styles: ['minimalist'] });
    const [a, b] = s.addItems([
      { categoryId: 'tshirt', name: 'Tee', primaryColor: 'white' },
      { categoryId: 'jeans', name: 'Jeans', primaryColor: 'denim' },
    ]);
    s.saveOutfit([a, b], { name: 'Basics' });
    s.wearOutfit([a, b], { date: '2026-10-21' });
    await restart();
    const after = useStore.getState();
    expect(after.preferences.onboarded).toBe(true);
    expect(after.preferences.displayName).toBe('Alex');
    expect(after.items.map((i) => i.name).sort()).toEqual(['Jeans', 'Tee']);
    expect(after.outfits[0].name).toBe('Basics');
    expect(after.wearLogs).toHaveLength(1);
    expect(after.items.find((i) => i.id === a)!.wearCount).toBe(1);
  });

  it('survives a corrupt collection without losing the rest', async () => {
    useStore.getState().addItems([{ categoryId: 'tshirt', name: 'Tee' }]);
    flushPersistence();
    await new Promise((r) => setTimeout(r, 10));
    await AsyncStorage.setItem('getup:v1:outfits', '{not json');
    await restart();
    expect(useStore.getState().items).toHaveLength(1);
    expect(useStore.getState().outfits).toEqual([]);
  });
});

describe('store actions', () => {
  it('undo restores wear counts and cleanliness exactly', () => {
    const s = useStore.getState();
    const [tee] = s.addItems([{ categoryId: 'tshirt', name: 'Tee' }]);
    const log = s.wearOutfit([tee], { date: '2026-10-21' });
    expect(useStore.getState().items[0].clean).toBe(false); // tees auto-dirty by default
    useStore.getState().undoWear(log.id);
    const it = useStore.getState().items[0];
    expect(it.clean).toBe(true);
    expect(it.wearCount).toBe(0);
    expect(it.lastWornOn).toBeUndefined();
    expect(useStore.getState().wearLogs).toHaveLength(0);
  });

  it('deleting an item removes it from saved outfits, and drops empty ones', () => {
    const s = useStore.getState();
    const [a, b] = s.addItems([{ categoryId: 'tshirt' }, { categoryId: 'jeans' }]);
    s.saveOutfit([a, b]);
    s.saveOutfit([a]);
    useStore.getState().deleteItem(a);
    const outfits = useStore.getState().outfits;
    expect(outfits).toHaveLength(1);
    expect(outfits[0].itemIds).toEqual([b]);
  });

  it('saving the same combination twice does not duplicate it', () => {
    const s = useStore.getState();
    const [a, b] = s.addItems([{ categoryId: 'tshirt' }, { categoryId: 'jeans' }]);
    s.saveOutfit([a, b]);
    s.saveOutfit([b, a]);
    expect(useStore.getState().outfits).toHaveLength(1);
  });

  it('sample closet can be loaded once and removed cleanly', () => {
    const s = useStore.getState();
    s.addItems([{ categoryId: 'tshirt', name: 'Mine' }]);
    s.loadSamples();
    s.loadSamples();
    const samples = useStore.getState().items.filter((i) => i.sample);
    expect(samples.length).toBeGreaterThan(20);
    expect(new Set(samples.map((i) => i.name)).size).toBe(samples.length);
    useStore.getState().removeSamples();
    expect(useStore.getState().items.map((i) => i.name)).toEqual(['Mine']);
  });

  it('menswear sample closet leaves out the dress', () => {
    useStore.getState().setPreferences({ clothesFor: 'mens' });
    useStore.getState().loadSamples();
    expect(useStore.getState().items.some((i) => i.categoryId === 'dress')).toBe(false);
  });

  it('clearing the wardrobe keeps settings, events and trips', async () => {
    const s = useStore.getState();
    s.setPreferences({ onboarded: true, displayName: 'Sam' });
    s.loadSamples();
    const ids = useStore.getState().items.slice(0, 3).map((i) => i.id);
    s.saveOutfit(ids);
    s.wearOutfit(ids);
    s.addFeedback(ids, 'like');
    s.upsertEvent({ date: '2026-11-02', title: 'Interview', occasion: 'work', formality: 3 });
    s.upsertTrip({ destination: 'NYC', startDate: '2026-11-05', endDate: '2026-11-07', latitude: 40.7, longitude: -74, activities: ['everyday'], laundryAvailable: false, carryOnOnly: true, packingList: [{ label: 'Jeans', itemId: ids[0], quantity: 1, packed: false }] });
    useStore.getState().clearWardrobe();
    await restart();
    const after = useStore.getState();
    expect([after.items, after.outfits, after.wearLogs, after.feedback]).toEqual([[], [], [], []]);
    expect(after.preferences.displayName).toBe('Sam');
    expect(after.events).toHaveLength(1);
    expect(after.trips[0].packingList[0]).not.toHaveProperty('itemId');
  });

  it('reset wipes everything', async () => {
    useStore.getState().addItems([{ categoryId: 'tshirt' }]);
    useStore.getState().setPreferences({ onboarded: true });
    await useStore.getState().resetAll();
    await restart();
    expect(useStore.getState().items).toEqual([]);
    expect(useStore.getState().preferences.onboarded).toBe(false);
  });
});

describe('migrations', () => {
  it('fills defaults for missing or malformed collections', () => {
    const d = migrate({ items: 'nope', preferences: { tempUnit: 'C' } });
    expect(d.items).toEqual([]);
    expect(d.preferences.tempUnit).toBe('C');
    expect(d.preferences.repeatWindowDays).toBe(5);
  });

  it('moves retired Chinos items to Pants, keeping what they were', () => {
    const base = { id: 'a', name: 'Khakis', primaryColor: 'beige' };
    const d = migrate({ items: [{ ...base, categoryId: 'chinos' }, { ...base, id: 'b', categoryId: 'chinos', subcategory: 'Slim chinos' }, { ...base, id: 'c', categoryId: 'jeans' }] });
    expect(d.items.map((i) => [i.categoryId, i.subcategory])).toEqual([
      ['trousers', 'Chinos'],
      ['trousers', 'Slim chinos'],
      ['jeans', undefined],
    ]);
    expect(migrate({ items: d.items }).items).toEqual(d.items);
  });
});
