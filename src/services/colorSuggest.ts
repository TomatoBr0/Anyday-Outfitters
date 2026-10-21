import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { detectColors, type ColorSuggestion } from '@/engine/colorDetect';
import { base64ToBytes, decodePng } from '@/utils/png';

/**
 * Suggest garment colors from a photo, fully on-device. Returns undefined if
 * the image can't be analyzed — the UI then simply asks the user to pick.
 */
export async function suggestColors(uri: string): Promise<ColorSuggestion | undefined> {
  try {
    const ctx = ImageManipulator.manipulate(uri).resize({ width: 32, height: 32 });
    const ref = await ctx.renderAsync();
    const out = await ref.saveAsync({ format: SaveFormat.PNG, base64: true });
    if (!out.base64) return undefined;
    const img = decodePng(base64ToBytes(out.base64));
    const s = detectColors(img);
    return s && s.confidence >= 0.2 ? s : undefined;
  } catch {
    return undefined;
  }
}
