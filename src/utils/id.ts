import * as Crypto from 'expo-crypto';

/** Stable, collision-resistant ids for items, outfits, logs, events and trips. */
export function newId(): string {
  return Crypto.randomUUID();
}
