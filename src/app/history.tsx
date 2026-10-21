import { router } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Text } from '@/components/Text';
import { Card, EmptyState, NavHeader, Screen } from '@/components/ui';
import { OutfitStrip } from '@/features/outfits/OutfitBoard';
import { useStore } from '@/state/store';
import { space } from '@/theme/tokens';
import type { ClothingItem } from '@/types/models';
import { formatLongDate, relativeDay } from '@/utils/dates';

export default function History() {
  const logs = useStore((s) => s.wearLogs);
  const items = useStore((s) => s.items);
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const sorted = useMemo(() => [...logs].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)), [logs]);

  return (
    <Screen edges={['top', 'bottom']} header={<NavHeader title="Outfit history" onBack={() => router.back()} />}>
      {sorted.length === 0 ? (
        <EmptyState icon="history" title="No history yet" body="Tap “Wear today” on an outfit and it shows up here." />
      ) : (
        <View style={{ gap: space.md, marginTop: space.sm }}>
          {sorted.map((l) => {
            const its = l.itemIds.map((id) => byId.get(id)).filter(Boolean) as ClothingItem[];
            return (
              <Card key={l.id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm }}>
                  <Text variant="heading">{relativeDay(l.date)}</Text>
                  <Pressable
                    accessibilityRole="button"
                    hitSlop={10}
                    onPress={() =>
                      Alert.alert('Remove this entry?', 'Wear counts for these pieces will be restored.', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Remove', style: 'destructive', onPress: () => useStore.getState().undoWear(l.id) },
                      ])
                    }
                  >
                    <Text variant="label" color="textMuted">
                      Remove
                    </Text>
                  </Pressable>
                </View>
                <Text variant="caption" color="textSubtle" style={{ marginBottom: space.sm }}>
                  {formatLongDate(l.date)}
                </Text>
                <OutfitStrip items={its} size={52} />
                {its.length < l.itemIds.length && (
                  <Text variant="caption" color="textSubtle" style={{ marginTop: 6 }}>
                    {l.itemIds.length - its.length} deleted {l.itemIds.length - its.length === 1 ? 'piece' : 'pieces'}
                  </Text>
                )}
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
