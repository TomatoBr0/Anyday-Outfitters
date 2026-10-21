/**
 * Single source of truth for the product name and copy that would change on a
 * rename. App Store name/bundle id live in app.json — see docs/RENAMING.md.
 */
export const BRAND = {
  name: 'Getup',
  tagline: 'Get up. Get dressed. Get going.',
  promise: 'Open the app. Get dressed. Get on with your day.',
  supportEmail: 'hello@example.com', // placeholder until a domain is chosen
  weatherAttribution: 'Weather data by Open-Meteo.com (CC BY 4.0)',
} as const;
