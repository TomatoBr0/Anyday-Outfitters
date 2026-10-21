import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { GarmentImage } from '@/components/GarmentImage';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { toast } from '@/components/Toast';
import { Button, EmptyState, NavHeader, Screen, SectionHeader, Segmented } from '@/components/ui';
import { AVAILABILITY_LABELS } from '@/features/closet/labels';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import type { ClothingItem, ID } from '@/types/models';
import { relativeDay } from '@/utils/dates';
import { haptic } from '@/utils/haptics';

export default function Laundry() {
  const { colors } = useTheme();
  const items = useStore((s) => s.items);
  const [tab, setTab] = useState<'hamper' | 'clean'>('hamper');
  const dirty = useMemo(() => items.filter((i) => !i.clean), [items]);
  const clean = useMemo(() => items.filter((i) => i.clean).sort((a, b) => (b.lastWornOn ?? '').localeCompare(a.lastWornOn ?? '')), [items]);
  const away = useMemo(() => items.filter((i) => i.availability !== 'available'), [items]);
  const [selected, setSelected] = useState<Set<ID>>(new Set());

  const list = tab === 'hamper' ? dirty : clean;
  const toggle = (id: ID) => {
    haptic.tap();
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const apply = (ids: ID[]) => {
    if (!ids.length) return;
    const toClean = tab === 'hamper';
    useStore.getState().setCleanState(ids, toClean);
    haptic.success();
    toast({
      message: toClean ? `${ids.length} ${ids.length === 1 ? 'piece' : 'pieces'} back in rotation` : `${ids.length} moved to the hamper`,
      icon: 'check',
      action: { label: 'Undo', onPress: () => useStore.getState().setCleanState(ids, !toClean) },
    });
    setSelected(new Set());
  };

  return (
    <Screen edges={['top', 'bottom']} header={<NavHeader title="Laundry" onBack={() => router.back()} />}>
      <Segmented
        value={tab}
        onChange={(t) => {
          setTab(t);
          setSelected(new Set());
        }}
        options={[
          { value: 'hamper', label: `In hamper (${dirty.length})` },
          { value: 'clean', label: 'Clean' },
        ]}
        style={{ marginTop: space.sm }}
      />

      {list.length === 0 ? (
        <EmptyState
          icon={tab === 'hamper' ? 'check' : 'basket'}
          title={tab === 'hamper' ? 'Hamper’s empty' : 'Everything’s in the wash'}
          body={tab === 'hamper' ? 'Everything is clean and ready to wear.' : 'Mark items clean from the hamper when laundry’s done.'}
        />
      ) : (
        <>
          <Text variant="caption" color="textMuted" style={{ marginTop: space.md }}>
            {tab === 'hamper' ? 'Tap pieces you’ve washed, or clear the whole hamper.' : 'Tap anything that needs a wash.'}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.md }}>
            {list.map((i) => (
              <Tile key={i.id} item={i} selected={selected.has(i.id)} onPress={() => toggle(i.id)} />
            ))}
          </View>
        </>
      )}

      {away.length > 0 && (
        <>
          <SectionHeader title="Away from closet" />
          {away.map((i) => (
            <View key={i.id} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm }}>
              <GarmentImage item={i} size={48} rounded={radius.sm} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{i.name}</Text>
                <Text variant="caption" color="textMuted">
                  {AVAILABILITY_LABELS[i.availability]}
                </Text>
              </View>
              <Button size="sm" variant="secondary" label="It’s back" onPress={() => useStore.getState().setAvailability(i.id, 'available')} />
            </View>
          ))}
        </>
      )}

      {list.length > 0 && (
        <View style={{ marginTop: space.xl, gap: space.sm }}>
          <Button
            label={selected.size ? `${tab === 'hamper' ? 'Mark clean' : 'Move to hamper'} (${selected.size})` : tab === 'hamper' ? 'Select pieces to mark clean' : 'Select pieces'}
            icon={tab === 'hamper' ? 'check' : 'basket'}
            disabled={!selected.size}
            onPress={() => apply([...selected])}
          />
          {tab === 'hamper' && <Button label="Everything’s washed" variant="secondary" onPress={() => apply(dirty.map((d) => d.id))} />}
        </View>
      )}
      <View style={{ height: 1, marginTop: space.lg, backgroundColor: colors.border, opacity: 0 }} />
    </Screen>
  );
}

function Tile({ item, selected, onPress }: { item: ClothingItem; selected: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} accessibilityLabel={item.name} style={{ width: '30%' }}>
      <View style={{ borderRadius: radius.md, borderWidth: 2, borderColor: selected ? colors.accent : 'transparent', padding: 2 }}>
        <GarmentImage item={item} fill rounded={radius.sm} />
        <View style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 11, backgroundColor: selected ? colors.accent : 'rgba(255,255,255,0.85)', borderWidth: selected ? 0 : 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' }}>
          {selected && <Icon name="check" size={13} color={colors.onAccent} strokeWidth={2.6} />}
        </View>
      </View>
      <Text variant="caption" numberOfLines={1} style={{ marginTop: 4 }}>
        {item.name}
      </Text>
      {item.lastWornOn && (
        <Text variant="caption" color="textSubtle" numberOfLines={1} style={{ fontSize: 11 }}>
          Worn {relativeDay(item.lastWornOn).toLowerCase()}
        </Text>
      )}
    </Pressable>
  );
}
