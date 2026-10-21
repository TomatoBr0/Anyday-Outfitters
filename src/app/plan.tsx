import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { Badge, Button, Card, EmptyState, IconButton, NavHeader, PageHeader, Screen, SectionHeader, Segmented } from '@/components/ui';
import { getCategory } from '@/engine/categories';
import { generateOutfits } from '@/engine/generate';
import { OCCASION_LABELS } from '@/engine/scoring';
import { tripNights } from '@/engine/packing';
import { useEngineContext } from '@/features/outfits/engineContext';
import { OutfitStrip } from '@/features/outfits/OutfitBoard';
import { CONDITION_ICON } from '@/features/weather/WeatherCard';
import { dayFromForecast, formatTemp } from '@/services/weather';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import type { ClothingItem, ISODate, PlannedEvent, Trip } from '@/types/models';
import { formatLongDate, formatShortDate, monthGrid, toISODate } from '@/utils/dates';
import { haptic } from '@/utils/haptics';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function Plan() {
  const [tab, setTab] = useState<'calendar' | 'trips'>('calendar');
  return (
    <Screen edges={['top', 'bottom']} header={<NavHeader onBack={() => router.back()} />}>
      <PageHeader
        title="Plan"
        subtitle={tab === 'calendar' ? 'Events and outfits ahead' : 'Pack from your own closet'}
        right={
          tab === 'trips' ? (
            <IconButton icon="plus" label="New trip" onPress={() => router.push('/trip/new')} />
          ) : (
            <IconButton icon="plus" label="New event" onPress={() => router.push('/event/edit')} />
          )
        }
      />
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'calendar', label: 'Calendar' },
          { value: 'trips', label: 'Trips' },
        ]}
      />
      {tab === 'calendar' ? <CalendarView /> : <TripsView />}
    </Screen>
  );
}

function CalendarView() {
  const { colors } = useTheme();
  const today = toISODate();
  const [selected, setSelected] = useState<ISODate>(today);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const events = useStore((s) => s.events);
  const logs = useStore((s) => s.wearLogs);
  const outfits = useStore((s) => s.outfits);
  const items = useStore((s) => s.items);
  const forecast = useStore((s) => s.forecast);
  const unit = useStore((s) => s.preferences.tempUnit);
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const cells = useMemo(() => monthGrid(cursor.y, cursor.m), [cursor]);
  const eventDays = useMemo(() => new Set(events.map((e) => e.date)), [events]);
  const wornDays = useMemo(() => new Set(logs.map((l) => l.date)), [logs]);
  const dayEvents = events.filter((e) => e.date === selected).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));
  const dayLog = logs.find((l) => l.date === selected);
  const dayWeather = dayFromForecast(forecast?.source === 'estimate' ? undefined : forecast, selected);
  const isFuture = selected >= today;

  const monthLabel = new Date(cursor.y, cursor.m, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const shift = (n: number) => {
    const d = new Date(cursor.y, cursor.m + n, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };

  return (
    <View>
      <Card style={{ marginTop: space.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.sm }}>
          <IconButton icon="chevronLeft" label="Previous month" onPress={() => shift(-1)} size={40} />
          <Text variant="heading">{monthLabel}</Text>
          <IconButton icon="chevronRight" label="Next month" onPress={() => shift(1)} size={40} />
        </View>
        <View style={{ flexDirection: 'row' }}>
          {WEEKDAYS.map((d, i) => (
            <Text key={i} variant="label" color="textSubtle" align="center" style={{ flex: 1 }}>
              {d}
            </Text>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: space.xs }}>
          {cells.map((c, i) => {
            if (!c) return <View key={i} style={{ width: `${100 / 7}%`, height: 46 }} />;
            const sel = c === selected;
            const isToday = c === today;
            const day = Number(c.slice(8));
            return (
              <Pressable
                key={c}
                onPress={() => {
                  haptic.tap();
                  setSelected(c);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: sel }}
                accessibilityLabel={`${formatLongDate(c)}${eventDays.has(c) ? ', has events' : ''}${wornDays.has(c) ? ', outfit logged' : ''}`}
                style={{ width: `${100 / 7}%`, height: 46, alignItems: 'center', justifyContent: 'center' }}
              >
                <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: sel ? colors.primary : 'transparent', borderWidth: isToday && !sel ? 1 : 0, borderColor: colors.text }}>
                  <Text variant="callout" style={{ color: sel ? colors.onPrimary : c < today ? colors.textMuted : colors.text }}>
                    {day}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 3, position: 'absolute', bottom: 2 }}>
                  {eventDays.has(c) && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.sun }} />}
                  {wornDays.has(c) && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent }} />}
                </View>
              </Pressable>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', gap: space.lg, marginTop: space.sm, justifyContent: 'center' }}>
          <Legend color={colors.sun} label="Event" />
          <Legend color={colors.accent} label="Outfit worn" />
        </View>
      </Card>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.xxl, marginBottom: space.md }}>
        <View style={{ flex: 1 }}>
          <Text variant="title" style={{ fontSize: 20, lineHeight: 26 }} accessibilityRole="header">
            {selected === today ? 'Today' : formatLongDate(selected)}
          </Text>
        </View>
        {dayWeather && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} accessible accessibilityLabel={`High ${formatTemp(dayWeather.highC, unit)}, low ${formatTemp(dayWeather.lowC, unit)}`}>
            <Icon name={CONDITION_ICON[dayWeather.condition]} size={18} color={colors.sun} />
            <Text variant="label" color="textMuted">
              {formatTemp(dayWeather.highC, unit)} / {formatTemp(dayWeather.lowC, unit)}
            </Text>
          </View>
        )}
      </View>

      {dayEvents.map((e) => (
        <EventCard key={e.id} event={e} byId={byId} outfitIds={outfits.find((o) => o.id === e.outfitId)?.itemIds} />
      ))}

      {dayLog && (
        <Card style={{ marginBottom: space.md }}>
          <Text variant="overline" color="accent">
            Worn
          </Text>
          <View style={{ marginTop: space.sm }}>
            <OutfitStrip items={dayLog.itemIds.map((id) => byId.get(id)).filter(Boolean) as ClothingItem[]} />
          </View>
        </Card>
      )}

      {!dayEvents.length && !dayLog && (
        <Text variant="body" color="textMuted" style={{ marginBottom: space.md }}>
          {isFuture ? 'Nothing planned yet.' : 'No outfit logged this day.'}
        </Text>
      )}

      {isFuture && (
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Button label="Add event" icon="calendar" variant="secondary" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/event/edit', params: { date: selected } })} />
          <Button label="Plan outfit" icon="sparkles" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/create', params: { date: selected } })} />
        </View>
      )}
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
    </View>
  );
}

function EventCard({ event, byId, outfitIds }: { event: PlannedEvent; byId: Map<string, ClothingItem>; outfitIds?: string[] }) {
  const { colors } = useTheme();
  const ctx = useEngineContext({ date: event.date, occasion: event.occasion, targetFormality: event.formality });
  const suggestion = useMemo(() => (outfitIds ? undefined : generateOutfits(ctx, { count: 1 }).outfits[0]), [ctx, outfitIds]);
  const shown = (outfitIds ?? suggestion?.itemIds ?? []).map((id) => byId.get(id)).filter(Boolean) as ClothingItem[];
  return (
    <Card style={{ marginBottom: space.md }} onPress={() => router.push({ pathname: '/event/edit', params: { id: event.id } })} accessibilityLabel={`${event.title}, edit event`}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: space.md }}>
        <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: colors.sun }} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="heading">{event.title}</Text>
          <Text variant="caption" color="textMuted">
            {[event.time, event.location].filter(Boolean).join(' · ') || 'All day'}
          </Text>
          <Badge label={OCCASION_LABELS[event.occasion]} tone="sun" />
        </View>
      </View>
      {shown.length > 0 && (
        <View style={{ marginTop: space.md, gap: 6 }}>
          <Text variant="overline" color={outfitIds ? 'accent' : 'textSubtle'}>
            {outfitIds ? 'Planned outfit' : 'Suggested'}
          </Text>
          <OutfitStrip items={shown.filter((i) => getCategory(i.categoryId).slot !== 'accessory')} size={52} />
        </View>
      )}
      <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
        <Button
          size="sm"
          label={outfitIds ? 'Change outfit' : 'Plan this outfit'}
          variant={outfitIds ? 'secondary' : 'primary'}
          onPress={() => router.push({ pathname: '/create', params: { eventId: event.id, items: (outfitIds ?? suggestion?.itemIds ?? []).join(',') } })}
        />
      </View>
    </Card>
  );
}

function TripsView() {
  const trips = useStore((s) => s.trips);
  const today = toISODate();
  const sorted = [...trips].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const upcoming = sorted.filter((t) => t.endDate >= today);
  const past = sorted.filter((t) => t.endDate < today).reverse();

  if (!trips.length) {
    return (
      <EmptyState
        icon="suitcase"
        title="Going somewhere?"
        body="Add a trip and Getup builds a packing list from your closet, using the destination’s forecast."
        action={<Button label="Plan a trip" icon="suitcase" onPress={() => router.push('/trip/new')} />}
      />
    );
  }

  return (
    <View style={{ marginTop: space.lg }}>
      {upcoming.map((t) => (
        <TripCard key={t.id} t={t} />
      ))}
      {past.length > 0 && (
        <>
          <SectionHeader title="Past trips" />
          {past.map((t) => (
            <TripCard key={t.id} t={t} />
          ))}
        </>
      )}
      <Button label="Plan another trip" variant="secondary" icon="plus" onPress={() => router.push('/trip/new')} style={{ marginTop: space.sm }} />
    </View>
  );
}

function TripCard({ t }: { t: Trip }) {
  const { colors } = useTheme();
  const packed = t.packingList.filter((p) => p.packed).length;
  const total = t.packingList.length;
  return (
    <Card style={{ marginBottom: space.md }} onPress={() => router.push(`/trip/${t.id}`)} accessibilityLabel={`${t.destination}, ${packed} of ${total} packed`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.sunSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="suitcase" color={colors.sun} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="heading">{t.destination}</Text>
          <Text variant="caption" color="textMuted">
            {formatShortDate(t.startDate)} – {formatShortDate(t.endDate)} · {tripNights(t.startDate, t.endDate)} nights
          </Text>
        </View>
        <Text variant="label" color={packed === total && total ? 'accent' : 'textMuted'}>
          {packed}/{total}
        </Text>
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, marginTop: space.md, overflow: 'hidden' }}>
        <View style={{ width: `${total ? (packed / total) * 100 : 0}%`, height: '100%', backgroundColor: colors.accent }} />
      </View>
    </Card>
  );
}
