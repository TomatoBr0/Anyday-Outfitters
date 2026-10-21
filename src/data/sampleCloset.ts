import type { NewItemInput } from '@/engine/itemFactory';

/**
 * A gender-neutral starter wardrobe (~24 pieces) so people can try the app
 * before photographing anything. Sample items are flagged and can be removed
 * in one tap from Profile → Data.
 */
export const SAMPLE_CLOSET: NewItemInput[] = [
  { name: 'White crew tee', categoryId: 'tshirt', primaryColor: 'white', styleTags: ['minimalist', 'casual'], fit: 'regular' },
  { name: 'Black boxy tee', categoryId: 'tshirt', primaryColor: 'black', styleTags: ['streetwear', 'minimalist'], fit: 'oversized' },
  { name: 'Striped long sleeve', categoryId: 'longsleeve', primaryColor: 'navy', secondaryColors: ['cream'], pattern: 'stripe', styleTags: ['classic', 'preppy'] },
  { name: 'Light blue oxford', categoryId: 'buttondown', primaryColor: 'lightblue', styleTags: ['smartCasual', 'preppy', 'businessCasual'], fit: 'regular' },
  { name: 'Sage knit polo', categoryId: 'polo', primaryColor: 'sage', styleTags: ['smartCasual', 'vintage'] },
  { name: 'Cream cable sweater', categoryId: 'sweater', primaryColor: 'cream', pattern: 'texture', styleTags: ['classic', 'preppy'], warmth: 3 },
  { name: 'Grey hoodie', categoryId: 'hoodie', primaryColor: 'grey', styleTags: ['streetwear', 'casual', 'athletic'], fit: 'relaxed' },
  { name: 'Rust graphic tee', categoryId: 'tshirt', primaryColor: 'rust', secondaryColors: ['cream'], pattern: 'graphic', styleTags: ['vintage', 'streetwear'] },
  { name: 'Mid-wash jeans', categoryId: 'jeans', primaryColor: 'denim', styleTags: ['casual', 'classic', 'streetwear'], fit: 'regular' },
  { name: 'Black straight jeans', categoryId: 'jeans', primaryColor: 'black', styleTags: ['minimalist', 'streetwear'], fit: 'slim' },
  { name: 'Khaki chinos', categoryId: 'chinos', primaryColor: 'beige', styleTags: ['smartCasual', 'preppy', 'businessCasual'] },
  { name: 'Charcoal trousers', categoryId: 'trousers', primaryColor: 'charcoal', styleTags: ['businessCasual', 'formal', 'minimalist'], fit: 'tailored' },
  { name: 'Olive cargo shorts', categoryId: 'shorts', primaryColor: 'olive', styleTags: ['outdoor', 'casual', 'streetwear'] },
  { name: 'Grey joggers', categoryId: 'sweatpants', primaryColor: 'grey', styleTags: ['athletic', 'casual'], fit: 'relaxed' },
  { name: 'Black slip dress', categoryId: 'dress', primaryColor: 'black', styleTags: ['minimalist', 'formal', 'trend'], formality: 4 },
  { name: 'Denim jacket', categoryId: 'jacket', primaryColor: 'denim', styleTags: ['casual', 'vintage', 'streetwear'], warmth: 2 },
  { name: 'Navy blazer', categoryId: 'blazer', primaryColor: 'navy', styleTags: ['smartCasual', 'businessCasual', 'classic', 'formal'] },
  { name: 'Tan rain shell', categoryId: 'raincoat', primaryColor: 'tan', styleTags: ['outdoor', 'minimalist'] },
  { name: 'Charcoal wool coat', categoryId: 'coat', primaryColor: 'charcoal', styleTags: ['classic', 'minimalist', 'formal'] },
  { name: 'White leather sneakers', categoryId: 'sneakers', primaryColor: 'white', styleTags: ['minimalist', 'casual', 'smartCasual', 'streetwear'], formality: 2 },
  { name: 'Brown leather boots', categoryId: 'boots', primaryColor: 'brown', styleTags: ['workwear', 'classic', 'outdoor'] },
  { name: 'Black loafers', categoryId: 'loafers', primaryColor: 'black', styleTags: ['classic', 'formal', 'preppy'] },
  { name: 'Running shoes', categoryId: 'athletic', primaryColor: 'grey', secondaryColors: ['orange'], styleTags: ['athletic'] },
  { name: 'Ribbed beanie', categoryId: 'beanie', primaryColor: 'forest', styleTags: ['streetwear', 'outdoor', 'casual'] },
  { name: 'Tortoise sunglasses', categoryId: 'sunglasses', primaryColor: 'brown', styleTags: ['classic', 'minimalist'] },
  { name: 'Leather belt', categoryId: 'belt', primaryColor: 'brown', styleTags: ['classic', 'smartCasual'] },
  { name: 'Steel watch', categoryId: 'watch', primaryColor: 'grey', styleTags: ['classic', 'minimalist'], favorite: true },
];
