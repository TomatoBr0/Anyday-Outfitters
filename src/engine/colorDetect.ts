/**
 * Dominant garment color from pixels. Heuristic, not ML:
 *  - estimate the background from the image border and ignore similar pixels
 *  - weight pixels toward the center (garments are usually framed centrally)
 *  - snap each pixel to the nearest palette color in a perceptual-ish space
 * Results are offered as *suggestions* the user confirms.
 */
import { COLORS } from './colors';
import type { DecodedImage } from '@/utils/png';

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Approximate Lab via linearized sRGB → XYZ → Lab for better nearest-color picks.
function toLab([r, g, b]: RGB): RGB {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const R = lin(r);
  const G = lin(g);
  const B = lin(b);
  const X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}

const PALETTE = COLORS.filter((c) => c.id !== 'multi').map((c) => ({ id: c.id, lab: toLab(hexToRgb(c.hex)) }));

function dist(a: RGB, b: RGB) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

export function nearestColorId(rgb: RGB): string {
  const lab = toLab(rgb);
  let best = PALETTE[0];
  let bd = Infinity;
  for (const p of PALETTE) {
    const d = dist(lab, p.lab);
    if (d < bd) [best, bd] = [p, d];
  }
  return best.id;
}

export interface ColorSuggestion {
  primary: string;
  secondary?: string;
  confidence: number; // share of garment pixels matching primary, 0..1
}

export function detectColors(img: DecodedImage): ColorSuggestion | undefined {
  const { width: w, height: h, data } = img;
  if (!w || !h) return undefined;
  const px = (x: number, y: number): RGB => {
    const i = (y * w + x) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  };

  // Background estimate: average of the border ring.
  const border: RGB[] = [];
  for (let x = 0; x < w; x++) border.push(px(x, 0), px(x, h - 1));
  for (let y = 1; y < h - 1; y++) border.push(px(0, y), px(w - 1, y));
  const bgLabs = border.map(toLab);
  const bg = bgLabs.reduce<RGB>((s, l) => [s[0] + l[0], s[1] + l[1], s[2] + l[2]], [0, 0, 0]).map((v) => v / bgLabs.length) as RGB;
  const bgSpread = bgLabs.reduce((s, l) => s + dist(l, bg), 0) / bgLabs.length;
  const bgUniform = bgSpread < 12; // busy backgrounds can't be subtracted reliably
  // Tight threshold on clean backgrounds so cream-on-white still counts as garment.
  const bgThreshold = Math.max(6, bgSpread * 1.5 + 4);

  const counts = new Map<string, number>();
  let total = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (data[i + 3] < 128) continue; // transparent (cut-out images)
      const rgb = px(x, y);
      const lab = toLab(rgb);
      if (bgUniform && dist(lab, bg) < bgThreshold) continue;
      const dx = (x + 0.5) / w - 0.5;
      const dy = (y + 0.5) / h - 0.5;
      const weight = Math.max(0.15, 1 - Math.hypot(dx, dy) * 1.6);
      const id = nearestColorId(rgb);
      counts.set(id, (counts.get(id) ?? 0) + weight);
      total += weight;
    }
  }
  if (total === 0) return undefined;
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const [primary, pw] = ranked[0];
  const second = ranked.find(([id, v]) => id !== primary && v / total >= 0.18 && !similar(id, primary));
  return { primary, secondary: second?.[0], confidence: pw / total };
}

/** Neighboring palette shades (e.g. charcoal vs black) shouldn't count as a second color. */
function similar(a: string, b: string) {
  const groups = [
    ['black', 'charcoal'],
    ['white', 'cream'],
    ['cream', 'beige'],
    ['beige', 'tan'],
    ['tan', 'brown'],
    ['navy', 'denim'],
    ['grey', 'charcoal'],
    ['grey', 'white'],
    ['olive', 'sage'],
    ['green', 'forest'],
    ['blue', 'denim'],
    ['red', 'burgundy'],
    ['rust', 'orange'],
    ['mustard', 'yellow'],
    ['lavender', 'purple'],
  ];
  return groups.some((g) => g.includes(a) && g.includes(b));
}
