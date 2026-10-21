import * as Location from 'expo-location';

import type { SavedLocation } from '@/types/models';

export type LocationOutcome =
  | { ok: true; location: SavedLocation }
  | { ok: false; reason: 'denied' | 'unavailable' };

/**
 * Ask for foreground location once, only when the user taps "Use my location".
 * We store a city-level label and coordinates rounded to ~1km; nothing leaves
 * the device except the rounded coordinates sent to the weather service.
 */
export async function locateDevice(): Promise<LocationOutcome> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return { ok: false, reason: 'denied' };
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
    const latitude = Math.round(pos.coords.latitude * 100) / 100;
    const longitude = Math.round(pos.coords.longitude * 100) / 100;
    let name = 'Current location';
    try {
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (place) name = place.city || place.subregion || place.region || name;
    } catch {
      // Reverse geocoding is optional.
    }
    return { ok: true, location: { name, latitude, longitude, source: 'device' } };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}
