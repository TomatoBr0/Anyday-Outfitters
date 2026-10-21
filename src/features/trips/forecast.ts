import { getForecast, seasonalEstimate } from '@/services/weather';
import type { ISODate, Trip } from '@/types/models';
import { fromISODate } from '@/utils/dates';

/**
 * Min/max/rain for a trip window. Uses the real forecast for days within the
 * 16-day horizon; otherwise a seasonal estimate (flagged as such).
 */
export async function tripForecast(lat: number | undefined, lon: number | undefined, start: ISODate, end: ISODate): Promise<NonNullable<Trip['forecastSummary']>> {
  if (lat === undefined || lon === undefined) {
    return { minC: 10, maxC: 22, rainy: false, source: 'estimate' };
  }
  const f = await getForecast(lat, lon);
  const days = f.source === 'estimate' ? [] : f.daily.filter((d) => d.date >= start && d.date <= end);
  if (days.length) {
    return {
      minC: Math.min(...days.map((d) => d.feelsLowC)),
      maxC: Math.max(...days.map((d) => d.feelsHighC)),
      rainy: days.some((d) => d.precipProbability >= 50),
      source: 'forecast',
    };
  }
  const est = seasonalEstimate(lat, fromISODate(start)).daily[0];
  return { minC: est.feelsLowC, maxC: est.feelsHighC, rainy: false, source: 'estimate' };
}
