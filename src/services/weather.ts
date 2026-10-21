/**
 * Weather via Open-Meteo (https://open-meteo.com), no API key required.
 *
 * Licensing: the free tier is for NON-COMMERCIAL use and data is CC BY 4.0
 * (attribution shown in-app). Before a paid launch, switch to an Open-Meteo
 * paid plan or another provider — only `fetchForecast` needs to change.
 *
 * Caching: forecasts are cached per ~1km grid cell for 30 minutes, and a stale
 * cache (up to 3 days) is used when offline. Without any data, a seasonal
 * estimate is returned and clearly marked as such.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { WeatherCondition, WeatherSnapshot } from '@/engine/types';
import type { ISODate } from '@/types/models';

export interface DailyForecast {
  date: ISODate;
  highC: number;
  lowC: number;
  feelsHighC: number;
  feelsLowC: number;
  precipProbability: number;
  windKph: number;
  uvIndex?: number;
  condition: WeatherCondition;
  code: number;
}

export interface Forecast {
  fetchedAt: number;
  latitude: number;
  longitude: number;
  current?: { tempC: number; feelsLikeC: number; windKph: number; condition: WeatherCondition; code: number; isDay: boolean };
  daily: DailyForecast[];
  source: 'live' | 'cache' | 'estimate';
}

const CACHE_TTL = 30 * 60 * 1000;
const STALE_LIMIT = 3 * 24 * 60 * 60 * 1000;
const cacheKey = (lat: number, lon: number) => `getup:weather:${lat.toFixed(2)},${lon.toFixed(2)}`;

/** WMO weather interpretation codes → our coarse conditions. */
export function conditionFromCode(code: number): WeatherCondition {
  if (code === 0 || code === 1) return 'clear';
  if (code === 2 || code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'cloudy';
}

export const CONDITION_LABEL: Record<WeatherCondition, string> = {
  clear: 'Clear',
  cloudy: 'Cloudy',
  fog: 'Foggy',
  drizzle: 'Drizzle',
  rain: 'Rain',
  snow: 'Snow',
  storm: 'Thunderstorms',
};

async function fetchWithTimeout(url: string, ms = 8000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export async function fetchForecast(lat: number, lon: number): Promise<Forecast> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_probability_max,wind_speed_10m_max,uv_index_max' +
    '&timezone=auto&forecast_days=16';
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`Weather request failed (${res.status})`);
  return parseForecast(await res.json(), lat, lon);
}

export function parseForecast(json: any, lat: number, lon: number): Forecast {
  const d = json.daily ?? {};
  const daily: DailyForecast[] = (d.time ?? []).map((date: string, i: number) => {
    const code = d.weather_code?.[i] ?? 3;
    return {
      date,
      highC: d.temperature_2m_max?.[i] ?? 18,
      lowC: d.temperature_2m_min?.[i] ?? 10,
      feelsHighC: d.apparent_temperature_max?.[i] ?? d.temperature_2m_max?.[i] ?? 18,
      feelsLowC: d.apparent_temperature_min?.[i] ?? d.temperature_2m_min?.[i] ?? 10,
      precipProbability: d.precipitation_probability_max?.[i] ?? 0,
      windKph: d.wind_speed_10m_max?.[i] ?? 0,
      uvIndex: d.uv_index_max?.[i],
      condition: conditionFromCode(code),
      code,
    };
  });
  const c = json.current;
  return {
    fetchedAt: Date.now(),
    latitude: lat,
    longitude: lon,
    current: c
      ? {
          tempC: c.temperature_2m,
          feelsLikeC: c.apparent_temperature,
          windKph: c.wind_speed_10m,
          condition: conditionFromCode(c.weather_code),
          code: c.weather_code,
          isDay: c.is_day === 1,
        }
      : undefined,
    daily,
    source: 'live',
  };
}

/** Rough climate estimate for when no forecast is reachable. */
export function seasonalEstimate(lat: number, date: Date = new Date()): Forecast {
  const month = date.getMonth(); // 0..11
  const north = lat >= 0;
  // Peak warmth mid-July (north) / mid-January (south).
  const phase = ((month - (north ? 6 : 0) + 12) % 12) / 12;
  const seasonal = Math.cos(phase * 2 * Math.PI); // 1 at peak summer
  const latFactor = Math.max(0, 1 - Math.abs(lat) / 70);
  const mean = 8 + 14 * latFactor + seasonal * (6 + 8 * (1 - latFactor));
  const iso = date.toISOString().slice(0, 10);
  return {
    fetchedAt: Date.now(),
    latitude: lat,
    longitude: 0,
    daily: [
      {
        date: iso,
        highC: Math.round(mean + 5),
        lowC: Math.round(mean - 5),
        feelsHighC: Math.round(mean + 5),
        feelsLowC: Math.round(mean - 6),
        precipProbability: 20,
        windKph: 10,
        condition: 'cloudy',
        code: 3,
      },
    ],
    source: 'estimate',
  };
}

export async function getForecast(lat: number, lon: number, opts: { force?: boolean } = {}): Promise<Forecast> {
  const key = cacheKey(lat, lon);
  let cached: Forecast | undefined;
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) cached = JSON.parse(raw);
  } catch {
    // ignore corrupt cache
  }
  if (cached && !opts.force && Date.now() - cached.fetchedAt < CACHE_TTL) return { ...cached, source: 'cache' };
  try {
    const fresh = await fetchForecast(lat, lon);
    AsyncStorage.setItem(key, JSON.stringify(fresh)).catch(() => {});
    return fresh;
  } catch {
    if (cached && Date.now() - cached.fetchedAt < STALE_LIMIT) return { ...cached, source: 'cache' };
    return seasonalEstimate(lat);
  }
}

export function dayFromForecast(f: Forecast | undefined, date: ISODate): DailyForecast | undefined {
  return f?.daily.find((d) => d.date === date);
}

/**
 * Collapse a day into what the engine needs. People dress once for the whole
 * day, so feels-like leans toward the daytime high but respects the low.
 */
export function snapshotFor(f: Forecast | undefined, date: ISODate, today: ISODate): WeatherSnapshot | undefined {
  const day = dayFromForecast(f, date) ?? (f?.source === 'estimate' ? f.daily[0] : undefined);
  if (!day) return undefined;
  const dayFeel = day.feelsHighC * 0.6 + day.feelsLowC * 0.4;
  const useCurrent = date === today && f?.current;
  const feels = useCurrent ? (f!.current!.feelsLikeC + dayFeel) / 2 : dayFeel;
  return {
    feelsLikeC: Math.round(feels * 10) / 10,
    tempC: useCurrent ? f!.current!.tempC : (day.highC + day.lowC) / 2,
    highC: day.highC,
    lowC: day.lowC,
    precipProbability: day.precipProbability,
    windKph: Math.max(day.windKph * 0.7, useCurrent ? f!.current!.windKph : 0),
    condition: useCurrent && day.precipProbability < 50 ? f!.current!.condition : day.condition,
    uvIndex: day.uvIndex,
  };
}

export interface GeoResult {
  name: string;
  region?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

export async function searchCity(query: string): Promise<GeoResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const res = await fetchWithTimeout(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`,
  );
  if (!res.ok) throw new Error('City search failed');
  const json = await res.json();
    return (json.results ?? []).map((r: any) => ({
    name: r.name,
    region: r.admin1,
    country: r.country,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

export function formatTemp(c: number, unit: 'F' | 'C') {
  return unit === 'F' ? `${Math.round((c * 9) / 5 + 32)}°` : `${Math.round(c)}°`;
}
