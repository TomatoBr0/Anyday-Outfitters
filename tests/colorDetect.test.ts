import { readFileSync } from 'fs';
import { join } from 'path';

import { detectColors, nearestColorId } from '@/engine/colorDetect';
import { base64ToBytes, decodePng } from '@/utils/png';

const load = (name: string) => {
  const b64 = readFileSync(join(__dirname, 'fixtures', name)).toString('base64');
  return decodePng(base64ToBytes(b64));
};

describe('png decoding', () => {
  it('decodes RGB and RGBA PNGs', () => {
    const rgb = load('navy-on-white.png');
    expect(rgb.width).toBe(32);
    expect(rgb.data.length).toBe(32 * 32 * 4);
    const rgba = load('rust-on-grey-rgba.png');
    expect(rgba.height).toBe(32);
  });

  it('rejects non-PNG data', () => {
    expect(() => decodePng(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))).toThrow();
  });
});

describe('color detection', () => {
  it('maps raw RGB to the closest palette color', () => {
    expect(nearestColorId([20, 20, 20])).toBe('black');
    expect(nearestColorId([250, 250, 248])).toBe('white');
    expect(nearestColorId([30, 42, 70])).toBe('navy');
  });

  it('finds a navy garment on a white background', () => {
    expect(detectColors(load('navy-on-white.png'))?.primary).toBe('navy');
  });

  it('finds a rust garment on a grey background', () => {
    expect(detectColors(load('rust-on-grey-rgba.png'))?.primary).toBe('rust');
  });

  it('reports a secondary color for stripes', () => {
    const s = detectColors(load('stripe-cream-navy.png'));
    expect(['cream', 'beige']).toContain(s?.primary);
    expect(s?.secondary).toBe('navy');
  });
});
