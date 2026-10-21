import type {
  ClothingItem,
  ColdSensitivity,
  CustomCategory,
  FeedbackEntry,
  Fit,
  CategoryGroup,
  Formality,
  ID,
  ISODate,
  Occasion,
  Slot,
  StyleTag,
  WearLog,
} from '@/types/models';

export type WeatherCondition = 'clear' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm';

/** Normalized weather the engine reasons about. All metric. */
export interface WeatherSnapshot {
  /** Feels-like temperature representative of the day (°C). */
  feelsLikeC: number;
  tempC: number;
  highC: number;
  lowC: number;
  precipProbability: number; // 0-100
  windKph: number;
  condition: WeatherCondition;
  uvIndex?: number;
}

export interface EngineContext {
  items: ClothingItem[];
  date: ISODate;
  weather?: WeatherSnapshot;
  occasion: Occasion;
  /** Overrides the occasion's default formality band (e.g. a planned event). */
  targetFormality?: Formality;
  preferredStyles: StyleTag[];
  fitByGroup: Partial<Record<CategoryGroup, Fit>>;
  coldSensitivity: ColdSensitivity;
  wearLogs: WearLog[];
  feedback: FeedbackEntry[];
  customCategories: CustomCategory[];
  repeatWindowDays: number;
  /** Items the user pinned; they will appear in every result. */
  lockedItemIds?: ID[];
  /** Outfit signatures already shown this session, to keep regenerate fresh. */
  excludeSignatures?: string[];
  /** Include dirty/unavailable items (explicit user override). */
  allowUnavailable?: boolean;
  /** Seed for tie-breaking jitter; change it to get alternatives. */
  seed?: number;
}

export interface ScoreBreakdown {
  style: number;
  color: number;
  weather: number;
  occasion: number;
  preference: number;
  rotation: number;
}

export interface Recommendation {
  itemIds: ID[];
  bySlot: Partial<Record<Slot, ID>> & { accessories?: ID[] };
  score: number; // 0..100
  breakdown: ScoreBreakdown;
  title: string;
  reasons: string[];
  warnings: string[];
  signature: string;
}

export type EngineIssue =
  | { kind: 'empty' }
  | { kind: 'missing'; slot: Slot; message: string }
  | { kind: 'unavailable'; slot: Slot; message: string }
  | { kind: 'weatherFallback'; message: string };

export interface EngineResult {
  outfits: Recommendation[];
  issues: EngineIssue[];
}
