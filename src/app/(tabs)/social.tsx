import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { Button, EmptyState, IconButton, PageHeader, Segmented, Skeleton } from '@/components/ui';
import { PostCard, requireProfile } from '@/features/social/components';
import { discoverScore } from '@/social/rules';
import { feed, useSocial } from '@/state/social';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

export default function Social() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const social = useSocial();
  const styles = useStore((s) => s.preferences.styles);
  const closet = useStore((s) => s.items);
  const [tab, setTab] = useState<'following' | 'discover'>('discover');
  const [pages, setPages] = useState({ following: 0, discover: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const unread = social.notifications.filter((n) => !n.read).length + social.requests.filter(([, t]) => t === 'me').length;

  const { posts, more } = useMemo(() => feed(social, tab, { styles, closet }, pages[tab]), [social, tab, styles, closet, pages]);
  const [now] = useState(() => Date.now());

  const header = (
    <View style={{ paddingHorizontal: space.xl }}>
      <PageHeader
        title="Social"
        right={
          <>
            <IconButton icon="search" label="Search people and styles" onPress={() => router.push('/social/search')} />
            <View>
              <IconButton icon="bell" label={`Notifications${unread ? `, ${unread} new` : ''}`} onPress={() => router.push('/social/notifications')} />
              {unread > 0 && <View style={{ position: 'absolute', top: 8, right: 8, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.sun }} />}
            </View>
            <IconButton icon="plus" label="New post" background={colors.primary} color={colors.onPrimary} onPress={() => requireProfile() && router.push('/social/compose')} />
          </>
        }
      />
      {social.showDemo && (
        <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center', padding: space.md, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, marginBottom: space.md }}>
          <Icon name="info" size={18} color={colors.textMuted} />
          <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
            Demo mode: accounts marked “Demo” are sample data on this phone. Posts aren’t shared until the Getup community launches.
          </Text>
        </View>
      )}
      {!social.joined && (
        <View style={{ padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.accentSoft, marginBottom: space.md, gap: space.sm }}>
          <Text variant="heading">Make your style profile</Text>
          <Text variant="caption" color="textMuted">
            Share outfits, follow friends and save inspiration. Your closet stays private either way.
          </Text>
          <Button label="Create profile" size="sm" onPress={() => router.push('/social/edit-profile')} style={{ alignSelf: 'flex-start' }} />
        </View>
      )}
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'following', label: 'Following' },
          { value: 'discover', label: 'Discover' },
        ]}
        style={{ marginBottom: space.lg }}
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <FlatList
        data={social.hydrated ? posts : []}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 120 }}
        ItemSeparatorComponent={() => <View style={{ height: space.lg }} />}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: space.lg }}>
            <PostCard post={item} why={tab === 'discover' ? discoverScore(item, styles, closet, now).why : undefined} />
          </View>
        )}
        onEndReachedThreshold={0.5}
        onEndReached={() => more && setPages((p) => ({ ...p, [tab]: p[tab] + 1 }))}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.textMuted}
            onRefresh={() => {
              setRefreshing(true);
              setPages({ following: 0, discover: 0 });
              setTimeout(() => setRefreshing(false), 400);
            }}
          />
        }
        ListEmptyComponent={
          !social.hydrated ? (
            <View style={{ paddingHorizontal: space.lg, gap: space.lg }}>
              <Skeleton width="100%" height={420} radius={radius.lg} />
              <Skeleton width="100%" height={420} radius={radius.lg} />
            </View>
          ) : tab === 'following' ? (
            <EmptyState icon="people" title="Nobody here yet" body="Follow people from Discover or search, and their outfits show up here." action={<Button label="Find people" icon="search" onPress={() => router.push('/social/search')} />} />
          ) : (
            <EmptyState icon="sparkles" title="Nothing to discover" body="Turn on demo content in Profile → Social settings, or check back when the community launches." />
          )
        }
        ListFooterComponent={
          more ? (
            <Pressable onPress={() => setPages((p) => ({ ...p, [tab]: p[tab] + 1 }))} style={{ padding: space.xl, alignItems: 'center' }} accessibilityRole="button">
              <Text variant="label" color="accent">
                Load more
              </Text>
            </Pressable>
          ) : posts.length ? (
            <Text variant="caption" color="textSubtle" align="center" style={{ padding: space.xl }}>
              You’re all caught up.
            </Text>
          ) : undefined
        }
      />
    </View>
  );
}
