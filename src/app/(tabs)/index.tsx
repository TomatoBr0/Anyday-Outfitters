import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { toast } from '@/components/Toast';
import { Badge, Button, Card, Chip, EmptyState, IconButton, Screen, SectionHeader } from '@/components/ui';
import { getCategory } from '@/engine/categories';
import { generateOutfits } from '@/engine/generate';
import { OCCASION_LABELS } from '@/engine/scoring';
import type { Recommendation } from '@/engine/types';
import { useEngineContext } from '@/features/outfits/engineContext';
import { OutfitBoard, OutfitStrip } from '@/features/outfits/OutfitBoard';
import { WeatherCard } from '@/features/weather/WeatherCard';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import type { ClothingItem, ID, Occasion } from '@/types/models';
import { formatLongDate, greeting, toISODate } from '@/utils/dates';
import { haptic } from '@/utils/haptics';

const QUICK_OCCASIONS: Occasion[] = ['everyday', 'work', 'class', 'date', 'workout', 'outdoors', 'party', 'formalEvent'];

export default function Today() {
  const { colors } = useTheme();
  const today = toISODate();
  const items = useStore((s) => s.items);
  const events = useStore((s) => s.events);
  const wearLogs = useStore((s) => s.wearLogs);
  const outfits = useStore((s) => s.outfits);
  const name = useStore((s) => s.preferences.displayName);
  const weatherStatus = useStore((s) => s.weatherStatus);

  const todaysEvents = useMemo(
    () => events.filter((e) => e.date === today).sort((a, b) => (a.time ?? '').localeCompare(b.time ?? '')),
    [events, today],
  );
  const mainEvent = todaysEvents[0];

  const [chosenOccasion, setOccasion] = useState<Occasion | undefined>();
  const occasion: Occasion = chosenOccasion ?? mainEvent?.occasion ?? 'everyday';
  const [locked, setLocked] = useState<ID[]>([]);
  const [shown, setShown] = useState<string[]>([]);
  const [seed, setSeed] = useState(1);
  const [hero, setHero] = useState(0);

  const ctx = useEngineContext({
    occasion,
    targetFormality: mainEvent && mainEvent.occasion === occasion ? mainEvent.formality : undefined,
    lockedItemIds: locked,
    excludeSignatures: shown,
    seed,
  });
  const result = useMemo(() => generateOutfits(ctx, { count: 5 }), [ctx]);
  const rec: Recommendation | undefined = result.outfits[hero] ?? result.outfits[0];
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const recItems = (r?: Recommendation) => (r ? (r.itemIds.map((id) => byId.get(id)).filter(Boolean) as ClothingItem[]) : []);

  const wornToday = wearLogs.find((l) => l.date === today);
  const plannedOutfit = mainEvent?.outfitId ? outfits.find((o) => o.id === mainEvent.outfitId) : undefined;
  const dirtyCount = items.filter((i) => !i.clean).length;

  const regenerate = () => {
    haptic.impact();
    setShown((s) => [...s, ...result.outfits.map((o) => o.signature)].slice(-60));
    setSeed((s) => s + 1);
    setHero(0);
  };

  const wear = (r: Recommendation) => {
    const log = useStore.getState().wearOutfit(r.itemIds);
    haptic.success();
    toast({ message: 'Logged. Have a great day.', icon: 'check', action: { label: 'Undo', onPress: () => useStore.getState().undoWear(log.id) } });
    setLocked([]);
  };

  const save = (r: Recommendation) => {
    useStore.getState().saveOutfit(r.itemIds, { name: r.title, reasons: r.reasons, score: r.score, occasion });
    haptic.success();
    toast({ message: 'Saved to your outfits', icon: 'bookmarkFill' });
  };

  const feedback = (r: Recommendation, kind: 'like' | 'dislike' | 'notMyStyle') => {
    useStore.getState().addFeedback(r.itemIds, kind);
    if (kind === 'like') {
      haptic.success();
      toast({ message: 'Noted — more like this', icon: 'thumbUp' });
    } else {
      toast({ message: kind === 'notMyStyle' ? 'Got it — less of this style' : 'Got it — showing something else', icon: 'refresh' });
      regenerate();
    }
  };

  const onItemPress = (item: ClothingItem) => {
    const isLocked = locked.includes(item.id);
    const slot = getCategory(item.categoryId).slot;
    Alert.alert(item.name, undefined, [
      {
        text: isLocked ? 'Unlock' : 'Lock & build around it',
        onPress: () => {
          haptic.tap();
          setLocked((l) => (isLocked ? l.filter((x) => x !== item.id) : [...l, item.id]));
          setShown([]);
          setHero(0);
        },
      },
      { text: 'Swap this piece', onPress: () => router.push({ pathname: '/create', params: { items: rec!.itemIds.join(','), focus: slot } }) },
      { text: 'View item', onPress: () => router.push(`/item/${item.id}`) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // --------------------------------------------------------------- render

  const header = (
    <View style={{ paddingTop: space.lg, paddingBottom: space.lg }}>
      <Text variant="overline" color="textMuted">
        {formatLongDate(today)}
      </Text>
      <Text variant="display" accessibilityRole="header" style={{ marginTop: 4 }}>
        {greeting()}
        {name ? `, ${name}` : ''}.
      </Text>
    </View>
  );

  if (!items.length) {
    return (
      <Screen tabBarSpace>
        {header}
        <WeatherCard weather={ctx.weather} />
        <EmptyState
          icon="hanger"
          title="Your closet is empty"
          body="Add a few pieces — or load the sample closet — and your first outfit appears here."
          action={
            <View style={{ gap: space.sm, alignItems: 'center' }}>
              <Button label="Add clothes" icon="camera" onPress={() => router.push('/item/add')} />
              <Button label="Try the sample closet" variant="ghost" onPress={() => useStore.getState().loadSamples()} />
            </View>
          }
        />
      </Screen>
    );
  }

  return (
    <Screen
      tabBarSpace
      refreshControl={<RefreshControl refreshing={weatherStatus === 'loading'} onRefresh={() => useStore.getState().refreshWeather(true)} tintColor={colors.textMuted} />}
    >
      {header}
      <WeatherCard weather={ctx.weather} />

      {mainEvent && (
        <Pressable
          onPress={() => router.push({ pathname: '/event/edit', params: { id: mainEvent.id } })}
          accessibilityRole="button"
          style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.md, padding: space.md, borderRadius: radius.md, backgroundColor: colors.accentSoft }}
        >
          <Icon name="calendar" size={18} color={colors.accent} />
          <Text variant="callout" style={{ flex: 1 }} numberOfLines={1}>
            {mainEvent.time ? `${mainEvent.time} · ` : ''}
            {mainEvent.title}
          </Text>
          <Badge label={OCCASION_LABELS[mainEvent.occasion]} tone="accent" />
        </Pressable>
      )}

      {wornToday ? (
        <WornToday logId={wornToday.id} items={wornToday.itemIds.map((id) => byId.get(id)).filter(Boolean) as ClothingItem[]} />
      ) : (
        <>
          <View style={{ marginHorizontal: -space.xl, marginTop: space.xl }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.xl }}>
              {QUICK_OCCASIONS.map((o) => (
                <Chip
                  key={o}
                  label={OCCASION_LABELS[o]}
                  size="sm"
                  selected={occasion === o}
                  onPress={() => {
                    setOccasion(o);
                    setShown([]);
                    setHero(0);
                  }}
                />
              ))}
            </ScrollView>
          </View>

          {plannedOutfit && (
            <Card style={{ marginTop: space.lg }} onPress={() => router.push(`/outfit/${plannedOutfit.id}`)} accessibilityLabel="Planned outfit for today">
              <Text variant="overline" color="sun">
                Planned for {mainEvent?.title}
              </Text>
              <View style={{ marginTop: space.sm }}>
                <OutfitStrip items={plannedOutfit.itemIds.map((id) => byId.get(id)).filter(Boolean) as ClothingItem[]} />
              </View>
            </Card>
          )}

          {rec ? (
            <Animated.View key={rec.signature} entering={FadeIn.duration(260)}>
              <Card style={{ marginTop: space.lg, padding: space.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 4, paddingBottom: space.md }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="overline" color="sun">
                      {hero === 0 ? 'Today’s pick' : `Option ${hero + 1}`}
                    </Text>
                    <Text variant="title" style={{ marginTop: 2 }}>
                      {rec.title}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row' }}>
                    <IconButton icon="bookmark" label="Save outfit" onPress={() => save(rec)} />
                    <IconButton icon="refresh" label="New outfit" onPress={regenerate} />
                  </View>
                </View>

                <OutfitBoard items={recItems(rec)} lockedIds={locked} onItemPress={onItemPress} />

                <View style={{ paddingHorizontal: 4, paddingTop: space.md, gap: 6 }}>
                  {rec.reasons.map((r) => (
                    <View key={r} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Icon name="check" size={15} color={colors.accent} strokeWidth={2.2} />
                      <Text variant="caption" color="textMuted">
                        {r}
                      </Text>
                    </View>
                  ))}
                  {rec.warnings.map((w) => (
                    <View key={w} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Icon name="info" size={15} color={colors.warning} />
                      <Text variant="caption" style={{ color: colors.warning, flex: 1 }}>
                        {w}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.lg }}>
                  <Button label="Wear today" icon="check" style={{ flex: 1 }} onPress={() => wear(rec)} />
                  <IconButton icon="thumbUp" label="I like this" background={colors.surfaceAlt} size={48} onPress={() => feedback(rec, 'like')} />
                  <IconButton icon="thumbDown" label="Not this one" background={colors.surfaceAlt} size={48} onPress={() => feedback(rec, 'dislike')} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space.sm }}>
                  <Pressable onPress={() => router.push({ pathname: '/create', params: { items: rec.itemIds.join(',') } })} hitSlop={8} style={{ minHeight: 40, justifyContent: 'center' }} accessibilityRole="button">
                    <Text variant="label" color="accent">
                      Customize
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => feedback(rec, 'notMyStyle')} hitSlop={8} style={{ minHeight: 40, justifyContent: 'center' }} accessibilityRole="button">
                    <Text variant="label" color="textMuted">
                      Not my style
                    </Text>
                  </Pressable>
                </View>
                {locked.length > 0 && (
                  <Text variant="caption" color="textMuted" style={{ marginTop: 4, paddingHorizontal: 4 }}>
                    {locked.length} locked — new outfits keep {locked.length === 1 ? 'it' : 'them'}.
                  </Text>
                )}
              </Card>
            </Animated.View>
          ) : (
            <Card style={{ marginTop: space.lg }}>
              <Text variant="heading">Can’t build a full outfit yet</Text>
              {result.issues.map((i, k) => (
                <Text key={k} variant="body" color="textMuted" style={{ marginTop: 6 }}>
                  {'message' in i ? i.message : ''}
                </Text>
              ))}
              <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.lg, flexWrap: 'wrap' }}>
                <Button label="Add clothes" size="sm" icon="plus" onPress={() => router.push('/item/add')} />
                {dirtyCount > 0 && <Button label="Open laundry" size="sm" variant="secondary" icon="basket" onPress={() => router.push('/laundry')} />}
              </View>
            </Card>
          )}

          {result.outfits.length > 1 && (
            <>
              <SectionHeader title="Other options" />
              <View style={{ marginHorizontal: -space.xl }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.md, paddingHorizontal: space.xl }}>
                  {result.outfits.map((o, idx) =>
                    idx === hero ? null : (
                      <Animated.View key={o.signature} entering={FadeInDown.delay(idx * 40).duration(240)}>
                        <Card
                          padded={false}
                          style={{ width: 168, padding: space.sm }}
                          onPress={() => {
                            haptic.tap();
                            setHero(idx);
                          }}
                          accessibilityLabel={`${o.title}: ${recItems(o).map((i) => i.name).join(', ')}`}
                        >
                          <OutfitBoard items={recItems(o).filter((i) => getCategory(i.categoryId).slot !== 'accessory')} compact />
                          <Text variant="label" numberOfLines={1} style={{ marginTop: space.sm, paddingHorizontal: 2 }}>
                            {o.title}
                          </Text>
                        </Card>
                      </Animated.View>
                    ),
                  )}
                </ScrollView>
              </View>
            </>
          )}
        </>
      )}

      {dirtyCount > 0 && (
        <Card style={{ marginTop: space.xxl, flexDirection: 'row', alignItems: 'center', gap: space.md }} onPress={() => router.push('/laundry')} accessibilityLabel={`${dirtyCount} items in the hamper. Open laundry`}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="basket" size={20} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">
              {dirtyCount} {dirtyCount === 1 ? 'piece' : 'pieces'} in the hamper
            </Text>
            <Text variant="caption" color="textMuted">
              Mark them clean when laundry’s done
            </Text>
          </View>
          <Icon name="chevronRight" size={18} color={colors.textSubtle} />
        </Card>
      )}
    </Screen>
  );
}

function WornToday({ logId, items }: { logId: ID; items: ClothingItem[] }) {
  const { colors } = useTheme();
  return (
    <Animated.View entering={FadeInDown.duration(260)}>
      <Card style={{ marginTop: space.xl, padding: space.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: 4, paddingBottom: space.md }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={16} color={colors.accent} strokeWidth={2.4} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="overline" color="accent">
              You’re dressed
            </Text>
            <Text variant="title">Today’s outfit</Text>
          </View>
        </View>
        <OutfitBoard items={items} />
        <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.lg }}>
          <Button
            label="Change outfit"
            variant="secondary"
            style={{ flex: 1 }}
            onPress={() => {
              useStore.getState().undoWear(logId);
              toast({ message: 'Cleared — pick another look', icon: 'refresh' });
            }}
          />
          <Button label="Plan tomorrow" variant="ghost" icon="calendar" onPress={() => router.push('/plan')} />
        </View>
      </Card>
    </Animated.View>
  );
}
