import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Alert, View, useWindowDimensions } from 'react-native';

import { GarmentImage } from '@/components/GarmentImage';
import { Text } from '@/components/Text';
import { toast } from '@/components/Toast';
import { Badge, Button, Card, EmptyState, IconButton, ListRow, NavHeader, Screen, SectionHeader, Segmented } from '@/components/ui';
import { AVAILABILITY_LABELS, FIT_LABELS, FORMALITY_LABELS, PATTERN_LABELS, SEASON_LABELS, WARMTH_LABELS, STAIN_LABELS } from '@/features/closet/labels';
import { OutfitStrip } from '@/features/outfits/OutfitBoard';
import { getCategory } from '@/engine/categories';
import { getColor } from '@/engine/colors';
import { STYLE_LABELS } from '@/engine/scoring';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import type { Availability, ClothingItem, StainLevel } from '@/types/models';
import { relativeDay } from '@/utils/dates';
import { haptic } from '@/utils/haptics';

export default function ItemDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const item = useStore((s) => s.items.find((i) => i.id === id));
  const items = useStore((s) => s.items);
  const logs = useStore((s) => s.wearLogs);
  const custom = useStore((s) => s.preferences.customCategories);
  const history = useMemo(() => logs.filter((l) => l.itemIds.includes(id)).slice(0, 6), [logs, id]);
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  if (!item) {
    return (
      <Screen edges={['top']} header={<NavHeader onBack={() => router.back()} />}>
        <EmptyState icon="hanger" title="Item not found" body="It may have been deleted." />
      </Screen>
    );
  }

  const cat = getCategory(item.categoryId, custom);
  const color = getColor(item.primaryColor);
  const store = useStore.getState();

  const remove = () =>
    Alert.alert(`Delete ${item.name}?`, 'This removes it and its photo from your closet. Saved outfits keep their other pieces.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          store.deleteItem(item.id);
          haptic.warning();
          toast({ message: 'Deleted', icon: 'trash' });
          router.back();
        },
      },
    ]);

  return (
    <Screen
      edges={['top', 'bottom']}
      header={
        <NavHeader
          onBack={() => router.back()}
          right={
            <>
              <IconButton icon={item.favorite ? 'heartFill' : 'heart'} label={item.favorite ? 'Remove from favorites' : 'Add to favorites'} color={item.favorite ? colors.sun : undefined} onPress={() => store.toggleFavorite(item.id)} />
              <IconButton icon="edit" label="Edit item" onPress={() => router.push({ pathname: '/item/editor', params: { id: item.id } })} />
            </>
          }
        />
      }
    >
      <GarmentImage item={item} size={width - space.xl * 2} rounded={radius.xl} />
      <View style={{ marginTop: space.lg, gap: 6 }}>
        <Text variant="display">{item.name}</Text>
        <Text variant="callout" color="textMuted">
          {cat.label}
          {item.subcategory ? ` · ${item.subcategory}` : ''} · {color.label}
          {item.brand ? ` · ${item.brand}` : ''}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {item.styleTags.map((t) => (
            <Badge key={t} label={STYLE_LABELS[t]} />
          ))}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.xl }}>
        <Stat label="Worn" value={`${item.wearCount}×`} />
        <Stat label="Last worn" value={item.lastWornOn ? relativeDay(item.lastWornOn) : '—'} />
        <Stat label="Status" value={item.clean ? 'Clean' : 'In hamper'} tone={item.clean ? undefined : 'sun'} />
      </View>

      <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.lg }}>
        <Button
          label="Build an outfit"
          icon="sparkles"
          style={{ flex: 1 }}
          onPress={() => router.push({ pathname: '/create', params: { items: item.id, lock: item.id } })}
        />
        <Button
          label={item.clean ? 'Mark dirty' : 'Mark clean'}
          icon={item.clean ? 'basket' : 'check'}
          variant="secondary"
          onPress={() => {
            store.setCleanState([item.id], !item.clean);
            toast({ message: item.clean ? 'Moved to the hamper' : 'Marked clean', icon: 'check' });
          }}
        />
      </View>

      <SectionHeader title="Availability" />
      <Segmented<Availability>
        value={item.availability}
        onChange={(v) => store.setAvailability(item.id, v)}
        options={(Object.keys(AVAILABILITY_LABELS) as Availability[]).map((a) => ({ value: a, label: AVAILABILITY_LABELS[a] }))}
      />
      {item.availability !== 'available' && (
        <Text variant="caption" color="textMuted" style={{ marginTop: 6 }}>
          Won’t be suggested until it’s available again.
        </Text>
      )}

      <SectionHeader title="Stain" />
      <Segmented<StainLevel | 'none'>
        value={item.stain ?? 'none'}
        onChange={(v) => {
          store.updateItem(item.id, { stain: v === 'none' ? undefined : v });
          if (v === 'none' && item.stain) toast({ message: 'Stain cleared', icon: 'check' });
        }}
        options={[{ value: 'none', label: 'None' }, ...(Object.keys(STAIN_LABELS) as StainLevel[]).map((s) => ({ value: s, label: STAIN_LABELS[s] }))]}
      />
      {item.stain && (
        <Text variant="caption" color="textMuted" style={{ marginTop: 6 }}>
          {item.stain === 'bad'
            ? 'Won’t be suggested until you clear the stain.'
            : item.stain === 'noticeable'
              ? 'Only suggested for casual plans. Clear it once it’s out.'
              : 'Kept out of dressy plans. Clear it once it’s out.'}
        </Text>
      )}

      <SectionHeader title="Details" />
      <Card padded={false} style={{ paddingHorizontal: space.lg }}>
        <ListRow first title="Dressiness" value={FORMALITY_LABELS[item.formality]} />
        <ListRow title="Warmth" value={WARMTH_LABELS[item.warmth]} />
        <ListRow title="Pattern" value={PATTERN_LABELS[item.pattern]} />
        {item.fit && <ListRow title="Fit" value={FIT_LABELS[item.fit]} />}
        {item.material && <ListRow title="Material" value={item.material} />}
        <ListRow title="Seasons" value={item.seasons.length ? item.seasons.map((s) => SEASON_LABELS[s]).join(', ') : 'All year'} />
        <ListRow title="Washing" value={item.wearsBeforeWash >= 999 ? 'Manual' : `Every ${item.wearsBeforeWash} ${item.wearsBeforeWash === 1 ? 'wear' : 'wears'}`} />
        {item.waterResistant && <ListRow title="Handles rain" value="Yes" />}
      </Card>
      {item.notes && (
        <Text variant="body" color="textMuted" style={{ marginTop: space.md }}>
          {item.notes}
        </Text>
      )}

      <SectionHeader title="Recently worn with" />
      {history.length ? (
        <View style={{ gap: space.md }}>
          {history.map((l) => (
            <View key={l.id} style={{ gap: 6 }}>
              <Text variant="label" color="textMuted">
                {relativeDay(l.date)}
              </Text>
              <OutfitStrip items={l.itemIds.map((x) => byId.get(x)).filter(Boolean) as ClothingItem[]} size={48} />
            </View>
          ))}
        </View>
      ) : (
        <Text variant="body" color="textMuted">
          Not worn yet. Tap “Build an outfit” to style it.
        </Text>
      )}

      <Button label="Delete item" variant="danger" icon="trash" style={{ marginTop: space.xxxl }} onPress={remove} />
    </Screen>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'sun' }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, padding: space.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
      <Text variant="overline" color="textSubtle">
        {label}
      </Text>
      <Text variant="heading" style={{ marginTop: 4, color: tone === 'sun' ? colors.sun : colors.text }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
