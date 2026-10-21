/**
 * Core domain models. Everything persisted locally is defined here so the
 * storage layer, engine, and UI agree on one shape. Bump SCHEMA_VERSION and
 * add a migration in src/storage/migrations.ts when a persisted shape changes.
 */

export const SCHEMA_VERSION = 1;

export type ID = string;
export type ISODate = string; // YYYY-MM-DD
export type ISODateTime = string;

/** Slot an item fills in an outfit. Derived from category. */
export type Slot = 'top' | 'bottom' | 'onePiece' | 'outerwear' | 'footwear' | 'accessory';

export type CategoryGroup = 'tops' | 'bottoms' | 'footwear' | 'accessories' | 'other';

export type Pattern =
  | 'solid'
  | 'stripe'
  | 'check'
  | 'floral'
  | 'graphic'
  | 'print'
  | 'texture'
  | 'other';

export type Fit = 'oversized' | 'relaxed' | 'regular' | 'slim' | 'tailored';

export type StyleTag =
  | 'streetwear'
  | 'minimalist'
  | 'casual'
  | 'smartCasual'
  | 'athletic'
  | 'vintage'
  | 'preppy'
  | 'businessCasual'
  | 'formal'
  | 'workwear'
  | 'outdoor'
  | 'classic'
  | 'trend';

/** 1 = loungewear … 5 = black tie */
export type Formality = 1 | 2 | 3 | 4 | 5;

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

/** Warmth an item provides: 1 = very light (linen tee) … 5 = heavy (parka). */
export type Warmth = 1 | 2 | 3 | 4 | 5;

export type Availability = 'available' | 'lent' | 'repair' | 'storage';

export type Occasion =
  | 'everyday'
  | 'work'
  | 'class'
  | 'date'
  | 'party'
  | 'formalEvent'
  | 'workout'
  | 'outdoors'
  | 'travel'
  | 'interview';

export interface ClothingItem {
  id: ID;
  name: string;
  categoryId: string;
  /** Free-text refinement, e.g. "Crewneck" */
  subcategory?: string;
  primaryColor: string; // color id from src/engine/colors.ts
  secondaryColors: string[];
  pattern: Pattern;
  material?: string;
  fit?: Fit;
  styleTags: StyleTag[];
  formality: Formality;
  warmth: Warmth;
  /** Handles rain without soaking through (boots, shell jackets). */
  waterResistant: boolean;
  seasons: Season[]; // empty = all seasons
  clean: boolean;
  availability: Availability;
  /** How many wears before it needs washing. 1 = after every wear. */
  wearsBeforeWash: number;
  wearsSinceWash: number;
  lastWornOn?: ISODate;
  wearCount: number;
  favorite: boolean;
  /** Absolute file:// URI inside the app's document directory. */
  imageUri?: string;
  brand?: string;
  notes?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  /** True for starter items created by "Start with samples". */
  sample?: boolean;
}

export interface Outfit {
  id: ID;
  itemIds: ID[];
  name?: string;
  createdAt: ISODateTime;
  saved: boolean;
  /** Snapshot of the engine's explanation when the outfit was generated. */
  reasons?: string[];
  score?: number;
  occasion?: Occasion;
}

export interface WearLog {
  id: ID;
  date: ISODate;
  itemIds: ID[];
  outfitId?: ID;
  createdAt: ISODateTime;
}

export type FeedbackKind = 'like' | 'dislike' | 'notMyStyle';

export interface FeedbackEntry {
  id: ID;
  itemIds: ID[];
  kind: FeedbackKind;
  createdAt: ISODateTime;
}

export interface PlannedEvent {
  id: ID;
  title: string;
  date: ISODate;
  time?: string; // HH:mm
  location?: string;
  occasion: Occasion;
  formality: Formality;
  notes?: string;
  outfitId?: ID;
  /** Reserved for future Apple/Google calendar import. */
  externalSource?: { provider: 'apple' | 'google'; externalId: string };
}

export interface PackingEntry {
  itemId?: ID;
  label: string;
  quantity: number;
  packed: boolean;
  custom?: boolean;
}

export interface Trip {
  id: ID;
  destination: string;
  latitude?: number;
  longitude?: number;
  startDate: ISODate;
  endDate: ISODate;
  activities: Occasion[];
  laundryAvailable: boolean;
  carryOnOnly: boolean;
  packingList: PackingEntry[];
  /** Min/max temps used when the list was generated (°C). */
  forecastSummary?: { minC: number; maxC: number; rainy: boolean; source: 'forecast' | 'estimate' };
  createdAt: ISODateTime;
}

export type ColdSensitivity = 'runsCold' | 'neutral' | 'runsWarm';
export type TempUnit = 'F' | 'C';
export type ThemePreference = 'system' | 'light' | 'dark';

export interface SavedLocation {
  name: string;
  latitude: number;
  longitude: number;
  source: 'device' | 'manual';
}

export interface UserPreferences {
  onboarded: boolean;
  displayName?: string;
  styles: StyleTag[];
  fitByGroup: Partial<Record<CategoryGroup, Fit>>;
  coldSensitivity: ColdSensitivity;
  tempUnit: TempUnit;
  location?: SavedLocation;
  theme: ThemePreference;
  /** Category ids that go to the hamper automatically after "Wear today". */
  autoDirtyCategories: string[];
  /** Soft-avoid items worn within this many days. */
  repeatWindowDays: number;
  haptics: boolean;
  /** Custom categories added by the user. */
  customCategories: CustomCategory[];
}

export interface CustomCategory {
  id: string;
  label: string;
  group: CategoryGroup;
  slot: Slot;
}

export interface AppData {
  schemaVersion: number;
  items: ClothingItem[];
  outfits: Outfit[];
  wearLogs: WearLog[];
  feedback: FeedbackEntry[];
  events: PlannedEvent[];
  trips: Trip[];
  preferences: UserPreferences;
}
