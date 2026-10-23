/**
 * Wardrobe photo storage. Photos are normalized (rotated/cropped by the user,
 * resized to ≤1200px, JPEG) and copied into <documents>/wardrobe/. Only the
 * relative path is persisted. Nothing is uploaded anywhere.
 */
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';

const DIR = 'wardrobe';

function wardrobeDir() {
  const dir = new Directory(Paths.document, DIR);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/** Turn a stored path into something <Image> can render. */
export function resolveImage(path?: string): string | undefined {
  if (!path) return undefined;
  if (/^(file|data|blob|https?|content|ph|assets-library):/.test(path)) return path;
  return new File(Paths.document, path).uri;
}

export interface EditOps {
  rotate?: number; // degrees, multiples of 90
  crop?: { originX: number; originY: number; width: number; height: number };
}

/**
 * Apply edits + resize; returns a temporary URI (cache) and its size.
 * `width`/`height` are the source dimensions (after rotation is applied below).
 */
export async function processImage(
  uri: string,
  size: { width: number; height: number },
  ops: EditOps = {},
  maxSize = 1200,
) {
  const ctx = ImageManipulator.manipulate(uri);
  let { width, height } = size;
  if (ops.rotate) {
    ctx.rotate(ops.rotate);
    if (Math.abs(ops.rotate) % 180 === 90) [width, height] = [height, width];
  }
  if (ops.crop) {
    ctx.crop(ops.crop);
    ({ width, height } = ops.crop);
  }
  if (Math.max(width, height) > maxSize) {
    const scale = maxSize / Math.max(width, height);
    ctx.resize({ width: Math.round(width * scale), height: Math.round(height * scale) });
  }
  const rendered = await ctx.renderAsync();
  return rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.82 }); // { uri, width, height }
}

/** Copy a processed image into permanent storage. Returns the relative path. */
export async function persistImage(tempUri: string, itemId: string): Promise<string> {
  if (Platform.OS === 'web') return tempUri; // web preview: keep the data/blob URI
  const dir = wardrobeDir();
  const name = `${itemId}-${Date.now()}.jpg`;
  const src = new File(tempUri);
  const dest = new File(dir, name);
  await src.copy(dest);
  return `${DIR}/${name}`;
}

export function deleteImage(path?: string) {
  if (!path || Platform.OS === 'web' || /^[a-z]+:/.test(path)) return;
  try {
    const f = new File(Paths.document, path);
    if (f.exists) f.delete();
  } catch {
    // Already gone — nothing to do.
  }
}

export function deleteAllImages() {
  if (Platform.OS === 'web') return;
  try {
    const dir = new Directory(Paths.document, DIR);
    if (dir.exists) dir.delete();
  } catch {
    // ignore
  }
}

/** Total bytes used by wardrobe photos (for the Data screen). */
export function imagesSize(): number {
  if (Platform.OS === 'web') return 0;
  try {
    const dir = new Directory(Paths.document, DIR);
    if (!dir.exists) return 0;
    return dir.list().reduce((s, f) => s + (f instanceof File ? (f.size ?? 0) : 0), 0);
  } catch {
    return 0;
  }
}
