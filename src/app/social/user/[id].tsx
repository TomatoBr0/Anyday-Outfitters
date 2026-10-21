import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, View, useWindowDimensions } from 'react-native';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { Badge, Button, EmptyState, IconButton, NavHeader, Screen } from '@/components/ui';
import { STYLE_LABELS } from '@/engine/scoring';
import { Avatar, FollowButton, PostMedia, confirmBlock, promptReport } from '@/features/social/components';
import { ME, canSeeProfileContent, isBlocked, useSocial, visiblePosts } from '@/state/social';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

export default function UserProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const social = useSocial();
  const profile = social.profiles.find((p) => p.id === id);
  const mine = id === ME;
  const posts = visiblePosts(social).filter((p) => p.authorId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const followers = social.follows.filter(([, t]) => t === id).length;
  const following = social.follows.filter(([f]) => f === id).length;
  const pending = social.requests.filter(([, t]) => t === ME).length;

  if (!profile || (!mine && isBlocked(social, ME, profile.id))) {
    return (
      <Screen header={<NavHeader onBack={() => router.back()} />}>
        <EmptyState icon="user" title="Profile unavailable" body={profile ? 'You’ve blocked this account. Unblock it in Social settings.' : 'This account doesn’t exist.'} />
      </Screen>
    );
  }
  const visible = canSeeProfileContent(social, profile);
  const tile = (width - space.xl * 2 - space.sm * 2) / 3;

  return (
    <Screen
      edges={['top', 'bottom']}
      header={
        <NavHeader
          title={`@${profile.username}`}
          onBack={() => router.back()}
          right={
            mine ? (
              <IconButton icon="settings" label="Social settings" onPress={() => router.push('/social/settings')} />
            ) : (
              <IconButton
                icon="more"
                label="More"
                onPress={() =>
                  Alert.alert(`@${profile.username}`, undefined, [
                    { text: 'Report account', onPress: () => promptReport('account', profile.id) },
                    { text: 'Block', style: 'destructive', onPress: () => confirmBlock(profile, () => router.back()) },
                    { text: 'Cancel', style: 'cancel' },
                  ])
                }
              />
            )
          }
        />
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg, marginTop: space.sm }}>
        <Avatar profile={profile} size={84} />
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-around' }}>
          <Stat n={posts.length} label="Posts" />
          <Pressable onPress={() => visible && router.push({ pathname: '/social/connections', params: { id: profile.id, list: 'followers' } })} accessibilityRole="button">
            <Stat n={followers} label="Followers" />
          </Pressable>
          <Pressable onPress={() => visible && router.push({ pathname: '/social/connections', params: { id: profile.id, list: 'following' } })} accessibilityRole="button">
            <Stat n={following} label="Following" />
          </Pressable>
        </View>
      </View>
      <View style={{ marginTop: space.md, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text variant="heading">{profile.displayName}</Text>
          {profile.isPrivate && <Icon name="lock" size={15} color={colors.textMuted} />}
          {profile.demo && <Badge label="Demo" />}
        </View>
        {!!profile.bio && <Text variant="body">{profile.bio}</Text>}
        {profile.styleTags.length > 0 && (
          <Text variant="caption" color="accent">
            {profile.styleTags.map((t) => STYLE_LABELS[t]).join(' · ')}
          </Text>
        )}
      </View>
      <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.lg }}>
        {mine ? (
          <>
            <Button label="Edit profile" variant="secondary" size="sm" style={{ flex: 1 }} onPress={() => router.push('/social/edit-profile')} />
            <Button label={pending ? `Requests (${pending})` : 'Saved'} variant="secondary" size="sm" style={{ flex: 1 }} onPress={() => router.push(pending ? { pathname: '/social/connections', params: { id: ME, list: 'requests' } } : '/social/saved')} />
          </>
        ) : (
          <View style={{ flex: 1 }}>
            <FollowButton id={profile.id} size="md" />
          </View>
        )}
      </View>

      {!visible ? (
        <EmptyState icon="lock" title="This account is private" body="Follow to see their outfits. They’ll need to approve your request." />
      ) : posts.length === 0 ? (
        <EmptyState icon="image" title="No posts yet" body={mine ? 'Share an outfit from Create or Today.' : 'Nothing shared yet.'} action={mine ? <Button label="Share an outfit" icon="plus" onPress={() => router.push('/social/compose')} /> : undefined} />
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.xl }}>
          {posts.map((p) => (
            <Pressable key={p.id} onPress={() => router.push({ pathname: '/social/post/[id]', params: { id: p.id } })} accessibilityRole="button" accessibilityLabel={p.caption || 'Outfit post'} style={{ width: tile, borderRadius: radius.sm, overflow: 'hidden' }}>
              <PostMedia post={p} compact />
              {p.audience !== 'public' && (
                <View style={{ position: 'absolute', top: 4, right: 4 }}>
                  <Icon name="lock" size={14} color={colors.textMuted} />
                </View>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <View style={{ alignItems: 'center' }} accessible accessibilityLabel={`${n} ${label}`}>
      <Text variant="title">{n}</Text>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
    </View>
  );
}
