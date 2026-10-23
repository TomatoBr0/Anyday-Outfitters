import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { GarmentImage } from '@/components/GarmentImage';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { toast } from '@/components/Toast';
import { Badge, Button, Card, EmptyState, IconButton, NavHeader, Screen, SectionHeader, TextField } from '@/components/ui';
import { getCategory } from '@/engine/categories';
import { buildPackingList, tripNights } from '@/engine/packing';
import { OCCASION_LABELS } from '@/engine/scoring';
import { tripForecast } from '@/features/trips/forecast';
import { formatTemp } from '@/services/weather';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import type { ClothingItem, PackingEntry } from '@/types/models';
import { formatShortDate } from '@/utils/dates';
import { haptic } from '@/utils/haptics';

export default function TripDetail() {
  const { id, notes } = useLocalSearchParams<{ id: string; notes?: string }>();
  const { colors } = useTheme();
  const trip = useStore((s) => s.trips.find((t) => t.id === id));
  const items = useStore((s) => s.items);
  const unit = useStore((s) => s.preferences.tempUnit);
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState(false);
  const planNotes: string[] = useMemo(() => {
    try {
      return notes ? JSON.parse(notes) : [];
    } catch {
      return [];
    }
  }, [notes]);

  if (!trip) {
    return (
      <Screen header={<NavHeader onBack={() => router.back()} />}>
        <EmptyState icon="suitcase" title="Trip not found" body="It may have been deleted." />
      </Screen>
    );
  }
  const store = useStore.getState();
  const packed = trip.packingList.filter((p) => p.packed).length;
  const clothes = trip.packingList.map((p, i) => ({ p, i })).filter(({ p }) => p.itemId);
  const extras = trip.packingList.map((p, i) => ({ p, i })).filter(({ p }) => !p.itemId);

  const setList = (packingList: PackingEntry[]) => store.upsertTrip({ ...trip, packingList });
  const removeAt = (idx: number) => setList(trip.packingList.filter((_, i) => i !== idx));

  const regenerate = async () => {
    setBusy(true);
    try {
      const forecastSummary = await tripForecast(trip.latitude, trip.longitude, trip.startDate, trip.endDate);
      const prefs = useStore.getState().preferences;
      const plan = buildPackingList({ items, trip, forecast: forecastSummary, includeDirty: true, customCategories: prefs.customCategories, clothesFor: prefs.clothesFor });
      const keepCustom = trip.packingList.filter((p) => p.custom && !plan.entries.some((e) => e.label === p.label));
      store.upsertTrip({ ...trip, forecastSummary, packingList: [...plan.entries, ...keepCustom] });
      toast({ message: 'Packing list refreshed', icon: 'refresh' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      edges={['top', 'bottom']}
      header={
        <NavHeader
          title={trip.destination}
          onBack={() => router.back()}
          right={
            <IconButton
              icon="trash"
              label="Delete trip"
              onPress={() =>
                Alert.alert('Delete this trip?', undefined, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      store.deleteTrip(trip.id);
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
      <Card>
        <Text variant="title">{trip.destination}</Text>
        <Text variant="callout" color="textMuted" style={{ marginTop: 2 }}>
          {formatShortDate(trip.startDate)} – {formatShortDate(trip.endDate)} · {tripNights(trip.startDate, trip.endDate)} nights
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: space.md }}>
          {trip.forecastSummary && (
            <Badge
              label={`${formatTemp(trip.forecastSummary.minC, unit)}–${formatTemp(trip.forecastSummary.maxC, unit)}${trip.forecastSummary.rainy ? ' · rain likely' : ''}${trip.forecastSummary.source === 'estimate' ? ' · estimate' : ''}`}
              tone="sun"
            />
          )}
          {trip.activities.map((a) => (
            <Badge key={a} label={OCCASION_LABELS[a]} />
          ))}
          {trip.carryOnOnly && <Badge label="Carry-on" />}
          {trip.laundryAvailable && <Badge label="Laundry" />}
        </View>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, marginTop: space.lg, overflow: 'hidden' }}>
          <View style={{ width: `${trip.packingList.length ? (packed / trip.packingList.length) * 100 : 0}%`, height: '100%', backgroundColor: colors.accent }} />
        </View>
        <Text variant="caption" color="textMuted" style={{ marginTop: 6 }}>
          {packed} of {trip.packingList.length} packed
        </Text>
      </Card>

      {planNotes.length > 0 && (
        <View style={{ gap: 6, marginTop: space.lg }}>
          {planNotes.map((n) => (
            <View key={n} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
              <Icon name="info" size={15} color={colors.textMuted} />
              <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
                {n}
              </Text>
            </View>
          ))}
        </View>
      )}

      <SectionHeader title="From your closet" action={busy ? undefined : 'Rebuild'} onAction={regenerate} />
      {clothes.length ? clothes.map(({ p, i }) => <PackRow key={`${p.itemId}-${i}`} entry={p} idx={i} tripId={trip.id} item={byId.get(p.itemId!)} onRemove={removeAt} />) : (
        <Text variant="body" color="textMuted">
          No closet pieces selected. Add clothes to your closet, then tap Rebuild.
        </Text>
      )}

      <SectionHeader title="Essentials" />
      {extras.map(({ p, i }) => (
        <PackRow key={`${p.label}-${i}`} entry={p} idx={i} tripId={trip.id} onRemove={removeAt} />
      ))}
      <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-end', marginTop: space.md }}>
        <View style={{ flex: 1 }}>
          <TextField placeholder="Add something else" value={custom} onChangeText={setCustom} returnKeyType="done" onSubmitEditing={() => {
            if (!custom.trim()) return;
            setList([...trip.packingList, { label: custom.trim(), quantity: 1, packed: false, custom: true }]);
            setCustom('');
          }} />
        </View>
        <Button
          label="Add"
          size="sm"
          disabled={!custom.trim()}
          onPress={() => {
            setList([...trip.packingList, { label: custom.trim(), quantity: 1, packed: false, custom: true }]);
            setCustom('');
          }}
          style={{ minHeight: 48 }}
        />
      </View>
    </Screen>
  );
}

function PackRow({ entry, idx, tripId, item, onRemove }: { entry: PackingEntry; idx: number; tripId: string; item?: ClothingItem; onRemove: (idx: number) => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm }}>
      <Pressable
        onPress={() => {
          haptic.tap();
          useStore.getState().togglePacked(tripId, idx);
        }}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: entry.packed }}
        accessibilityLabel={`${entry.label}${entry.quantity > 1 ? `, ${entry.quantity}` : ''}`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, flex: 1, minHeight: 48 }}
      >
        <View style={{ width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: entry.packed ? colors.accent : colors.borderStrong, backgroundColor: entry.packed ? colors.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          {entry.packed && <Icon name="check" size={15} color={colors.onAccent} strokeWidth={2.6} />}
        </View>
        {item && <GarmentImage item={item} size={44} rounded={radius.sm} />}
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" style={{ textDecorationLine: entry.packed ? 'line-through' : 'none', opacity: entry.packed ? 0.55 : 1 }}>
            {entry.label}
            {entry.quantity > 1 ? ` × ${entry.quantity}` : ''}
          </Text>
          {item && (
            <Text variant="caption" color="textMuted">
              {getCategory(item.categoryId).label}
              {!item.clean ? ' · wash before you go' : ''}
            </Text>
          )}
        </View>
      </Pressable>
      <IconButton icon="x" label={`Remove ${entry.label}`} size={36} color={colors.textSubtle} onPress={() => onRemove(idx)} />
    </View>
  );
}
