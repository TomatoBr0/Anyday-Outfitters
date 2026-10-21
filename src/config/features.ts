/**
 * Feature flags and the free/Plus split. No payments are wired up — `isPlus`
 * is always false until a subscription provider is approved and integrated
 * (see docs/PREMIUM.md). Core wardrobe features are never gated.
 */
export type PlanTier = 'free' | 'plus';

export interface FeatureDef {
  id: string;
  title: string;
  body: string;
  tier: PlanTier;
  status: 'available' | 'planned' | 'experimental';
}

export const FEATURES: FeatureDef[] = [
  { id: 'closet', title: 'Unlimited closet', body: 'Add every piece you own, with photos.', tier: 'free', status: 'available' },
  { id: 'daily', title: 'Daily outfit + alternatives', body: 'Weather-, event- and laundry-aware picks.', tier: 'free', status: 'available' },
  { id: 'builder', title: 'Outfit builder, lock & swap', body: 'Build around a favorite piece.', tier: 'free', status: 'available' },
  { id: 'laundry', title: 'Laundry tracking', body: 'Per-item wash rules and a fast hamper.', tier: 'free', status: 'available' },
  { id: 'calendar', title: 'Calendar planning', body: 'Plan outfits for upcoming events.', tier: 'free', status: 'available' },
  { id: 'trips', title: 'Trip packing lists', body: 'Capsule packing from your own closet.', tier: 'free', status: 'available' },
  { id: 'insights', title: 'Advanced wardrobe analytics', body: 'Cost-per-wear, color and category trends, closet gaps.', tier: 'plus', status: 'planned' },
  { id: 'sync', title: 'Cross-device sync & backup', body: 'Your closet on every device.', tier: 'plus', status: 'planned' },
  { id: 'bgremove', title: 'Background removal', body: 'Clean cut-out photos of every piece.', tier: 'plus', status: 'planned' },
  { id: 'calendarSync', title: 'Apple & Google Calendar', body: 'Dress for meetings automatically.', tier: 'plus', status: 'planned' },
  { id: 'stylist', title: 'AI styling chat', body: 'Ask for advice in plain language.', tier: 'plus', status: 'planned' },
  { id: 'voice', title: 'Voice assistant', body: '“What should I wear tomorrow?”', tier: 'plus', status: 'planned' },
];

export const isPlus = false;

export function hasFeature(id: string): boolean {
  const f = FEATURES.find((x) => x.id === id);
  if (!f || f.status !== 'available') return false;
  return f.tier === 'free' || isPlus;
}
