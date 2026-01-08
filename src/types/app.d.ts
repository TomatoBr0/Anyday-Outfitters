export interface ClothingItem {
  id: string;
  userId: string;
  name: string;
  imageUrl: string;
  clothingType: 'shirt' | 'pants' | 'jacket' | 'shoes' | 'accessory' | 'other';
  style: 'casual' | 'streetwear' | 'formal' | 'athletic' | 'vintage' | 'business casual' | 'bohemian' | 'minimalist' | 'preppy' | 'gothic' | 'punk' | 'other';
  fit: 'oversized' | 'slim' | 'regular';
  season: 'summer' | 'winter' | 'spring' | 'autumn' | 'all-season';
  colors: string[]; // e.g., ['red', 'blue']
  warmthLevel: 'light' | 'medium' | 'warm' | 'very warm';
  occasion: 'school' | 'work' | 'travel' | 'event' | 'casual' | 'sport' | 'party' | 'sleep' | 'other';
  isClean: boolean;
  lastWornDate?: string; // ISO date string
  uploadedAt: string; // ISO date string
}

export interface Outfit {
  id: string;
  userId: string;
  name?: string;
  itemIds: string[]; // Array of ClothingItem IDs
  date: string; // ISO date string for when the outfit was suggested/worn
  weatherInfo?: {
    temperature: number; // Celsius or Fahrenheit
    condition: string; // e.g., 'sunny', 'rainy'
    windSpeed?: number;
  };
  calendarEventInfo?: {
    eventName: string;
    eventType: string; // e.g., 'work', 'meeting', 'party'
  };
  explanation: string; // Why this outfit was chosen
  isFavorite: boolean;
  generatedAt: string; // ISO date string
}

export interface User {
  id: string;
  name: string;
  email: string;
  stylePreferences: {
    preferredStyles: Array<ClothingItem['style']>;
    preferredColors: string[];
    avoidColors: string[];
    warmthPreference: 'cold' | 'neutral' | 'warm';
  };
  location: {
    city: string;
    country: string;
    latitude?: number;
    longitude?: number;
  };
  calendarConnected: boolean;
  isPremium: boolean;
  onboardingComplete: boolean;
  createdAt: string; // ISO date string
}