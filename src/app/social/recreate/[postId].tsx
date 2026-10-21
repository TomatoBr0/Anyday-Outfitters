import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { GarmentGlyph } from '@/components/GarmentGlyph';
import { GarmentImage } from '@/components/GarmentImage';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { toast } from '@/components/Toast';
import { Badge, Button, Card, EmptyState, NavHeader, Screen } from '@/components/ui';
import { getCategory } from '@/engine/categories';
import { getColor } from '@/engine/colors';
import { recreateOutfit, swapMatch, type MatchLevel, type PieceMatch } from '@/engine/recreate';
import { PostMedia } from '@/features/social/components';
import { useSocial, visiblePosts } from '@/state/social';
import { useStore } from '@/state/store';
import { radius, space } from '@/theme/tokens';
import { haptic } from '@/utils/haptics';

const LEVEL: Record<MatchLevel, { label: string; tone: 'accent' | 'sun' | 'neutral' | 'warning' }> = {
  exact: { label: 'Exact match', tone: 'accent' },
  close: { label: 'Close match', tone: 'accent' },
  compatible: { label: 'Stand-in', tone: 'neutral' },
  missing: { label: 'Missing', tone: 'warning' },
};

export default function Recreate() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const social = useSocial();
  const post = useMemo(() => visiblePosts(social).find((p) => p.id === postId), [social, postId]);
  const closet = useStore((s) => s.items);
  const custom = useStore((s) => s.preferences.customCategories);
  const [initial] = useState(() => (post ? recreateOutfit(post.items, closet, { customCategories: custom }) : undefined));
  const [matches, setMatches] = useState<PieceMatch[]>(initial?.matches ?? []);
  const [open, setOpen] = useState<number | undefined>();

  if (!post || !initial) {
    return (
      <Screen header={<NavHeader onBack={() => router.back()} />}>
        <EmptyState icon="info" title="Post unavailable" body="It may have been deleted or made private." />
      </Screen>
    );
  }

  const overall = matches.length ? Math.round((matches.reduce((s, m) => s + m.similarity, 0) / matches.length) * 100) : 0;
  const ids = matches.flatMap((m) => (m.item ? [m.item.id] : []));
  const missing = matches.filter((m) => m.level === 'missing');

  return (
    <Screen edges={['top', 'bottom']} header={<NavHeader title="Recreate with my closet" onBack={() => router.back()} />}>
      <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center', marginTop: space.sm }}>
        <View style={{ width: 96, borderRadius: radius.md, overflow: 'hidden' }}>
          <PostMedia post={post} compact />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="overline" color="textSubtle">
            Similarity
          </Text>
          <Text variant="display">{overall}%</Text>
          <Text variant="caption" color="textMuted">
            Built only from what’s in your closet. Tap a piece to swap it.
          </Text>
        </View>
      </View>

      {!closet.length && (
        <EmptyState icon="hanger" title="Your closet is empty" body="Add a few pieces and we’ll match this look." action={<Button label="Add clothes" onPress={() => router.push('/item/add')} />} />
      )}

      <View style={{ gap: space.md, marginTop: space.xl }}>
        {matches.map((m, i) => {
          const lv = LEVEL[m.level];
          return (
            <Card key={i} padded={false} style={{ padding: space.md }}>
              <Pressable onPress={() => setOpen(open === i ? undefined : i)} accessibilityRole="button" accessibilityState={{ expanded: open === i }} accessibilityLabel={`${getCategory(m.inspiration.categoryId, custom).label}: ${lv.label}${m.item ? `, your ${m.item.name}` : ''}`} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <View style={{ alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 56, height: 56, borderRadius: radius.sm, backgroundColor: '#EDE7DC', alignItems: 'center', justifyContent: 'center' }}>
                    <GarmentGlyph item={{ categoryId: m.inspiration.categoryId, primaryColor: m.inspiration.primaryColor, secondaryColors: m.inspiration.secondaryColors ?? [], pattern: m.inspiration.pattern ?? 'solid' }} size={44} />
                  </View>
                  <Text variant="caption" color="textSubtle" style={{ fontSize: 11 }}>
                    Theirs
                  </Text>
                </View>
                <Icon name="arrowRight" size={18} />
                <View style={{ alignItems: 'center', gap: 4 }}>
                  {m.item ? (
                    <GarmentImage item={m.item} size={56} rounded={radius.sm} />
                  ) : (
                    <View style={{ width: 56, height: 56, borderRadius: radius.sm, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#CFC4B1', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name="plus" size={18} />
                    </View>
                  )}
                  <Text variant="caption" color="textSubtle" style={{ fontSize: 11 }}>
                    Yours
                  </Text>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {m.item ? m.item.name : `${getColor(m.inspiration.primaryColor).label} ${getCategory(m.inspiration.categoryId, custom).label.toLowerCase()}`}
                  </Text>
                  <Badge label={`${lv.label}${m.item ? ` · ${Math.round(m.similarity * 100)}%` : ''}`} tone={lv.tone} />
                </View>
              </Pressable>
              <View style={{ marginTop: space.sm, gap: 2 }}>
                {m.reasons.map((r) => (
                  <Text key={r} variant="caption" color="textMuted">
                    • {r}
                  </Text>
                ))}
                {m.unavailable && (
                  <Text variant="caption" color="warning">
                    • In the hamper or unavailable
                  </Text>
                )}
              </View>
              {open === i && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: space.md }} contentContainerStyle={{ gap: space.sm }}>
                  {m.alternatives.length === 0 && (
                    <Text variant="caption" color="textMuted">
                      No other clean pieces fit this role.
                    </Text>
                  )}
                  {m.alternatives.map((a) => (
                    <Pressable
                      key={a.item.id}
                      onPress={() => {
                        haptic.tap();
                        setMatches(matches.map((x, k) => (k === i ? swapMatch(x, a.item, custom) : x)));
                        setOpen(undefined);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Swap in ${a.item.name}, ${Math.round(a.similarity * 100)}% similar`}
                      style={{ width: 84 }}
                    >
                      <GarmentImage item={a.item} size={80} rounded={radius.sm} />
                      <Text variant="caption" numberOfLines={1}>
                        {a.item.name}
                      </Text>
                      <Text variant="caption" color="textSubtle" style={{ fontSize: 11 }}>
                        {LEVEL[a.level].label} · {Math.round(a.similarity * 100)}%
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </Card>
          );
        })}
      </View>

      {missing.length > 0 && (
        <Text variant="caption" color="textMuted" style={{ marginTop: space.md }}>
          Missing: {missing.map((m) => `${getColor(m.inspiration.primaryColor).label.toLowerCase()} ${getCategory(m.inspiration.categoryId, custom).label.toLowerCase()}`).join(', ')}. The rest still works as an outfit.
        </Text>
      )}

      {ids.length >= 1 && (
        <View style={{ gap: space.sm, marginTop: space.xl }}>
          <Button
            label="Wear today"
            icon="check"
            onPress={() => {
              const log = useStore.getState().wearOutfit(ids);
              toast({ message: 'Logged for today', icon: 'check', action: { label: 'Undo', onPress: () => useStore.getState().undoWear(log.id) } });
              router.navigate('/');
            }}
          />
          <Button
            label="Save outfit"
            icon="bookmark"
            variant="secondary"
            onPress={() => {
              useStore.getState().saveOutfit(ids, { name: `Inspired by @${social.profiles.find((p) => p.id === post.authorId)?.username}`, reasons: [`${overall}% similar to the inspiration`] });
              if (!useSocial.getState().saved.includes(post.id)) useSocial.getState().toggleSave(post.id);
              toast({ message: 'Saved to your outfits', icon: 'bookmarkFill' });
            }}
          />
          <Button label="Fine-tune in Create" icon="swap" variant="ghost" onPress={() => router.push({ pathname: '/create', params: { items: ids.join(',') } })} />
        </View>
      )}
    </Screen>
  );
}
