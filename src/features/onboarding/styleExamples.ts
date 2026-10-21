import type { Pattern, StyleTag } from '@/types/models';

type Piece = { categoryId: string; primaryColor: string; secondaryColors?: string[]; pattern?: Pattern };

/** Mini flat-lays shown during onboarding so people pick by look, not jargon. */
export const STYLE_EXAMPLES: { tag: StyleTag; blurb: string; pieces: Piece[] }[] = [
  { tag: 'casual', blurb: 'Easy, comfortable basics', pieces: [{ categoryId: 'tshirt', primaryColor: 'white' }, { categoryId: 'jeans', primaryColor: 'denim' }, { categoryId: 'sneakers', primaryColor: 'white' }] },
  { tag: 'minimalist', blurb: 'Clean lines, quiet colors', pieces: [{ categoryId: 'tshirt', primaryColor: 'black' }, { categoryId: 'trousers', primaryColor: 'charcoal' }, { categoryId: 'loafers', primaryColor: 'black' }] },
  { tag: 'streetwear', blurb: 'Relaxed fits, statement pieces', pieces: [{ categoryId: 'hoodie', primaryColor: 'grey' }, { categoryId: 'sweatpants', primaryColor: 'black' }, { categoryId: 'sneakers', primaryColor: 'white', secondaryColors: ['red'] }, { categoryId: 'beanie', primaryColor: 'black' }] },
  { tag: 'smartCasual', blurb: 'Put together, not stiff', pieces: [{ categoryId: 'buttondown', primaryColor: 'lightblue' }, { categoryId: 'chinos', primaryColor: 'beige' }, { categoryId: 'loafers', primaryColor: 'brown' }] },
  { tag: 'athletic', blurb: 'Built to move', pieces: [{ categoryId: 'tshirt', primaryColor: 'grey' }, { categoryId: 'leggings', primaryColor: 'black' }, { categoryId: 'athletic', primaryColor: 'white', secondaryColors: ['orange'] }] },
  { tag: 'vintage', blurb: 'Thrifted, warm, lived-in', pieces: [{ categoryId: 'tshirt', primaryColor: 'rust', pattern: 'graphic', secondaryColors: ['cream'] }, { categoryId: 'jeans', primaryColor: 'denim' }, { categoryId: 'boots', primaryColor: 'brown' }] },
  { tag: 'preppy', blurb: 'Collars, knits, crisp layers', pieces: [{ categoryId: 'sweater', primaryColor: 'navy' }, { categoryId: 'chinos', primaryColor: 'beige' }, { categoryId: 'loafers', primaryColor: 'brown' }] },
  { tag: 'businessCasual', blurb: 'Office-ready, comfortable', pieces: [{ categoryId: 'blazer', primaryColor: 'navy' }, { categoryId: 'trousers', primaryColor: 'grey' }, { categoryId: 'dressshoes', primaryColor: 'black' }] },
  { tag: 'formal', blurb: 'Tailored and dressed up', pieces: [{ categoryId: 'dress', primaryColor: 'black' }, { categoryId: 'dressshoes', primaryColor: 'black' }, { categoryId: 'jewelry', primaryColor: 'mustard' }] },
  { tag: 'workwear', blurb: 'Tough fabrics, utility details', pieces: [{ categoryId: 'jacket', primaryColor: 'tan' }, { categoryId: 'jeans', primaryColor: 'navy' }, { categoryId: 'boots', primaryColor: 'brown' }] },
  { tag: 'outdoor', blurb: 'Weather-ready, trail to town', pieces: [{ categoryId: 'raincoat', primaryColor: 'forest' }, { categoryId: 'shorts', primaryColor: 'olive' }, { categoryId: 'boots', primaryColor: 'brown' }] },
  { tag: 'classic', blurb: 'Timeless pieces that last', pieces: [{ categoryId: 'coat', primaryColor: 'tan' }, { categoryId: 'sweater', primaryColor: 'cream', pattern: 'texture' }, { categoryId: 'jeans', primaryColor: 'denim' }] },
  { tag: 'trend', blurb: 'Whatever’s happening now', pieces: [{ categoryId: 'tshirt', primaryColor: 'lavender' }, { categoryId: 'skirt', primaryColor: 'sage' }, { categoryId: 'sneakers', primaryColor: 'white' }] },
];
