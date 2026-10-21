import type { Availability, Fit, Formality, Pattern, Season, Warmth } from '@/types/models';

export const FORMALITY_LABELS: Record<Formality, string> = {
  1: 'Lounge',
  2: 'Casual',
  3: 'Smart',
  4: 'Dressy',
  5: 'Formal',
};

export const WARMTH_LABELS: Record<Warmth, string> = {
  1: 'Very light',
  2: 'Light',
  3: 'Medium',
  4: 'Warm',
  5: 'Heavy',
};

export const PATTERN_LABELS: Record<Pattern, string> = {
  solid: 'Solid',
  stripe: 'Stripes',
  check: 'Check / plaid',
  floral: 'Floral',
  graphic: 'Graphic',
  print: 'Print',
  texture: 'Textured',
  other: 'Other',
};

export const FIT_LABELS: Record<Fit, string> = {
  oversized: 'Oversized',
  relaxed: 'Relaxed',
  regular: 'Regular',
  slim: 'Slim',
  tailored: 'Tailored',
};

export const SEASON_LABELS: Record<Season, string> = {
  spring: 'Spring',
  summer: 'Summer',
  autumn: 'Autumn',
  winter: 'Winter',
};

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  available: 'Available',
  lent: 'Lent out',
  repair: 'In repair',
  storage: 'In storage',
};
