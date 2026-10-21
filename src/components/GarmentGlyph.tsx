/**
 * Flat garment silhouettes used when an item has no photo (manual entries and
 * the sample closet). Filled with the item's palette color; patterns are
 * suggested with a clipped overlay.
 */
import Svg, { ClipPath, Defs, G, Path, Rect, Circle } from 'react-native-svg';

import { getCategory } from '@/engine/categories';
import { getColor } from '@/engine/colors';
import type { ClothingItem } from '@/types/models';

const SHAPES: Record<string, string> = {
  tee: 'M31 16 13 27l7 15 9-4v48h42V38l9 4 7-15-18-11c-3 6-10 10-19 10s-16-4-19-10Z',
  long: 'M32 14 18 22 9 72l11 3 9-34v47h42V41l9 34 11-3-9-50-14-8c-3 6-9 9-18 9s-15-3-18-9Z',
  coat: 'M32 10 17 18 8 78l11 3 9-36v48h44V45l9 36 11-3-9-60-15-8-8 8h-12l-8-8Z',
  pants: 'M29 10h42l6 82H58L50 38l-8 54H23Z',
  shorts: 'M27 24h46l6 46H57l-7-22-7 22H21Z',
  skirt: 'M35 18h30l16 64H19Z',
  dress: 'M39 8h4l7 12 7-12h4l2 24 14 58H22l14-58Z',
  sneaker: 'M10 64c0-9 6-15 14-16l14-4c5 9 13 12 23 12l17 3c8 2 12 6 12 13v5H10Z',
  boot: 'M30 12h24v42l24 7c7 2 11 6 11 13v6H30Z',
  dressShoe: 'M8 68c0-6 4-10 10-11l26-6c6 4 12 6 20 6h12c9 0 16 5 16 12v4H8Z',
  sandal: 'M10 70h80v6H10Z M30 70c0-10 4-18 12-18s12 8 12 18 M56 70c0-8 3-14 9-14s9 6 9 14',
  hat: 'M18 66c0-26 13-40 32-40s32 14 32 40Z',
  bag: 'M18 38h64l-4 50H22Z',
};

function shapeFor(categoryId: string): string {
  const c = getCategory(categoryId);
  switch (c.id) {
    case 'tshirt': case 'polo': case 'tank': case 'blouse': return SHAPES.tee;
    case 'longsleeve': case 'buttondown': case 'sweater': case 'hoodie': return SHAPES.long;
    case 'jacket': case 'blazer': case 'raincoat': case 'coat': return SHAPES.coat;
    case 'shorts': return SHAPES.shorts;
    case 'skirt': return SHAPES.skirt;
    case 'dress': case 'jumpsuit': case 'activewear': return SHAPES.dress;
    case 'suit': return SHAPES.coat;
    case 'sneakers': case 'athletic': return SHAPES.sneaker;
    case 'boots': return SHAPES.boot;
    case 'dressshoes': case 'loafers': return SHAPES.dressShoe;
    case 'sandals': return SHAPES.sandal;
    case 'hat': case 'beanie': return SHAPES.hat;
    case 'bag': return SHAPES.bag;
  }
  if (c.slot === 'bottom') return SHAPES.pants;
  if (c.slot === 'footwear') return SHAPES.sneaker;
  if (c.slot === 'outerwear') return SHAPES.coat;
  if (c.slot === 'onePiece') return SHAPES.dress;
  if (c.slot === 'top') return SHAPES.tee;
  return '';
}

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function GarmentGlyph({ item, size = 80 }: { item: Pick<ClothingItem, 'categoryId' | 'primaryColor' | 'secondaryColors' | 'pattern'>; size?: number | `${number}%` }) {
  const color = getColor(item.primaryColor);
  const second = getColor(item.secondaryColors[0] ?? (luminance(color.hex) > 0.5 ? 'charcoal' : 'cream'));
  const fill = item.primaryColor === 'multi' ? '#C9643F' : color.hex;
  const light = luminance(fill) > 0.78;
  const stroke = light ? 'rgba(28,27,25,0.28)' : 'rgba(0,0,0,0.18)';
  const cat = getCategory(item.categoryId);
  const d = shapeFor(item.categoryId);
  const id = `clip-${item.categoryId}-${item.pattern}-${item.primaryColor}`;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityElementsHidden importantForAccessibility="no">
      {d ? (
        <>
          <Defs>
            <ClipPath id={id}>
              <Path d={d} />
            </ClipPath>
          </Defs>
          <Path d={d} fill={fill} stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" />
          <G clipPath={`url(#${id})`}>{patternOverlay(item.pattern, second.hex, item.primaryColor === 'multi')}</G>
          {(cat.id === 'jacket' || cat.id === 'blazer' || cat.id === 'coat' || cat.id === 'raincoat' || cat.id === 'suit' || cat.id === 'buttondown') && (
            <Path d="M50 22v68" stroke={light ? 'rgba(28,27,25,0.25)' : 'rgba(255,255,255,0.25)'} strokeWidth={1.5} />
          )}
          {cat.id === 'hoodie' && <Path d="M38 14c2 10 22 10 24 0" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth={2} />}
          {(cat.id === 'hat' || cat.id === 'beanie') && <Rect x={16} y={60} width={68} height={9} rx={3} fill={fill} stroke={stroke} strokeWidth={1.5} />}
          {cat.id === 'bag' && <Path d="M36 38c0-14 28-14 28 0" fill="none" stroke={fill} strokeWidth={5} />}
        </>
      ) : (
        accessoryShape(cat.accessoryKind, fill, stroke)
      )}
    </Svg>
  );
}

function patternOverlay(pattern: ClothingItem['pattern'], color: string, multi: boolean) {
  const lines = [];
  if (multi) {
    return (
      <>
        <Rect x={0} y={0} width={100} height={33} fill="#E7C343" opacity={0.9} />
        <Rect x={0} y={33} width={100} height={33} fill="#2F7A4B" opacity={0.9} />
        <Rect x={0} y={66} width={100} height={34} fill="#2B5FC4" opacity={0.9} />
      </>
    );
  }
  switch (pattern) {
    case 'stripe':
      for (let y = 18; y < 100; y += 8) lines.push(<Rect key={y} x={0} y={y} width={100} height={3} fill={color} opacity={0.85} />);
      return lines;
    case 'check':
      for (let v = 8; v < 100; v += 12) {
        lines.push(<Rect key={`h${v}`} x={0} y={v} width={100} height={4} fill={color} opacity={0.4} />);
        lines.push(<Rect key={`v${v}`} x={v} y={0} width={4} height={100} fill={color} opacity={0.4} />);
      }
      return lines;
    case 'floral':
    case 'print':
      for (let y = 20; y < 100; y += 16)
        for (let x = 14 + ((y / 16) % 2) * 8; x < 100; x += 16) lines.push(<Circle key={`${x}-${y}`} cx={x} cy={y} r={3.2} fill={color} opacity={0.7} />);
      return lines;
    case 'graphic':
      return <Rect x={38} y={38} width={24} height={20} rx={4} fill={color} opacity={0.85} />;
    case 'texture':
      for (let x = 0; x < 100; x += 6) lines.push(<Rect key={x} x={x} y={0} width={1.4} height={100} fill="#000" opacity={0.08} />);
      return lines;
    default:
      return null;
  }
}

function accessoryShape(kind: string | undefined, fill: string, stroke: string) {
  switch (kind) {
    case 'sunglasses':
      return (
        <G>
          <Circle cx={32} cy={52} r={15} fill={fill} stroke={stroke} strokeWidth={2} />
          <Circle cx={68} cy={52} r={15} fill={fill} stroke={stroke} strokeWidth={2} />
          <Path d="M46 50c2-3 6-3 8 0" stroke={fill} strokeWidth={4} fill="none" />
          <Path d="M17 48 8 42M83 48l9-6" stroke={fill} strokeWidth={4} strokeLinecap="round" />
        </G>
      );
    case 'watch':
      return (
        <G>
          <Rect x={40} y={8} width={20} height={84} rx={6} fill={fill} opacity={0.75} />
          <Circle cx={50} cy={50} r={18} fill={fill} stroke={stroke} strokeWidth={3} />
          <Circle cx={50} cy={50} r={12} fill="#F7F7F5" />
          <Path d="M50 50V42M50 50l5 3" stroke="#1C1B19" strokeWidth={2} strokeLinecap="round" />
        </G>
      );
    case 'belt':
      return (
        <G>
          <Rect x={6} y={42} width={88} height={16} rx={4} fill={fill} stroke={stroke} strokeWidth={1.5} />
          <Rect x={20} y={38} width={20} height={24} rx={3} fill="none" stroke="#B9B2A6" strokeWidth={4} />
        </G>
      );
    case 'jewelry':
      return (
        <G>
          <Circle cx={50} cy={46} r={26} fill="none" stroke={fill} strokeWidth={5} />
          <Circle cx={50} cy={74} r={7} fill={fill} stroke={stroke} strokeWidth={1.5} />
        </G>
      );
    case 'scarf':
      return <Path d="M30 14h40v40l-8 40H52l4-38H44l4 38H38l-8-40Z" fill={fill} stroke={stroke} strokeWidth={1.5} />;
    default:
      return <Rect x={22} y={22} width={56} height={56} rx={14} fill={fill} stroke={stroke} strokeWidth={1.5} />;
  }
}
