import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { DateStrip } from '@/components/DateStrip';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { toast } from '@/components/Toast';
import { Button, Chip, FieldLabel, NavHeader, ToggleRow } from '@/components/ui';
import { buildPackingList, tripNights } from '@/engine/packing';
import { OCCASION_LABELS } from '@/engine/scoring';
import { tripForecast } from '@/features/trips/forecast';
import { CitySearch } from '@/features/weather/CitySearch';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import type { Occasion, SavedLocation } from '@/types/models';
import { addDays, toISODate } from '@/utils/dates';

const ACTIVITIES: Occasion[] = ['everyday', 'work', 'outdoors', 'workout', 'date', 'party', 'formalEvent', 'interview'];

export default function NewTrip() {
  const { colors } = useTheme();
  const [dest, setDest] = useState<SavedLocation | undefined>();
  const [start, setStart] = useState(addDays(toISODate(), 7));
  const [end, setEnd] = useState(addDays(toISODate(), 10));
  const [activities, setActivities] = useState<Occasion[]>(['everyday']);
  const [laundry, setLaundry] = useState(false);
  const [carryOn, setCarryOn] = useState(true);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (!dest) {
      toast({ message: 'Choose a destination first', icon: 'info' });
      return;
    }
    setBusy(true);
    try {
      const forecastSummary = await tripForecast(dest.latitude, dest.longitude, start, end);
      const { items, preferences } = useStore.getState();
      const plan = buildPackingList({
        items,
        trip: { startDate: start, endDate: end, activities, laundryAvailable: laundry, carryOnOnly: carryOn },
        forecast: forecastSummary,
        customCategories: preferences.customCategories,
        clothesFor: preferences.clothesFor,
        includeDirty: true,
      });
      const id = useStore.getState().upsertTrip({
        destination: dest.name,
        latitude: dest.latitude,
        longitude: dest.longitude,
        startDate: start,
        endDate: end,
        activities,
        laundryAvailable: laundry,
        carryOnOnly: carryOn,
        packingList: plan.entries,
        forecastSummary,
      });
      router.replace({ pathname: '/trip/[id]', params: { id, notes: JSON.stringify(plan.notes) } });
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <NavHeader title="New trip" onBack={() => router.back()} backIcon="x" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <FieldLabel>Destination</FieldLabel>
        {dest ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.accentSoft }}>
            <Icon name="pin" color={colors.accent} />
            <Text variant="bodyStrong" style={{ flex: 1 }}>
              {dest.name}
            </Text>
            <Button label="Change" size="sm" variant="ghost" onPress={() => setDest(undefined)} />
          </View>
        ) : (
          <CitySearch onPick={setDest} showDevice={false} />
        )}

        <FieldLabel>Leaving</FieldLabel>
        <DateStrip
          value={start}
          onChange={(d) => {
            setStart(d);
            if (end < d) setEnd(addDays(d, 2));
          }}
        />
        <FieldLabel>{`Coming back · ${tripNights(start, end)} nights`}</FieldLabel>
        <DateStrip value={end} onChange={setEnd} start={start} min={start} days={60} />

        <FieldLabel>What will you be doing?</FieldLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {ACTIVITIES.map((a) => (
            <Chip key={a} label={OCCASION_LABELS[a]} size="sm" selected={activities.includes(a)} onPress={() => setActivities((l) => (l.includes(a) ? l.filter((x) => x !== a) : [...l, a]))} />
          ))}
        </View>

        <View style={{ marginTop: space.lg }}>
          <ToggleRow first title="Carry-on only" subtitle="Pack tighter, repeat more" value={carryOn} onChange={setCarryOn} />
          <ToggleRow title="Laundry available" subtitle="Plan around washing mid-trip" value={laundry} onChange={setLaundry} />
        </View>

        <Text variant="caption" color="textMuted" style={{ marginTop: space.lg }}>
          Uses the destination forecast when your trip is within 16 days; otherwise a seasonal estimate.
        </Text>
        <Button label="Build packing list" icon="suitcase" loading={busy} disabled={!dest} onPress={create} style={{ marginTop: space.lg }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
