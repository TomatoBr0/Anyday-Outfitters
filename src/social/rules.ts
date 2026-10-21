/**
 * Visibility and ranking rules, pure functions.
 *
 * `canViewPost` mirrors the Row Level Security policy in
 * supabase/migrations/0001_social.sql. The local demo service uses it; the real
 * backend enforces the same rule in Postgres, never in the UI alone.
 */
import { tagAffinity } from '@/engine/scoring';
import type { ClothingItem, ID, StyleTag } from '@/types/models';
import type { Post, Profile } from '@/types/social';

export interface Graph {
  /** followerId → set of followed ids (accepted only) */
  following: Map<ID, Set<ID>>;
  /** blockerId → set of blocked ids */
  blocks: Map<ID, Set<ID>>;
}

export function isBlockedEitherWay(g: Graph, a: ID, b: ID) {
  return !!g.blocks.get(a)?.has(b) || !!g.blocks.get(b)?.has(a);
}

export function canViewProfileContent(viewer: ID, owner: Profile, g: Graph) {
  if (viewer === owner.id) return true;
  if (isBlockedEitherWay(g, viewer, owner.id)) return false;
  return !owner.isPrivate || !!g.following.get(viewer)?.has(owner.id);
}

export function canViewPost(viewer: ID, post: Post, author: Profile, g: Graph): boolean {
  if (viewer === post.authorId) return true;
  if (isBlockedEitherWay(g, viewer, post.authorId)) return false;
  if (post.audience === 'private') return false;
  const follows = !!g.following.get(viewer)?.has(post.authorId);
  if (post.audience === 'followers' || author.isPrivate) return follows;
  return true;
}

// ---- Ranking (transparent, not engagement-maximizing: likes are NOT an input)

const HALF_LIFE_H = 72;
export function recency(createdAt: string, now: number) {
  const hours = Math.max(0, (now - Date.parse(createdAt)) / 3_600_000);
  return Math.pow(0.5, hours / HALF_LIFE_H);
}

export function styleMatch(post: Post, prefs: StyleTag[]): number {
  if (!prefs.length || !post.styleTags.length) return 0.5;
  let s = 0;
  for (const t of post.styleTags) s += Math.max(...prefs.map((p) => tagAffinity(t, p)));
  return s / post.styleTags.length;
}

/** How much of the post you could recreate: share of tagged slots your closet covers. */
export function closetOverlap(post: Post, closetCategories: Set<string>): number {
  if (!post.items.length) return 0.5;
  return post.items.filter((i) => closetCategories.has(i.categoryId)).length / post.items.length;
}

export interface DiscoverReason {
  score: number;
  why: string;
}

export function discoverScore(post: Post, prefs: StyleTag[], closet: ClothingItem[], now: number): DiscoverReason {
  const cats = new Set(closet.map((c) => c.categoryId));
  const st = styleMatch(post, prefs);
  const ov = closetOverlap(post, cats);
  const rc = recency(post.createdAt, now);
  const score = st * 0.45 + ov * 0.25 + rc * 0.3;
  const why = st >= 0.85 ? 'Matches your style' : ov >= 0.8 ? 'You own similar pieces' : rc >= 0.8 ? 'New' : 'Popular styles';
  return { score, why };
}

export function rankFollowing(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function rankDiscover(posts: Post[], prefs: StyleTag[], closet: ClothingItem[], now = Date.now()): Post[] {
  return posts
    .map((p) => ({ p, s: discoverScore(p, prefs, closet, now).score }))
    .sort((a, b) => b.s - a.s || b.p.createdAt.localeCompare(a.p.createdAt))
    .map((x) => x.p);
}

// ---- Validation (same limits as the database CHECK constraints)

export const LIMITS = { caption: 2200, comment: 500, bio: 160, displayName: 40, images: 4, tags: 10 };
export const USERNAME_RE = /^[a-z0-9_.]{3,24}$/;

export function validateUsername(u: string): string | undefined {
  if (!USERNAME_RE.test(u)) return '3–24 characters: lowercase letters, numbers, _ or .';
  if (/^[._]|[._]$/.test(u) || u.includes('..')) return 'Can’t start or end with . or _';
  return undefined;
}

/** Simple client-side throttle; the backend enforces its own limits too. */
export class RateLimiter {
  private hits = new Map<string, number[]>();
  constructor(private max: number, private windowMs: number) {}
  allow(key: string, now = Date.now()): boolean {
    const arr = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (arr.length >= this.max) {
      this.hits.set(key, arr);
      return false;
    }
    arr.push(now);
    this.hits.set(key, arr);
    return true;
  }
}
