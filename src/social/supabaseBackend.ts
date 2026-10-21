/**
 * Shared-backend adapter (Supabase). NOT yet wired into the UI: the app runs
 * the local demo backend (src/state/social.ts) until a Supabase project is
 * created (needs the owner's approval) and these env vars are set:
 *
 *   EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
 *
 * The anon key is public by design. All authorization is enforced by RLS in
 * supabase/migrations/0001_social.sql (tested in supabase/tests). Never put the
 * service-role key in the app.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Audience, Post, PostItemTag, ReportReason, ReportTarget } from '@/types/social';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const backendConfigured = !!(SUPABASE_URL && ANON);

let client: SupabaseClient | undefined;
export function supabase(): SupabaseClient {
  if (!backendConfigured) throw new Error('Shared backend not configured');
  client ??= createClient(SUPABASE_URL!, ANON!, { auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
  return client;
}

// ---- auth
export const signInWithEmail = (email: string) => supabase().auth.signInWithOtp({ email });
export const verifyEmailCode = (email: string, token: string) => supabase().auth.verifyOtp({ email, token, type: 'email' });
export const signOut = () => supabase().auth.signOut();
export const deleteMyAccount = () => supabase().rpc('delete_my_account');

// ---- feed (RLS decides visibility; we only order and paginate)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPost(r: any): Post {
  return {
    id: r.id,
    authorId: r.author_id,
    images: (r.post_images ?? []).sort((a: { position: number }, b: { position: number }) => a.position - b.position).map((i: { path: string }) => i.path),
    caption: r.caption,
    styleTags: r.style_tags,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (r.post_item_tags ?? []).map((t: any) => ({ categoryId: t.category_id, primaryColor: t.primary_color, secondaryColors: t.secondary_colors, pattern: t.pattern, fit: t.fit, styleTags: t.style_tags, formality: t.formality, warmth: t.warmth, brand: t.brand, productName: t.product_name })),
    audience: r.audience,
    commentsDisabled: r.comments_disabled,
    createdAt: r.created_at,
    likeCount: r.like_count,
    commentCount: r.comment_count,
  };
}

export async function fetchFeed(kind: 'following' | 'discover', before?: string, limit = 12): Promise<Post[]> {
  const sb = supabase();
  let q = sb.from('posts').select('*, post_images(*), post_item_tags(*)').is('removed_at', null).order('created_at', { ascending: false }).limit(limit);
  if (before) q = q.lt('created_at', before);
  if (kind === 'discover') q = q.eq('audience', 'public');
  else {
    const me = (await sb.auth.getUser()).data.user?.id;
    const { data: f } = await sb.from('follows').select('followed_id').eq('follower_id', me);
    q = q.in('author_id', [me, ...(f ?? []).map((x) => x.followed_id)]);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(toPost);
}

/** Upload already-re-encoded JPEGs (EXIF stripped on device) then create the post. */
export async function publishPost(p: { localImages: string[]; caption: string; styleTags: string[]; items: PostItemTag[]; audience: Audience }) {
  const sb = supabase();
  const me = (await sb.auth.getUser()).data.user!.id;
  const { data: post, error } = await sb.from('posts').insert({ author_id: me, caption: p.caption, style_tags: p.styleTags, audience: p.audience }).select().single();
  if (error) throw error;
  for (const [i, uri] of p.localImages.entries()) {
    const path = `${me}/${post.id}/${i}.jpg`;
    const body = await (await fetch(uri)).arrayBuffer();
    const up = await sb.storage.from('post-media').upload(path, body, { contentType: 'image/jpeg' });
    if (up.error) throw up.error;
    await sb.from('post_images').insert({ post_id: post.id, position: i, path });
  }
  if (p.items.length)
    await sb.from('post_item_tags').insert(p.items.map((t) => ({ post_id: post.id, category_id: t.categoryId, primary_color: t.primaryColor, secondary_colors: t.secondaryColors ?? [], pattern: t.pattern, fit: t.fit, style_tags: t.styleTags ?? [], formality: t.formality, warmth: t.warmth, brand: t.brand, product_name: t.productName })));
  return post.id as string;
}

export const signedMediaUrl = async (path: string) => (await supabase().storage.from('post-media').createSignedUrl(path, 3600)).data?.signedUrl;
export const like = async (postId: string) => supabase().from('likes').insert({ user_id: (await supabase().auth.getUser()).data.user!.id, post_id: postId });
export const unlike = async (postId: string) => supabase().from('likes').delete().eq('post_id', postId).eq('user_id', (await supabase().auth.getUser()).data.user!.id);
export const follow = (id: string) => supabase().rpc('request_follow', { target: id });
export const respondToRequest = (requester: string, accept: boolean) => supabase().rpc('respond_follow_request', { requester, accept });
export const block = async (id: string) => supabase().from('blocks').insert({ blocker_id: (await supabase().auth.getUser()).data.user!.id, blocked_id: id });
export const comment = async (postId: string, body: string, parentId?: string) =>
  supabase().from('comments').insert({ post_id: postId, author_id: (await supabase().auth.getUser()).data.user!.id, body, parent_id: parentId });
export const report = async (target: ReportTarget, targetId: string, reason: ReportReason, note?: string) =>
  supabase().from('reports').insert({ reporter_id: (await supabase().auth.getUser()).data.user!.id, target, target_id: targetId, reason, note });
