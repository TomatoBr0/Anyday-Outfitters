import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/Text';
import { Button, Chip, EmptyState, NavHeader, Screen, TextField } from '@/components/ui';
import { PostMedia } from '@/features/social/components';
import { useSocial, visiblePosts } from '@/state/social';
import { radius, space } from '@/theme/tokens';

export default function Saved() {
  const social = useSocial();
  const [active, setActive] = useState<string | 'all'>('all');
  const [newName, setNewName] = useState('');
  const visible = useMemo(() => new Map(visiblePosts(social).map((p) => [p.id, p])), [social]);
  const col = social.collections.find((c) => c.id === active);
  const ids = active === 'all' ? social.saved : col?.postIds ?? [];
  const posts = ids.map((id) => visible.get(id)).filter((p): p is NonNullable<typeof p> => !!p);

  const addTo = (postId: string) =>
    Alert.alert('Add to collection', undefined, [
      ...social.collections.map((c) => ({ text: `${c.postIds.includes(postId) ? '✓ ' : ''}${c.name}`, onPress: () => social.toggleInCollection(c.id, postId) })),
      { text: 'Recreate with my closet', onPress: () => router.push({ pathname: '/social/recreate/[postId]', params: { postId } }) },
      { text: 'Remove from saved', style: 'destructive' as const, onPress: () => social.toggleSave(postId) },
      { text: 'Cancel', style: 'cancel' as const },
    ]);

  return (
    <Screen edges={['top', 'bottom']} header={<NavHeader title="Saved inspiration" onBack={() => router.back()} />}>
      <Text variant="caption" color="textMuted">
        Private to you. Long-press a post to organize it or recreate it.
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.xl, marginTop: space.md }} contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.xl }}>
        <Chip label={`All (${social.saved.length})`} size="sm" selected={active === 'all'} onPress={() => setActive('all')} />
        {social.collections.map((c) => (
          <Chip key={c.id} label={`${c.name} (${c.postIds.length})`} size="sm" selected={active === c.id} onPress={() => setActive(c.id)} />
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md, alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <TextField placeholder="New collection (e.g. School outfits)" value={newName} onChangeText={setNewName} maxLength={40} />
        </View>
        <Button label="Create" size="sm" disabled={!newName.trim()} onPress={() => { social.createCollection(newName); setNewName(''); }} style={{ minHeight: 48 }} />
      </View>
      {col && <Button label="Delete collection" variant="ghost" size="sm" onPress={() => { social.deleteCollection(col.id); setActive('all'); }} style={{ alignSelf: 'flex-start' }} />}
      {posts.length === 0 ? (
        <EmptyState icon="bookmark" title="Nothing saved here" body="Tap the bookmark on any post in Social to save it." />
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.lg }}>
          {posts.map((p) => (
            <Pressable key={p.id} onPress={() => router.push({ pathname: '/social/post/[id]', params: { id: p.id } })} onLongPress={() => addTo(p.id)} accessibilityRole="button" accessibilityHint="Long-press for collections and recreate" style={{ width: '31.5%', borderRadius: radius.sm, overflow: 'hidden' }}>
              <PostMedia post={p} compact />
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
