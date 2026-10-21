import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { toast } from '@/components/Toast';
import { Button, Card, EmptyState, IconButton, NavHeader, Screen, TextField } from '@/components/ui';
import { OutfitBoard } from '@/features/outfits/OutfitBoard';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';
import type { ClothingItem } from '@/types/models';
import { haptic } from '@/utils/haptics';

export default function OutfitDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const outfit = useStore((s) => s.outfits.find((o) => o.id === id));
  const items = useStore((s) => s.items);
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const [name, setName] = useState(outfit?.name ?? '');

  if (!outfit) {
    return (
      <Screen header={<NavHeader onBack={() => router.back()} />}>
        <EmptyState icon="bookmark" title="Outfit not found" body="It may have been deleted." />
      </Screen>
    );
  }
  const its = outfit.itemIds.map((i) => byId.get(i)).filter(Boolean) as ClothingItem[];
  const blocked = its.filter((i) => !i.clean || i.availability !== 'available');
  const store = useStore.getState();

  return (
    <Screen
      edges={['top', 'bottom']}
      header={
        <NavHeader
          title="Outfit"
          onBack={() => router.back()}
          right={
            <IconButton
              icon="trash"
              label="Delete outfit"
              onPress={() =>
                Alert.alert('Delete this outfit?', 'The clothes stay in your closet.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      store.deleteOutfit(outfit.id);
                      router.back();
                    },
                  },
                ])
              }
            />
          }
        />
      }
    >
      <TextField label="Name" value={name} placeholder="Give it a name" onChangeText={setName} onEndEditing={() => store.updateOutfit(outfit.id, { name: name.trim() || undefined })} returnKeyType="done" />
      <Card style={{ marginTop: space.lg, padding: space.md }}>
        <OutfitBoard items={its} onItemPress={(i) => router.push(`/item/${i.id}`)} />
      </Card>
      {outfit.reasons && outfit.reasons.length > 0 && (
        <View style={{ gap: 6, marginTop: space.md }}>
          {outfit.reasons.map((r) => (
            <View key={r} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Icon name="check" size={15} color={colors.accent} />
              <Text variant="caption" color="textMuted">
                {r}
              </Text>
            </View>
          ))}
        </View>
      )}
      {blocked.length > 0 && (
        <Text variant="caption" style={{ color: colors.warning, marginTop: space.md }}>
          {blocked.map((b) => b.name).join(', ')} {blocked.length === 1 ? 'is' : 'are'} in the hamper or unavailable.
        </Text>
      )}
      <View style={{ gap: space.sm, marginTop: space.xl }}>
        <Button
          label="Wear today"
          icon="check"
          onPress={() => {
            const go = () => {
              const log = store.wearOutfit(outfit.itemIds, { outfitId: outfit.id });
              haptic.success();
              toast({ message: 'Logged for today', icon: 'check', action: { label: 'Undo', onPress: () => useStore.getState().undoWear(log.id) } });
              router.navigate('/');
            };
            if (blocked.length) Alert.alert('Wear it anyway?', 'Some pieces are marked dirty or unavailable.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Wear anyway', onPress: go }]);
            else go();
          }}
        />
        <Button label="Edit pieces" variant="secondary" icon="swap" onPress={() => router.push({ pathname: '/create', params: { items: outfit.itemIds.join(',') } })} />
      </View>
    </Screen>
  );
}
