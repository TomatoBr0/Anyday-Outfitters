import AsyncStorage from '@react-native-async-storage/async-storage';

import { canViewPost, discoverScore, rankDiscover, validateUsername, RateLimiter, type Graph } from '@/social/rules';
import { ME, feed, followState, search, useSocial, visiblePosts } from '@/state/social';
import type { Post, Profile } from '@/types/social';

jest.mock('@react-native-async-storage/async-storage', () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));
let mockN = 0;
jest.mock('@/utils/id', () => ({ newId: () => `sid-${++mockN}` }));

const prof = (id: string, isPrivate = false): Profile => ({ id, username: id, displayName: id, styleTags: [], isPrivate, createdAt: '' });
const post = (over: Partial<Post>): Post => ({ id: 'p', authorId: 'a', images: [], caption: '', styleTags: [], items: [], audience: 'public', commentsDisabled: false, createdAt: new Date().toISOString(), likeCount: 0, commentCount: 0, ...over });
const graph = (follows: [string, string][] = [], blocks: [string, string][] = []): Graph => {
  const following = new Map<string, Set<string>>();
  for (const [f, t] of follows) (following.get(f) ?? following.set(f, new Set()).get(f)!).add(t);
  const b = new Map<string, Set<string>>();
  for (const [x, y] of blocks) (b.get(x) ?? b.set(x, new Set()).get(x)!).add(y);
  return { following, blocks: b };
};

describe('visibility rules (mirror of server RLS)', () => {
  it('public posts are visible, private drafts never are', () => {
    expect(canViewPost('v', post({}), prof('a'), graph())).toBe(true);
    expect(canViewPost('v', post({ audience: 'private' }), prof('a'), graph())).toBe(false);
    expect(canViewPost('a', post({ audience: 'private' }), prof('a'), graph())).toBe(true);
  });
  it('followers-only and private accounts require an accepted follow', () => {
    expect(canViewPost('v', post({ audience: 'followers' }), prof('a'), graph())).toBe(false);
    expect(canViewPost('v', post({ audience: 'followers' }), prof('a'), graph([['v', 'a']]))).toBe(true);
    expect(canViewPost('v', post({}), prof('a', true), graph())).toBe(false);
  });
  it('blocking hides content in both directions', () => {
    expect(canViewPost('v', post({}), prof('a'), graph([], [['a', 'v']]))).toBe(false);
    expect(canViewPost('v', post({}), prof('a'), graph([['v', 'a']], [['v', 'a']]))).toBe(false);
  });
});

describe('ranking', () => {
  it('discover favors style match, and ignores like counts', () => {
    const now = Date.now();
    const a = post({ id: 'a', styleTags: ['streetwear'], likeCount: 0 });
    const b = post({ id: 'b', styleTags: ['formal'], likeCount: 10_000 });
    expect(rankDiscover([b, a], ['streetwear'], [], now)[0].id).toBe('a');
    expect(discoverScore(a, ['streetwear'], [], now).why).toBe('Matches your style');
  });
});

describe('validation and limits', () => {
  it('usernames', () => {
    expect(validateUsername('maya_k')).toBeUndefined();
    expect(validateUsername('Ma')).toBeDefined();
    expect(validateUsername('_maya')).toBeDefined();
  });
  it('rate limiter', () => {
    const r = new RateLimiter(2, 1000);
    expect([r.allow('x', 0), r.allow('x', 1), r.allow('x', 2), r.allow('x', 1500)]).toEqual([true, true, false, true]);
  });
});

describe('local social service', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await useSocial.getState().resetSocial();
    useSocial.getState().join({ username: 'maya', displayName: 'Maya', styleTags: ['minimalist'], isPrivate: false });
  });

  it('creates, likes, comments and deletes a post', () => {
    const s = useSocial.getState();
    const p = s.createPost({ images: [], caption: ' hi ', styleTags: ['casual'], items: [], audience: 'public' });
    expect(p.caption).toBe('hi');
    expect(useSocial.getState().toggleLike(p.id)).toBe(true);
    expect(useSocial.getState().posts.find((x) => x.id === p.id)!.likeCount).toBe(1);
    useSocial.getState().toggleLike(p.id);
    expect(useSocial.getState().posts.find((x) => x.id === p.id)!.likeCount).toBe(0);
    const c = useSocial.getState().addComment(p.id, 'nice')!;
    useSocial.getState().addComment(p.id, 'reply', c.id);
    expect(useSocial.getState().posts.find((x) => x.id === p.id)!.commentCount).toBe(2);
    useSocial.getState().deleteComment(c.id); // removes its reply too
    expect(useSocial.getState().posts.find((x) => x.id === p.id)!.commentCount).toBe(0);
    useSocial.getState().deletePost(p.id);
    expect(useSocial.getState().posts.some((x) => x.id === p.id)).toBe(false);
  });

  it('cannot comment when comments are disabled; cannot edit others’ posts', () => {
    const p = useSocial.getState().createPost({ images: [], caption: 'x', styleTags: [], items: [], audience: 'public' });
    useSocial.getState().updatePost(p.id, { commentsDisabled: true });
    expect(useSocial.getState().addComment(p.id, 'hey')).toBeUndefined();
    useSocial.getState().updatePost('dp1', { caption: 'hacked' });
    expect(useSocial.getState().posts.find((x) => x.id === 'dp1')!.caption).not.toBe('hacked');
    useSocial.getState().deletePost('dp1');
    expect(useSocial.getState().posts.some((x) => x.id === 'dp1')).toBe(true);
  });

  it('private accounts need approval; followers-only posts unlock after', () => {
    expect(useSocial.getState().follow('demo-sky')).toBe('requested');
    expect(followState(useSocial.getState(), 'demo-sky')).toBe('requested');
    expect(visiblePosts(useSocial.getState()).some((p) => p.id === 'dp9')).toBe(false);
  });

  it('following feed shows followed accounts; blocking removes them everywhere', () => {
    useSocial.getState().follow('demo-jules');
    const f = feed(useSocial.getState(), 'following', { styles: [], closet: [] }, 0);
    expect(f.posts.every((p) => p.authorId === 'demo-jules' || p.authorId === ME)).toBe(true);
    expect(f.posts.length).toBeGreaterThan(0);
    useSocial.getState().block('demo-jules');
    expect(followState(useSocial.getState(), 'demo-jules')).toBe('none');
    expect(visiblePosts(useSocial.getState()).some((p) => p.authorId === 'demo-jules')).toBe(false);
    expect(search(useSocial.getState(), 'jules').people).toHaveLength(0);
  });

  it('paginates discover', () => {
    const p0 = feed(useSocial.getState(), 'discover', { styles: ['minimalist'], closet: [] }, 0);
    expect(p0.posts.length).toBe(6);
    expect(p0.more).toBe(true);
    expect(p0.posts[0].authorId).toBe('demo-noor');
  });

  it('saves into collections and unsaving removes from them', () => {
    const c = useSocial.getState().createCollection('School');
    useSocial.getState().toggleInCollection(c.id, 'dp1');
    expect(useSocial.getState().saved).toContain('dp1');
    useSocial.getState().toggleSave('dp1');
    expect(useSocial.getState().collections[0].postIds).toEqual([]);
  });

  it('search finds people and tags', () => {
    expect(search(useSocial.getState(), '@noor').people[0].id).toBe('demo-noor');
    expect(search(useSocial.getState(), '#outdoor').posts.length).toBeGreaterThan(0);
  });

  it('reports are recorded', () => {
    expect(useSocial.getState().report('post', 'dp1', 'spam')).toBe(true);
    expect(useSocial.getState().reports[0].status).toBe('open');
  });

  it('hiding demo content removes demo posts', () => {
    useSocial.getState().setShowDemo(false);
    expect(visiblePosts(useSocial.getState()).every((p) => !p.demo)).toBe(true);
  });
});
