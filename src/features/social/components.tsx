import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Share, View, useWindowDimensions } from 'react-native';

import { GarmentGlyph } from '@/components/GarmentGlyph';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { toast } from '@/components/Toast';
import { Badge, Button } from '@/components/ui';
import { STYLE_LABELS } from '@/engine/scoring';
import { resolveImage } from '@/services/images';
import { ME, followState, isLiked, profileById, useSocial } from '@/state/social';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import type { Post, PostItemTag, Profile, ReportReason, ReportTarget } from '@/types/social';
import { haptic } from '@/utils/haptics';

export function timeAgo(iso: string) {
  const m = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  return d < 7 ? `${d}d` : new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function Avatar({ profile, size = 36 }: { profile?: Profile; size?: number }) {
  const uri = resolveImage(profile?.avatarUri);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: profile?.avatarColor ?? '#8E867A', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      ) : (
        <Text style={{ color: '#FBF8F3', fontSize: size * 0.42, lineHeight: Math.round(size * 0.42 * 1.25), fontWeight: '600', textAlign: 'center', includeFontPadding: false }} maxFontSizeMultiplier={1}>
          {(profile?.displayName ?? '?').slice(0, 1).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

/** Flat-lay rendering of a post's tagged pieces (used when a post has no photo). */
export function TagBoard({ items, compact }: { items: PostItemTag[]; compact?: boolean }) {
  const { colors } = useTheme();
  const shown = items.slice(0, 4);
  const cols = shown.length <= 1 ? 1 : 2;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.surfaceAlt, aspectRatio: 1, padding: compact ? 4 : 10, gap: compact ? 4 : 8 }}>
      {shown.map((t, i) => (
        <View
          key={i}
          style={{
            // 3 pieces: two on top, the last spans the bottom row.
            width: cols === 1 || (shown.length === 3 && i === 2) ? '100%' : '47%',
            flexGrow: 1,
            height: shown.length <= 2 ? '100%' : '47%',
            backgroundColor: colors.surface,
            borderRadius: compact ? 6 : radius.md,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ height: '78%', aspectRatio: 1 }}>
            <GarmentGlyph item={{ categoryId: t.categoryId, primaryColor: t.primaryColor, secondaryColors: t.secondaryColors ?? [], pattern: t.pattern ?? 'solid' }} size="100%" />
          </View>
        </View>
      ))}
    </View>
  );
}

export function PostMedia({ post, compact }: { post: Post; compact?: boolean }) {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const { colors } = useTheme();
  if (!post.images.length) return <TagBoard items={post.items} compact={compact} />;
  if (compact || post.images.length === 1)
    return <Image source={{ uri: resolveImage(post.images[0]) }} style={{ width: '100%', aspectRatio: 4 / 5, backgroundColor: colors.surfaceAlt }} contentFit="cover" accessibilityLabel="Outfit photo" />;
  return (
    <View>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}>
        {post.images.map((u, i) => (
          <Image key={i} source={{ uri: resolveImage(u) }} style={{ width, aspectRatio: 4 / 5, backgroundColor: colors.surfaceAlt }} contentFit="cover" accessibilityLabel={`Outfit photo ${i + 1} of ${post.images.length}`} />
        ))}
      </ScrollView>
      <View style={{ position: 'absolute', bottom: 10, alignSelf: 'center', flexDirection: 'row', gap: 5 }}>
        {post.images.map((_, i) => (
          <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: i === page ? '#FBF8F3' : 'rgba(251,248,243,0.5)' }} />
        ))}
      </View>
    </View>
  );
}

const REASONS: { r: ReportReason; label: string }[] = [
  { r: 'spam', label: 'Spam' },
  { r: 'harassment', label: 'Bullying or harassment' },
  { r: 'nudity', label: 'Nudity or sexual content' },
  { r: 'hate', label: 'Hate speech' },
  { r: 'selfHarm', label: 'Self-harm' },
  { r: 'minorSafety', label: 'Child safety concern' },
  { r: 'other', label: 'Something else' },
];

export function promptReport(target: ReportTarget, targetId: string) {
  Alert.alert('Report', 'Why are you reporting this? Reports are reviewed by the moderation team.', [
    ...REASONS.map(({ r, label }) => ({
      text: label,
      onPress: () => {
        const ok = useSocial.getState().report(target, targetId, r);
        toast({ message: ok ? 'Thanks — we’ll review it' : 'Too many reports right now. Try later.', icon: 'flag' });
      },
    })),
    { text: 'Cancel', style: 'cancel' as const },
  ]);
}

export function confirmBlock(p: Profile, after?: () => void) {
  Alert.alert(`Block @${p.username}?`, 'They won’t be able to see your posts or find your profile, and you won’t see theirs. They aren’t notified.', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Block',
      style: 'destructive',
      onPress: () => {
        useSocial.getState().block(p.id);
        toast({ message: `Blocked @${p.username}`, icon: 'block' });
        after?.();
      },
    },
  ]);
}

/** Ensures the user has a social profile before interacting. */
export function requireProfile(): boolean {
  if (useSocial.getState().joined) return true;
  router.push('/social/edit-profile');
  return false;
}

export function FollowButton({ id, size = 'sm' }: { id: string; size?: 'sm' | 'md' }) {
  const state = useSocial((s) => followState(s, id));
  if (id === ME) return null;
  const label = state === 'following' ? 'Following' : state === 'requested' ? 'Requested' : 'Follow';
  return (
    <Button
      label={label}
      size={size}
      variant={state === 'none' ? 'primary' : 'secondary'}
      onPress={() => {
        if (!requireProfile()) return;
        if (state === 'none') {
          const r = useSocial.getState().follow(id);
          if (r === 'requested') toast({ message: 'Follow request sent', icon: 'people' });
        } else useSocial.getState().unfollow(id);
      }}
    />
  );
}

export function PostCard({ post, why }: { post: Post; why?: string }) {
  const { colors } = useTheme();
  const author = useSocial((s) => profileById(s, post.authorId));
  const liked = useSocial((s) => isLiked(s, post.id));
  const saved = useSocial((s) => s.saved.includes(post.id));
  const live = useSocial((s) => s.posts.find((p) => p.id === post.id)) ?? post;
  if (!author) return null;
  const mine = post.authorId === ME;

  const more = () => {
    const opts: { text: string; style?: 'destructive' | 'cancel'; onPress?: () => void }[] = mine
      ? [
          { text: live.commentsDisabled ? 'Turn on comments' : 'Turn off comments', onPress: () => useSocial.getState().updatePost(post.id, { commentsDisabled: !live.commentsDisabled }) },
          {
            text: 'Delete post',
            style: 'destructive',
            onPress: () =>
              Alert.alert('Delete this post?', 'This can’t be undone.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => useSocial.getState().deletePost(post.id) },
              ]),
          },
        ]
      : [
          { text: 'Report post', onPress: () => promptReport('post', post.id) },
          { text: `Block @${author.username}`, style: 'destructive', onPress: () => confirmBlock(author) },
        ];
    Alert.alert('Post options', undefined, [...opts, { text: 'Cancel', style: 'cancel' }]);
  };

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md }}>
        <Pressable onPress={() => router.push({ pathname: '/social/user/[id]', params: { id: author.id } })} accessibilityRole="button" accessibilityLabel={`${author.displayName}, @${author.username}`} style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, flex: 1 }}>
          <Avatar profile={author} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text variant="bodyStrong" numberOfLines={1}>
                {author.displayName}
              </Text>
              {author.demo && <Badge label="Demo" />}
            </View>
            <Text variant="caption" color="textMuted" numberOfLines={1}>
              @{author.username} · {timeAgo(post.createdAt)}
              {why ? ` · ${why}` : ''}
              {live.audience !== 'public' ? ` · ${live.audience === 'followers' ? 'Followers' : 'Only you'}` : ''}
            </Text>
          </View>
        </Pressable>
        {!mine && <FollowButton id={author.id} />}
        <Pressable onPress={more} hitSlop={10} accessibilityRole="button" accessibilityLabel="Post options" style={{ width: 36, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="more" size={20} />
        </Pressable>
      </View>

      <Pressable onPress={() => router.push({ pathname: '/social/post/[id]', params: { id: post.id } })} accessibilityRole="button" accessibilityLabel="Open post">
        <PostMedia post={post} />
      </Pressable>

      <View style={{ padding: space.md, gap: space.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Pressable
            onPress={() => {
              if (!requireProfile()) return;
              haptic.tap();
              useSocial.getState().toggleLike(post.id);
            }}
            accessibilityRole="button"
            accessibilityLabel={liked ? 'Unlike' : 'Like'}
            accessibilityState={{ selected: liked }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, paddingRight: space.sm }}
          >
            <Icon name={liked ? 'heartFill' : 'heart'} color={liked ? colors.sun : colors.text} />
            <Text variant="label">{live.likeCount}</Text>
          </Pressable>
          <Pressable onPress={() => router.push({ pathname: '/social/post/[id]', params: { id: post.id } })} accessibilityRole="button" accessibilityLabel={`Comments, ${live.commentCount}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, paddingRight: space.sm }}>
            <Icon name="chat" />
            <Text variant="label">{live.commentCount}</Text>
          </Pressable>
          <Pressable
            onPress={() => Share.share({ message: `${author.displayName}’s outfit on Getup: “${post.caption}”` }).catch(() => {})}
            accessibilityRole="button"
            accessibilityLabel="Share"
            style={{ minHeight: 44, minWidth: 40, justifyContent: 'center' }}
          >
            <Icon name="share" />
          </Pressable>
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={() => {
              haptic.tap();
              const now = useSocial.getState().toggleSave(post.id);
              toast({ message: now ? 'Saved to inspiration' : 'Removed from saved', icon: now ? 'bookmarkFill' : 'bookmark' });
            }}
            accessibilityRole="button"
            accessibilityLabel={saved ? 'Unsave' : 'Save'}
            accessibilityState={{ selected: saved }}
            style={{ minHeight: 44, minWidth: 40, alignItems: 'flex-end', justifyContent: 'center' }}
          >
            <Icon name={saved ? 'bookmarkFill' : 'bookmark'} />
          </Pressable>
        </View>
        {!!post.caption && (
          <Text variant="body">
            <Text variant="bodyStrong">{author.username} </Text>
            {post.caption}
          </Text>
        )}
        {post.styleTags.length > 0 && (
          <Text variant="caption" color="accent">
            {post.styleTags.map((t) => `#${STYLE_LABELS[t].toLowerCase().replace(/[^a-z]/g, '')}`).join('  ')}
          </Text>
        )}
        {post.items.length > 0 && !mine && (
          <Button label="Recreate with my closet" icon="wand" variant="accent" size="sm" onPress={() => router.push({ pathname: '/social/recreate/[postId]', params: { postId: post.id } })} />
        )}
      </View>
    </View>
  );
}
