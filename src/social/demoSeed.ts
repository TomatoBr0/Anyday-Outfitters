/**
 * DEMO DATA. Fictional accounts and posts so the social UI can be explored
 * before the shared backend is live. Everything here is flagged `demo: true`
 * and labeled "Demo" in the UI. Counts are illustrative, not real engagement.
 */
import type { Post, Profile } from '@/types/social';

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3_600_000).toISOString();

export const DEMO_PROFILES: Profile[] = [
  { id: 'demo-jules', username: 'jules.layers', displayName: 'Jules', bio: 'Layering enthusiast. Thrift > new.', avatarColor: '#9C4A26', styleTags: ['vintage', 'streetwear'], isPrivate: false, createdAt: hoursAgo(900), demo: true },
  { id: 'demo-noor', username: 'noor.minimal', displayName: 'Noor', bio: 'Five colors, endless outfits.', avatarColor: '#3B3B3D', styleTags: ['minimalist', 'smartCasual'], isPrivate: false, createdAt: hoursAgo(800), demo: true },
  { id: 'demo-theo', username: 'theo_fits', displayName: 'Theo', bio: 'Campus fits, mostly.', avatarColor: '#4A6A91', styleTags: ['preppy', 'casual'], isPrivate: false, createdAt: hoursAgo(700), demo: true },
  { id: 'demo-ama', username: 'ama.moves', displayName: 'Ama', bio: 'Gym → class → coffee.', avatarColor: '#2F7A4B', styleTags: ['athletic', 'streetwear'], isPrivate: false, createdAt: hoursAgo(600), demo: true },
  { id: 'demo-river', username: 'river.outdoors', displayName: 'River', bio: 'Rain or shine, trail-ready.', avatarColor: '#6B6B3A', styleTags: ['outdoor', 'workwear'], isPrivate: false, createdAt: hoursAgo(500), demo: true },
  { id: 'demo-sky', username: 'sky.private', displayName: 'Sky', bio: 'Private account (demo of follow requests).', avatarColor: '#6A3E8E', styleTags: ['trend'], isPrivate: true, createdAt: hoursAgo(400), demo: true },
];

const P = (p: Omit<Post, 'commentsDisabled' | 'demo' | 'images'> & { images?: string[]; commentsDisabled?: boolean }): Post => ({
  images: [],
  commentsDisabled: false,
  demo: true,
  ...p,
});

export const DEMO_POSTS: Post[] = [
  P({ id: 'dp1', authorId: 'demo-jules', caption: 'Cream hoodie + light-wash jeans. Easiest Monday ever.', styleTags: ['streetwear', 'casual'], audience: 'public', createdAt: hoursAgo(3), likeCount: 48, commentCount: 2,
    items: [{ categoryId: 'hoodie', primaryColor: 'cream', fit: 'relaxed', styleTags: ['streetwear'] }, { categoryId: 'jeans', primaryColor: 'lightblue', fit: 'relaxed', styleTags: ['casual'] }, { categoryId: 'sneakers', primaryColor: 'white', styleTags: ['casual'] }] }),
  P({ id: 'dp2', authorId: 'demo-noor', caption: 'All black, one texture. Presentation day.', styleTags: ['minimalist', 'smartCasual'], audience: 'public', createdAt: hoursAgo(7), likeCount: 112, commentCount: 1,
    items: [{ categoryId: 'sweater', primaryColor: 'black', pattern: 'texture', styleTags: ['minimalist'], formality: 3 }, { categoryId: 'trousers', primaryColor: 'charcoal', fit: 'tailored', styleTags: ['minimalist'], formality: 4 }, { categoryId: 'loafers', primaryColor: 'black', formality: 4 }] }),
  P({ id: 'dp3', authorId: 'demo-theo', caption: 'Oxford + chinos, the uniform. Navy blazer when it’s cold.', styleTags: ['preppy', 'smartCasual'], audience: 'public', createdAt: hoursAgo(14), likeCount: 37, commentCount: 0,
    items: [{ categoryId: 'buttondown', primaryColor: 'lightblue', styleTags: ['preppy'], formality: 3 }, { categoryId: 'chinos', primaryColor: 'beige', styleTags: ['preppy'] }, { categoryId: 'blazer', primaryColor: 'navy', styleTags: ['classic'] }, { categoryId: 'loafers', primaryColor: 'brown' }] }),
  P({ id: 'dp4', authorId: 'demo-ama', caption: 'Straight from the gym. Grey on grey.', styleTags: ['athletic'], audience: 'public', createdAt: hoursAgo(20), likeCount: 22, commentCount: 0,
    items: [{ categoryId: 'hoodie', primaryColor: 'grey', styleTags: ['athletic'] }, { categoryId: 'sweatpants', primaryColor: 'grey', styleTags: ['athletic'] }, { categoryId: 'athletic', primaryColor: 'white', styleTags: ['athletic'] }] }),
  P({ id: 'dp5', authorId: 'demo-river', caption: 'Rain shell, olive cargos, boots. Puddles: handled.', styleTags: ['outdoor', 'workwear'], audience: 'public', createdAt: hoursAgo(30), likeCount: 64, commentCount: 0,
    items: [{ categoryId: 'raincoat', primaryColor: 'forest', styleTags: ['outdoor'] }, { categoryId: 'tshirt', primaryColor: 'cream' }, { categoryId: 'chinos', primaryColor: 'olive', styleTags: ['workwear'] }, { categoryId: 'boots', primaryColor: 'brown', styleTags: ['workwear'] }] }),
  P({ id: 'dp6', authorId: 'demo-jules', caption: 'Thrifted rust tee with black denim.', styleTags: ['vintage', 'streetwear'], audience: 'public', createdAt: hoursAgo(44), likeCount: 29, commentCount: 0,
    items: [{ categoryId: 'tshirt', primaryColor: 'rust', pattern: 'graphic', styleTags: ['vintage'] }, { categoryId: 'jeans', primaryColor: 'black', styleTags: ['streetwear'] }, { categoryId: 'boots', primaryColor: 'black' }] }),
  P({ id: 'dp7', authorId: 'demo-noor', caption: 'Slip dress, oversized blazer. Gallery night.', styleTags: ['minimalist', 'formal'], audience: 'public', createdAt: hoursAgo(60), likeCount: 91, commentCount: 0,
    items: [{ categoryId: 'dress', primaryColor: 'black', styleTags: ['minimalist'], formality: 4 }, { categoryId: 'blazer', primaryColor: 'charcoal', fit: 'oversized' }, { categoryId: 'loafers', primaryColor: 'black' }] }),
  P({ id: 'dp8', authorId: 'demo-theo', caption: 'Striped long sleeve + denim jacket. Classic for a reason.', styleTags: ['classic', 'casual'], audience: 'public', createdAt: hoursAgo(80), likeCount: 18, commentCount: 0,
    items: [{ categoryId: 'longsleeve', primaryColor: 'navy', pattern: 'stripe', secondaryColors: ['cream'], styleTags: ['classic'] }, { categoryId: 'jacket', primaryColor: 'denim', styleTags: ['casual'] }, { categoryId: 'chinos', primaryColor: 'beige' }, { categoryId: 'sneakers', primaryColor: 'white' }] }),
  P({ id: 'dp9', authorId: 'demo-sky', caption: 'Lavender everything (only followers can see this).', styleTags: ['trend'], audience: 'followers', createdAt: hoursAgo(10), likeCount: 12, commentCount: 0,
    items: [{ categoryId: 'tshirt', primaryColor: 'lavender', styleTags: ['trend'] }, { categoryId: 'skirt', primaryColor: 'sage' }, { categoryId: 'sneakers', primaryColor: 'white' }] }),
];

export const DEMO_COMMENTS = [
  { id: 'dc1', postId: 'dp1', authorId: 'demo-noor', body: 'The cream + light wash combo is so good.', createdAt: hoursAgo(2) },
  { id: 'dc2', postId: 'dp1', authorId: 'demo-theo', body: 'Recreated this with my grey hoodie, works too.', createdAt: hoursAgo(1) },
  { id: 'dc3', postId: 'dp2', authorId: 'demo-jules', body: 'Texture carrying the whole fit.', createdAt: hoursAgo(5) },
];

/** Demo follow graph between demo accounts (so their follower counts aren't zero). */
export const DEMO_FOLLOWS: [string, string][] = [
  ['demo-noor', 'demo-jules'], ['demo-theo', 'demo-jules'], ['demo-jules', 'demo-noor'], ['demo-ama', 'demo-noor'], ['demo-river', 'demo-theo'], ['demo-theo', 'demo-ama'],
];
