import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/Text';
import { Chip, EmptyState, NavHeader, Screen, SectionHeader, TextField } from '@/components/ui';
import { STYLE_LABELS } from '@/engine/scoring';
import { Avatar, FollowButton, PostMedia } from '@/features/social/components';
import { search, useSocial } from '@/state/social';
import { radius, space } from '@/theme/tokens';
import type { StyleTag } from '@/types/models';

export default function Search() {
  const social = useSocial();
  const [q, setQ] = useState('');
  const res = useMemo(() => search(social, q), [social, q]);

  return (
    <Screen edges={['top', 'bottom']} header={<NavHeader title="Search" onBack={() => router.back()} />}>
      <TextField icon="search" placeholder="People, @usernames, #styles, pieces" value={q} onChangeText={setQ} autoFocus autoCapitalize="none" autoCorrect={false} />
      {q.trim().length < 2 ? (
        <>
          <SectionHeader title="Browse styles" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {(Object.keys(STYLE_LABELS) as StyleTag[]).map((t) => (
              <Chip key={t} label={STYLE_LABELS[t]} size="sm" onPress={() => setQ(t)} />
            ))}
          </View>
        </>
      ) : res.people.length + res.posts.length === 0 ? (
        <EmptyState icon="search" title="No results" body="Try a username, a style like “minimalist”, or a piece like “hoodie”." />
      ) : (
        <>
          {res.people.length > 0 && <SectionHeader title="People" />}
          {res.people.slice(0, 20).map((p) => (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm }}>
              <Pressable onPress={() => router.push({ pathname: '/social/user/[id]', params: { id: p.id } })} accessibilityRole="button" style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <Avatar profile={p} size={44} />
                <View>
                  <Text variant="bodyStrong">{p.displayName}</Text>
                  <Text variant="caption" color="textMuted">
                    @{p.username}
                  </Text>
                </View>
              </Pressable>
              <FollowButton id={p.id} />
            </View>
          ))}
          {res.posts.length > 0 && <SectionHeader title="Outfits" />}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {res.posts.slice(0, 30).map((p) => (
              <Pressable key={p.id} onPress={() => router.push({ pathname: '/social/post/[id]', params: { id: p.id } })} accessibilityRole="button" accessibilityLabel={p.caption} style={{ width: '31.5%', borderRadius: radius.sm, overflow: 'hidden' }}>
                <PostMedia post={p} compact />
              </Pressable>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}
