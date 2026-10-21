import { router } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import { Badge, Button, Card, EmptyState, NavHeader, Screen } from '@/components/ui';
import { getCategory } from '@/engine/categories';
import { OCCASION_LABELS } from '@/engine/scoring';
import { OutfitBoard } from '@/features/outfits/OutfitBoard';
import { useStore } from '@/state/store';
import { space } from '@/theme/tokens';
import type { ClothingItem } from '@/types/models';

export default function SavedOutfits() {
  const outfits = useStore((s) => s.outfits);
  const items = useStore((s) => s.items);
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const saved = outfits.filter((o) => o.saved);

  return (
    <Screen edges={['top', 'bottom']} header={<NavHeader title="Saved outfits" onBack={() => router.back()} />}>
      {saved.length === 0 ? (
        <EmptyState icon="bookmark" title="No saved outfits" body="Tap the bookmark on any suggestion to keep it here." action={<Button label="Build one" icon="plus" onPress={() => router.push('/create')} />} />
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.sm }}>
          {saved.map((o) => {
            const its = o.itemIds.map((id) => byId.get(id)).filter(Boolean) as ClothingItem[];
            const unavailable = its.some((i) => !i.clean || i.availability !== 'available');
            return (
              <Card key={o.id} padded={false} style={{ width: '47.5%', padding: space.sm }} onPress={() => router.push(`/outfit/${o.id}`)} accessibilityLabel={o.name ?? 'Saved outfit'}>
                <OutfitBoard items={its.filter((i) => getCategory(i.categoryId).slot !== 'accessory')} compact />
                <Text variant="label" numberOfLines={1} style={{ marginTop: space.sm }}>
                  {o.name ?? 'Saved outfit'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                  {o.occasion && <Badge label={OCCASION_LABELS[o.occasion]} />}
                  {unavailable && <Badge label="Needs wash" tone="sun" />}
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
