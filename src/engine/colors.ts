/**
 * Clothing color palette and a small, explainable color-harmony model.
 *
 * Garment colors are picked from a fixed palette rather than free hex values so
 * that matching rules stay predictable. Each color carries a hue (degrees),
 * a saturation band, and whether it behaves as a neutral in an outfit.
 */

export interface ColorDef {
  id: string;
  label: string;
  hex: string;
  hue: number; // 0-360, meaningless for pure neutrals
  /** Neutrals pair with nearly everything. Denim and navy act as neutrals in menswear and womenswear alike. */
  neutral: boolean;
  /** 0 = muted, 1 = medium, 2 = vivid */
  intensity: 0 | 1 | 2;
  /** Lightness band used for contrast checks: 0 dark … 2 light */
  value: 0 | 1 | 2;
}

export const COLORS: ColorDef[] = [
  { id: 'black', label: 'Black', hex: '#141414', hue: 0, neutral: true, intensity: 0, value: 0 },
  { id: 'charcoal', label: 'Charcoal', hex: '#3B3B3D', hue: 0, neutral: true, intensity: 0, value: 0 },
  { id: 'grey', label: 'Grey', hex: '#9A9A9C', hue: 0, neutral: true, intensity: 0, value: 1 },
  { id: 'white', label: 'White', hex: '#F7F7F5', hue: 0, neutral: true, intensity: 0, value: 2 },
  { id: 'cream', label: 'Cream', hex: '#EFE6D2', hue: 42, neutral: true, intensity: 0, value: 2 },
  { id: 'beige', label: 'Beige', hex: '#D6C3A1', hue: 38, neutral: true, intensity: 0, value: 2 },
  { id: 'tan', label: 'Tan / Camel', hex: '#B88A57', hue: 32, neutral: true, intensity: 1, value: 1 },
  { id: 'brown', label: 'Brown', hex: '#6B4A33', hue: 25, neutral: true, intensity: 0, value: 0 },
  { id: 'navy', label: 'Navy', hex: '#1E2A44', hue: 222, neutral: true, intensity: 0, value: 0 },
  { id: 'denim', label: 'Denim', hex: '#4A6A91', hue: 213, neutral: true, intensity: 1, value: 1 },
  { id: 'olive', label: 'Olive', hex: '#6B6B3A', hue: 60, neutral: true, intensity: 0, value: 0 },
  { id: 'sage', label: 'Sage', hex: '#9CAA8B', hue: 92, neutral: false, intensity: 0, value: 1 },
  { id: 'green', label: 'Green', hex: '#2F7A4B', hue: 142, neutral: false, intensity: 2, value: 1 },
  { id: 'forest', label: 'Forest', hex: '#23412F', hue: 145, neutral: false, intensity: 1, value: 0 },
  { id: 'teal', label: 'Teal', hex: '#1F6E70', hue: 181, neutral: false, intensity: 1, value: 0 },
  { id: 'lightblue', label: 'Light blue', hex: '#A9C6E3', hue: 210, neutral: false, intensity: 0, value: 2 },
  { id: 'blue', label: 'Blue', hex: '#2B5FC4', hue: 220, neutral: false, intensity: 2, value: 1 },
  { id: 'purple', label: 'Purple', hex: '#6A3E8E', hue: 275, neutral: false, intensity: 2, value: 0 },
  { id: 'lavender', label: 'Lavender', hex: '#C3B4DE', hue: 262, neutral: false, intensity: 0, value: 2 },
  { id: 'pink', label: 'Pink', hex: '#E8A7BA', hue: 343, neutral: false, intensity: 1, value: 2 },
  { id: 'red', label: 'Red', hex: '#B8282E', hue: 357, neutral: false, intensity: 2, value: 1 },
  { id: 'burgundy', label: 'Burgundy', hex: '#5E1F2B', hue: 349, neutral: false, intensity: 1, value: 0 },
  { id: 'orange', label: 'Orange', hex: '#DB6B2A', hue: 22, neutral: false, intensity: 2, value: 1 },
  { id: 'rust', label: 'Rust', hex: '#9C4A26', hue: 18, neutral: false, intensity: 1, value: 0 },
  { id: 'yellow', label: 'Yellow', hex: '#E7C343', hue: 47, neutral: false, intensity: 2, value: 2 },
  { id: 'mustard', label: 'Mustard', hex: '#B98C22', hue: 41, neutral: false, intensity: 1, value: 1 },
  { id: 'multi', label: 'Multicolor', hex: '#888888', hue: 0, neutral: false, intensity: 2, value: 1 },
];

const map = new Map(COLORS.map((c) => [c.id, c]));

export function getColor(id: string | undefined): ColorDef {
  return (id && map.get(id)) || map.get('grey')!;
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * How well two colors sit together, 0..1.
 * Rules (in order): neutral pairings, monochrome/analogous, complementary,
 * and a mild penalty for two vivid colors that are neither.
 */
export function pairHarmony(aId: string, bId: string): number {
  const a = getColor(aId);
  const b = getColor(bId);
  if (a.id === 'multi' || b.id === 'multi') {
    // A busy piece is easiest next to neutrals.
    return a.neutral || b.neutral ? 0.85 : 0.35;
  }
  if (a.neutral && b.neutral) {
    // Tonal neutral outfits look intentional; head-to-toe dark of one shade reads flat.
    return a.id === b.id && a.value === 0 ? 0.8 : 0.95;
  }
  if (a.neutral || b.neutral) return 0.92;

  const d = hueDistance(a.hue, b.hue);
  if (a.id === b.id) return 0.72; // matching non-neutral pieces can look like a uniform
  if (d <= 35) return 0.88; // analogous
  if (d >= 150) return a.intensity === 2 && b.intensity === 2 ? 0.6 : 0.82; // complementary
  if (d >= 110) return 0.7; // split complementary / triadic
  // 35-110°: the zone where two saturated colors tend to clash
  const vivid = a.intensity + b.intensity;
  return vivid >= 3 ? 0.35 : 0.6;
}

export interface ColorAssessment {
  score: number; // 0..1
  note?: string;
}

/** Score the palette of a whole outfit. Accessories count at half weight. */
export function outfitColorScore(colors: { color: string; weight: number }[]): ColorAssessment {
  if (colors.length < 2) return { score: 0.8 };
  let total = 0;
  let weights = 0;
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const w = colors[i].weight * colors[j].weight;
      total += pairHarmony(colors[i].color, colors[j].color) * w;
      weights += w;
    }
  }
  let score = weights ? total / weights : 0.8;

  // More than two distinct statement colors gets noisy.
  const statement = new Set(
    colors.filter((c) => c.weight >= 1 && !getColor(c.color).neutral).map((c) => c.color),
  );
  if (statement.size > 2) score -= 0.15 * (statement.size - 2);

  const allNeutral = statement.size === 0;
  let note: string | undefined;
  if (score >= 0.88) note = allNeutral ? 'Clean neutral palette' : 'Colors complement each other';
  else if (score < 0.55) note = 'Bold color mix';
  return { score: Math.max(0, Math.min(1, score)), note };
}
