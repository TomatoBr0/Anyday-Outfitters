/**
 * Optional AI piece detection. When EXPO_PUBLIC_DETECT_URL points at the
 * Getup detect Worker (worker/detect), a photo of several clothes comes back as
 * one box per piece with a suggested category, colour and name. Without it the
 * split screen still works: people draw the boxes themselves.
 *
 * Only a downscaled copy of the one photo is sent, and only when the person
 * taps "Find pieces". The API key stays on the Worker, never in the app.
 */
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { allCategories } from '@/engine/categories';
import { COLORS } from '@/engine/colors';
import { STYLE_LABELS } from '@/engine/scoring';
import { FIT_LABELS, PATTERN_LABELS } from '@/features/closet/labels';
import type { Fit, Formality, Pattern, StyleTag, Warmth } from '@/types/models';

const DETECT_URL = process.env.EXPO_PUBLIC_DETECT_URL;
export const detectConfigured = !!DETECT_URL;

/** Box as fractions of the image (0–1), top-left origin. */
export interface FracBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedPiece {
  categoryId: string;
  colorId: string;
  secondaryColorIds: string[];
  name: string;
  /** Short refinement, e.g. "Crewneck". */
  detail: string;
  pattern: Pattern;
  /** Empty when fit doesn't apply or can't be seen. */
  fit: Fit | '';
  styleTags: StyleTag[];
  formality: Formality;
  warmth: Warmth;
  waterResistant: boolean;
  box: FracBox;
}

/** Turn a detected piece into the editor's suggestions for that photo. */
export function hintFrom(p: DetectedPiece) {
  return {
    categoryId: p.categoryId,
    primaryColor: p.colorId,
    secondaryColors: p.secondaryColorIds,
    name: p.name,
    subcategory: p.detail || undefined,
    pattern: p.pattern,
    fit: p.fit || undefined,
    styleTags: p.styleTags,
    formality: p.formality,
    warmth: p.warmth,
    waterResistant: p.waterResistant,
  };
}

export async function detectPieces(photo: { uri: string; width: number; height: number }): Promise<DetectedPiece[]> {
  if (!DETECT_URL) throw new Error('Piece detection is not set up');
  // Explicit size on both sides: the web implementation can't infer a null dimension.
  const scale = Math.min(1, 1024 / Math.max(photo.width, photo.height));
  const ctx = ImageManipulator.manipulate(photo.uri);
  if (scale < 1) ctx.resize({ width: Math.round(photo.width * scale), height: Math.round(photo.height * scale) });
  const small = await (await ctx.renderAsync()).saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
  const res = await fetch(`${DETECT_URL.replace(/\/$/, '')}/detect`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      image: small.base64,
      categories: allCategories().map((c) => c.id),
      colors: COLORS.map((c) => c.id),
      patterns: Object.keys(PATTERN_LABELS),
      fits: Object.keys(FIT_LABELS),
      styles: Object.keys(STYLE_LABELS),
    }),
  });
  if (!res.ok) throw new Error(`Detection failed (${res.status})`);
  const data = (await res.json()) as { pieces?: DetectedPiece[] };
  return Array.isArray(data.pieces) ? data.pieces : [];
}
