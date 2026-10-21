import AsyncStorage from '@react-native-async-storage/async-storage';

import { conditionFromCode, getForecast, parseForecast, seasonalEstimate, snapshotFor } from '@/services/weather';

jest.mock('@react-native-async-storage/async-storage', () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));

const sample = {
  current: { temperature_2m: 12, apparent_temperature: 10, weather_code: 61, wind_speed_10m: 22, is_day: 1 },
  daily: {
    time: ['2026-10-21', '2026-10-22'],
    weather_code: [63, 0],
    temperature_2m_max: [15, 20],
    temperature_2m_min: [8, 11],
    apparent_temperature_max: [13, 20],
    apparent_temperature_min: [5, 10],
    precipitation_probability_max: [80, 5],
    wind_speed_10m_max: [30, 10],
    uv_index_max: [2, 5],
  },
};

describe('weather parsing', () => {
  it('maps WMO codes to conditions', () => {
    expect(conditionFromCode(0)).toBe('clear');
    expect(conditionFromCode(3)).toBe('cloudy');
    expect(conditionFromCode(63)).toBe('rain');
    expect(conditionFromCode(75)).toBe('snow');
    expect(conditionFromCode(95)).toBe('storm');
  });

  it('parses daily + current data', () => {
    const f = parseForecast(sample, 42.36, -71.06);
    expect(f.daily).toHaveLength(2);
    expect(f.daily[0].condition).toBe('rain');
    expect(f.current?.feelsLikeC).toBe(10);
  });

  it('builds a day snapshot that blends current and daily feel', () => {
    const f = parseForecast(sample, 0, 0);
    const today = snapshotFor(f, '2026-10-21', '2026-10-21')!;
    expect(today.precipProbability).toBe(80);
    expect(today.condition).toBe('rain');
    expect(today.feelsLikeC).toBeGreaterThan(5);
    expect(today.feelsLikeC).toBeLessThan(13);
    const tomorrow = snapshotFor(f, '2026-10-22', '2026-10-21')!;
    expect(tomorrow.condition).toBe('clear');
    expect(snapshotFor(f, '2026-12-01', '2026-10-21')).toBeUndefined();
  });

  it('tolerates missing fields', () => {
    const f = parseForecast({ daily: { time: ['2026-10-21'] } }, 0, 0);
    expect(f.daily[0].highC).toBeDefined();
    expect(f.current).toBeUndefined();
  });
});

describe('fallbacks', () => {
  beforeEach(() => AsyncStorage.clear());

  it('returns a labeled seasonal estimate when offline with no cache', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
    const f = await getForecast(42.36, -71.06);
    expect(f.source).toBe('estimate');
    expect(f.daily).toHaveLength(1);
  });

  it('uses the cache when the network fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => sample }) as unknown as typeof fetch;
    const live = await getForecast(1, 2);
    expect(live.source).toBe('live');
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
    const cached = await getForecast(1, 2, { force: true });
    expect(cached.source).toBe('cache');
    expect(cached.daily).toHaveLength(2);
  });

  it('seasonal estimate is warmer in July than January (north)', () => {
    const jul = seasonalEstimate(42, new Date(2026, 6, 15)).daily[0];
    const jan = seasonalEstimate(42, new Date(2026, 0, 15)).daily[0];
    expect(jul.highC).toBeGreaterThan(jan.highC + 10);
  });
});
