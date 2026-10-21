/**
 * Social state — LOCAL DEMO BACKEND.
 *
 * Implements the same operations the Supabase backend exposes
 * (supabase/migrations/0001_social.sql), persisted to AsyncStorage on this
 * device. All visibility checks go through src/social/rules.ts, which mirrors
 * the server's RLS policies. Nothing here is shared between devices; the UI
 * labels this "Demo mode" until a backend is configured.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { DEMO_COMMENTS, DEMO_FOLLOWS, DEMO_POSTS, DEMO_PROFILES } from '@/social/demoSeed';
import { LIMITS, RateLimiter, canViewPost, canViewProfileContent, rankDiscover, rankFollowing, type Graph } from '@/social/rules';
import type { ClothingItem, ID, StyleTag } from '@/types/models';
import type { AppNotification, Audience, Collection, Comment, NotificationPrefs, Post, PostItemTag, Profile, Report, ReportReason, ReportTarget } from '@/types/social';
import { newId } from '@/utils/id';

const KEY = 'getup:v1:social';
export const ME = 'me';

interface Data {
  profiles: Profile[];
  posts: Post[];
  comments: Comment[];
  follows: [ID, ID][]; // [follower, followed], accepted
  requests: [ID, ID][]; // pending follow requests
  blocks: [ID, ID][]; // [blocker, blocked]
  likes: [ID, ID][]; // [userId, postId]
  saved: ID[]; // my saved post ids
  collections: Collection[];
  notifications: AppNotification[];
  reports: Report[];
  notificationPrefs: NotificationPrefs;
  /** User has created a social profile (opt-in; wardrobe works without it). */
  joined: boolean;
  /** Show seeded demo accounts. */
  showDemo: boolean;
}

interface State extends Data {
  hydrated: boolean;
  hydrate(): Promise<void>;
  // profile
  join(p: { username: string; displayName: string; styleTags: StyleTag[]; isPrivate: boolean }): void;
  updateProfile(patch: Partial<Profile>): void;
  // posts
  createPost(p: { images: string[]; caption: string; styleTags: StyleTag[]; items: PostItemTag[]; audience: Audience }): Post;
  updatePost(id: ID, patch: Partial<Pick<Post, 'caption' | 'audience' | 'commentsDisabled' | 'styleTags'>>): void;
  deletePost(id: ID): void;
  toggleLike(postId: ID): boolean;
  addComment(postId: ID, body: string, parentId?: ID): Comment | undefined;
  deleteComment(id: ID): void;
  // graph
  follow(id: ID): 'following' | 'requested';
  unfollow(id: ID): void;
  respondToRequest(followerId: ID, accept: boolean): void;
  removeFollower(id: ID): void;
  block(id: ID): void;
  unblock(id: ID): void;
  // saves
  toggleSave(postId: ID): boolean;
  createCollection(name: string): Collection;
  toggleInCollection(collectionId: ID, postId: ID): void;
  deleteCollection(id: ID): void;
  // safety
  report(target: ReportTarget, targetId: ID, reason: ReportReason, note?: string): boolean;
  resolveReport(id: ID, status: Report['status']): void;
  markNotificationsRead(): void;
  setNotificationPrefs(p: Partial<NotificationPrefs>): void;
  setShowDemo(v: boolean): void;
  resetSocial(): Promise<void>;
}

const seed = (): Data => ({
  profiles: [...DEMO_PROFILES],
  posts: [...DEMO_POSTS],
  comments: [...DEMO_COMMENTS],
  follows: [...DEMO_FOLLOWS],
  requests: [],
  blocks: [],
  likes: [],
  saved: [],
  collections: [],
  notifications: [],
  reports: [],
  notificationPrefs: { follows: true, likes: true, comments: true },
  joined: false,
  showDemo: true,
});

const actionLimiter = new RateLimiter(30, 60_000); // likes/follows/comments per minute
const postLimiter = new RateLimiter(10, 3_600_000);
const reportLimiter = new RateLimiter(20, 3_600_000);
const now = () => new Date().toISOString();

export const useSocial = create<State>()((set, get) => ({
  ...seed(),
  hydrated: false,

  async hydrate() {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) set({ ...seed(), ...JSON.parse(raw) });
    } catch {
      // keep seed
    }
    set({ hydrated: true });
  },

  join({ username, displayName, styleTags, isPrivate }) {
    const me: Profile = { id: ME, username, displayName, styleTags, isPrivate, createdAt: now(), avatarColor: '#4F6249' };
    set({ profiles: [me, ...get().profiles.filter((p) => p.id !== ME)], joined: true });
  },

  updateProfile(patch) {
    const wasPrivate = get().profiles.find((p) => p.id === ME)?.isPrivate;
    set({ profiles: get().profiles.map((p) => (p.id === ME ? { ...p, ...patch, id: ME } : p)) });
    // Going public auto-approves pending requests (same as the backend trigger).
    if (wasPrivate && patch.isPrivate === false) {
      for (const [f] of get().requests.filter(([, t]) => t === ME)) get().respondToRequest(f, true);
    }
  },

  createPost(p) {
    if (!postLimiter.allow(ME)) throw new Error('You’re posting a lot — try again in a bit.');
    const post: Post = {
      id: newId(),
      authorId: ME,
      images: p.images.slice(0, LIMITS.images),
      caption: p.caption.trim().slice(0, LIMITS.caption),
      styleTags: p.styleTags.slice(0, LIMITS.tags),
      items: p.items.slice(0, 12),
      audience: p.audience,
      commentsDisabled: false,
      createdAt: now(),
      likeCount: 0,
      commentCount: 0,
    };
    set({ posts: [post, ...get().posts] });
    return post;
  },

  updatePost(id, patch) {
    set({ posts: get().posts.map((p) => (p.id === id && p.authorId === ME ? { ...p, ...patch } : p)) });
  },

  deletePost(id) {
    const post = get().posts.find((p) => p.id === id);
    if (!post || post.authorId !== ME) return;
    set({
      posts: get().posts.filter((p) => p.id !== id),
      comments: get().comments.filter((c) => c.postId !== id),
      likes: get().likes.filter(([, pid]) => pid !== id),
      saved: get().saved.filter((s) => s !== id),
      collections: get().collections.map((c) => ({ ...c, postIds: c.postIds.filter((x) => x !== id) })),
    });
  },

  toggleLike(postId) {
    if (!actionLimiter.allow('like')) return isLiked(get(), postId);
    const liked = isLiked(get(), postId);
    set({
      likes: liked ? get().likes.filter(([u, p]) => !(u === ME && p === postId)) : [...get().likes, [ME, postId]],
      posts: get().posts.map((p) => (p.id === postId ? { ...p, likeCount: Math.max(0, p.likeCount + (liked ? -1 : 1)) } : p)),
    });
    return !liked;
  },

  addComment(postId, body, parentId) {
    const post = get().posts.find((p) => p.id === postId);
    const text = body.trim().slice(0, LIMITS.comment);
    if (!post || !text || post.commentsDisabled || !actionLimiter.allow('comment')) return undefined;
    const c: Comment = { id: newId(), postId, authorId: ME, parentId, body: text, createdAt: now() };
    set({
      comments: [...get().comments, c],
      posts: get().posts.map((p) => (p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p)),
    });
    return c;
  },

  deleteComment(id) {
    const c = get().comments.find((x) => x.id === id);
    if (!c) return;
    const post = get().posts.find((p) => p.id === c.postId);
    // Authors can delete their comments; post owners can delete comments on their posts.
    if (c.authorId !== ME && post?.authorId !== ME) return;
    const removed = get().comments.filter((x) => x.id === id || x.parentId === id).length;
    set({
      comments: get().comments.filter((x) => x.id !== id && x.parentId !== id),
      posts: get().posts.map((p) => (p.id === c.postId ? { ...p, commentCount: Math.max(0, p.commentCount - removed) } : p)),
    });
  },

  follow(id) {
    if (id === ME || !actionLimiter.allow('follow')) return 'following';
    const target = get().profiles.find((p) => p.id === id);
    if (!target || isBlocked(get(), ME, id)) return 'following';
    if (target.isPrivate) {
      if (!get().requests.some(([f, t]) => f === ME && t === id)) set({ requests: [...get().requests, [ME, id]] });
      return 'requested';
    }
    if (!get().follows.some(([f, t]) => f === ME && t === id)) set({ follows: [...get().follows, [ME, id]] });
    return 'following';
  },

  unfollow(id) {
    set({ follows: get().follows.filter(([f, t]) => !(f === ME && t === id)), requests: get().requests.filter(([f, t]) => !(f === ME && t === id)) });
  },

  respondToRequest(followerId, accept) {
    set({ requests: get().requests.filter(([f, t]) => !(f === followerId && t === ME)) });
    if (accept) {
      set({
        follows: [...get().follows, [followerId, ME]],
        notifications: [{ id: newId(), kind: 'follow', actorId: followerId, createdAt: now(), read: false }, ...get().notifications],
      });
    }
  },

  removeFollower(id) {
    set({ follows: get().follows.filter(([f, t]) => !(f === id && t === ME)) });
  },

  block(id) {
    if (id === ME) return;
    set({
      blocks: [...get().blocks.filter(([a, b]) => !(a === ME && b === id)), [ME, id]],
      // Blocking severs the relationship both ways.
      follows: get().follows.filter(([f, t]) => !((f === ME && t === id) || (f === id && t === ME))),
      requests: get().requests.filter(([f, t]) => !((f === ME && t === id) || (f === id && t === ME))),
    });
  },

  unblock(id) {
    set({ blocks: get().blocks.filter(([a, b]) => !(a === ME && b === id)) });
  },

  toggleSave(postId) {
    const saved = get().saved.includes(postId);
    set({
      saved: saved ? get().saved.filter((s) => s !== postId) : [postId, ...get().saved],
      collections: saved ? get().collections.map((c) => ({ ...c, postIds: c.postIds.filter((x) => x !== postId) })) : get().collections,
    });
    return !saved;
  },

  createCollection(name) {
    const c: Collection = { id: newId(), name: name.trim().slice(0, 40) || 'Untitled', postIds: [], createdAt: now() };
    set({ collections: [...get().collections, c] });
    return c;
  },

  toggleInCollection(collectionId, postId) {
    if (!get().saved.includes(postId)) set({ saved: [postId, ...get().saved] });
    set({
      collections: get().collections.map((c) =>
        c.id === collectionId ? { ...c, postIds: c.postIds.includes(postId) ? c.postIds.filter((x) => x !== postId) : [...c.postIds, postId] } : c,
      ),
    });
  },

  deleteCollection(id) {
    set({ collections: get().collections.filter((c) => c.id !== id) });
  },

  report(target, targetId, reason, note) {
    if (!reportLimiter.allow('report')) return false;
    set({ reports: [{ id: newId(), target, targetId, reason, note: note?.slice(0, 500), reporterId: ME, createdAt: now(), status: 'open' }, ...get().reports] });
    return true;
  },

  resolveReport(id, status) {
    set({ reports: get().reports.map((r) => (r.id === id ? { ...r, status } : r)) });
  },

  markNotificationsRead() {
    set({ notifications: get().notifications.map((n) => ({ ...n, read: true })) });
  },

  setNotificationPrefs(p) {
    set({ notificationPrefs: { ...get().notificationPrefs, ...p } });
  },

  setShowDemo(v) {
    set({ showDemo: v });
  },

  async resetSocial() {
    await AsyncStorage.removeItem(KEY);
    set({ ...seed(), hydrated: true });
  },
}));

// ---- persistence
let timer: ReturnType<typeof setTimeout> | undefined;
useSocial.subscribe((s, prev) => {
  if (!s.hydrated || !prev.hydrated) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    const { hydrated: _h, ...rest } = useSocial.getState();
    const data = Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function'));
    AsyncStorage.setItem(KEY, JSON.stringify(data)).catch(() => {});
  }, 250);
});

// ---- selectors (pure; usable in tests)
export function isLiked(s: Pick<Data, 'likes'>, postId: ID) {
  return s.likes.some(([u, p]) => u === ME && p === postId);
}
export function isBlocked(s: Pick<Data, 'blocks'>, a: ID, b: ID) {
  return s.blocks.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}
export function graphOf(s: Pick<Data, 'follows' | 'blocks'>): Graph {
  const following = new Map<ID, Set<ID>>();
  for (const [f, t] of s.follows) (following.get(f) ?? following.set(f, new Set()).get(f)!).add(t);
  const blocks = new Map<ID, Set<ID>>();
  for (const [a, b] of s.blocks) (blocks.get(a) ?? blocks.set(a, new Set()).get(a)!).add(b);
  return { following, blocks };
}
export function followState(s: Pick<Data, 'follows' | 'requests'>, id: ID): 'following' | 'requested' | 'none' {
  if (s.follows.some(([f, t]) => f === ME && t === id)) return 'following';
  if (s.requests.some(([f, t]) => f === ME && t === id)) return 'requested';
  return 'none';
}
export function profileById(s: Pick<Data, 'profiles'>, id: ID) {
  return s.profiles.find((p) => p.id === id);
}

export function visiblePosts(s: Data, viewer = ME): Post[] {
  const g = graphOf(s);
  const byId = new Map(s.profiles.map((p) => [p.id, p]));
  return s.posts.filter((p) => {
    const author = byId.get(p.authorId);
    if (!author) return false;
    if (!s.showDemo && p.demo) return false;
    return canViewPost(viewer, p, author, g);
  });
}

export const PAGE = 6;
export function feed(s: Data, kind: 'following' | 'discover', ctx: { styles: StyleTag[]; closet: ClothingItem[] }, page: number): { posts: Post[]; more: boolean } {
  const vis = visiblePosts(s);
  const followed = new Set(s.follows.filter(([f]) => f === ME).map(([, t]) => t));
  const list =
    kind === 'following'
      ? rankFollowing(vis.filter((p) => followed.has(p.authorId) || p.authorId === ME))
      : rankDiscover(vis.filter((p) => p.audience === 'public' && p.authorId !== ME), ctx.styles, ctx.closet);
  const end = (page + 1) * PAGE;
  return { posts: list.slice(0, end), more: list.length > end };
}

export function canSeeProfileContent(s: Data, owner: Profile) {
  return canViewProfileContent(ME, owner, graphOf(s));
}

/** Simple search over usernames, names, style tags, categories, captions (visible content only). */
export function search(s: Data, q: string) {
  const term = q.trim().toLowerCase().replace(/^[@#]/, '');
  if (term.length < 2) return { people: [] as Profile[], posts: [] as Post[] };
  const people = s.profiles
    .filter((p) => p.id !== ME && !isBlocked(s, ME, p.id) && (s.showDemo || !p.demo))
    .map((p) => ({ p, score: p.username.startsWith(term) ? 3 : p.displayName.toLowerCase().startsWith(term) ? 2 : `${p.username} ${p.displayName}`.toLowerCase().includes(term) ? 1 : 0 }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
  const posts = visiblePosts(s)
    .filter((p) => p.audience === 'public' || p.authorId === ME)
    .filter((p) => `${p.caption} ${p.styleTags.join(' ')} ${p.items.map((i) => `${i.categoryId} ${i.primaryColor} ${i.brand ?? ''}`).join(' ')}`.toLowerCase().includes(term));
  return { people, posts };
}
