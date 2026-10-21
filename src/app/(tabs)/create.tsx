/**
 * Outfit builder. Pick pieces slot by slot (ranked by how well they fit with
 * what's already chosen), lock favorites, and let the engine fill the rest.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { GarmentImage } from '@/components/GarmentImage';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { toast } from '@/components/Toast';
import { Button, Card, Chip, EmptyState, IconButton, PageHeader, Screen, Segmented } from '@/components/ui';
import { getCategory } from '@/engine/categories';
import { generateOutfits, scoreOutfit, swapCandidates } from '@/engine/generate';
import { OCCASION_LABELS, buildAffinity } from '@/engine/scoring';
import { useEngineContext } from '@/features/outfits/engineContext';
import { OutfitBoard } from '@/features/outfits/OutfitBoard';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import type { ClothingItem, ID, Occasion, Slot } from '@/types/models';
import { formatShortDate } from '@/utils/dates';
import { haptic } from '@/utils/haptics';

type CoreSlot = Exclude<Slot, 'accessory'>;
const SLOT_LABEL: Record<Slot, string> = {
  outerwear: 'Outer layer',
  top: 'Top',
  onePiece: 'Dress / set',
  bottom: 'Bottom',
  footwear: 'Shoes',
  accessory: 'Accessories',
};

type Params = { items?: string; lock?: string; focus?: string; eventId?: string; date?: string };

/** Re-mount the builder whenever it's opened with new parameters. */
export default function CreateRoute() {
  const params = useLocalSearchParams<Params>();
  const key = [params.items, params.lock, params.focus, params.eventId, params.date].join('|');
  return <Builder key={key} params={params} />;
}

function Builder({ params }: { params: Params }) {
  const { colors } = useTheme();
  const items = useStore((s) => s.items);
  const custom = useStore((s) => s.preferences.customCategories);
  const event = useStore((s) => (params.eventId ? s.events.find((e) => e.id === params.eventId) : undefined));
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const slotOf = (i: ClothingItem) => getCategory(i.categoryId, custom).slot;

  // Initial selection from params (Customize / Swap / Build around item / Plan for event).
  const [initial] = useState(() => {
    const next: Partial<Record<CoreSlot, ID>> = {};
    const acc: ID[] = [];
    for (const id of (params.items ?? '').split(',').filter(Boolean)) {
      const it = byId.get(id);
      if (!it) continue;
      const s = slotOf(it);
      if (s === 'accessory') acc.push(id);
      else next[s] = id;
    }
    return { chosen: next, acc };
  });
  const [mode, setMode] = useState<'separates' | 'onePiece'>(initial.chosen.onePiece ? 'onePiece' : 'separates');
  const [chosen, setChosen] = useState<Partial<Record<CoreSlot, ID>>>(initial.chosen);
  const [accessories, setAccessories] = useState<ID[]>(initial.acc);
  const [locked, setLocked] = useState<ID[]>(params.lock ? [params.lock] : []);
  const [active, setActive] = useState<Slot | undefined>(params.focus as Slot | undefined);
  const [chosenOccasion, setOccasion] = useState<Occasion | undefined>();
  const occasion: Occasion = chosenOccasion ?? event?.occasion ?? 'everyday';
  const [seed, setSeed] = useState(1);

  const ctx = useEngineContext({ occasion, date: params.date ?? event?.date, targetFormality: event?.formality, seed });
  const slots: Slot[] = mode === 'separates' ? ['outerwear', 'top', 'bottom', 'footwear', 'accessory'] : ['outerwear', 'onePiece', 'footwear', 'accessory'];

  const current: ClothingItem[] = useMemo(() => {
    const coreIds = slots.filter((s) => s !== 'accessory').map((s) => chosen[s as CoreSlot]).filter(Boolean) as ID[];
    return [...coreIds, ...accessories].map((id) => byId.get(id)).filter(Boolean) as ClothingItem[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosen, accessories, byId, mode]);

  const live = useMemo(() => (current.length >= 2 ? scoreOutfit(current, ctx, buildAffinity(ctx)) : undefined), [current, ctx]);
  const candidates = useMemo(() => (active ? swapCandidates(current, active, { ...ctx, allowUnavailable: false }, 20) : []), [active, current, ctx]);

  const pick = (slot: Slot, id: ID) => {
    haptic.tap();
    if (slot === 'accessory') setAccessories((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id].slice(-3)));
    else setChosen((c) => ({ ...c, [slot]: c[slot as CoreSlot] === id ? undefined : id }));
  };

  const fill = (keepAll: boolean) => {
    const lockIds = keepAll ? current.map((i) => i.id) : locked;
    const res = generateOutfits({ ...ctx, lockedItemIds: lockIds, seed: seed + 1 }, { count: 1 });
    setSeed((s) => s + 1);
    const out = res.outfits[0];
    if (!out) {
      const issue = res.issues.find((i): i is Extract<typeof i, { message: string }> => 'message' in i);
      toast({ message: issue?.message ?? 'Not enough clean pieces to complete this', icon: 'info' });
      return;
    }
    haptic.impact();
    const next: Partial<Record<CoreSlot, ID>> = {};
    for (const [k, v] of Object.entries(out.bySlot)) if (k !== 'accessories') next[k as CoreSlot] = v as ID;
    setChosen(next);
    setAccessories(out.bySlot.accessories ?? []);
    setMode(next.onePiece ? 'onePiece' : 'separates');
  };

  const reset = () => {
    setChosen({});
    setAccessories([]);
    setLocked([]);
    setActive(undefined);
  };

  const save = () => {
    if (current.length < 2) return;
    const outfitId = useStore.getState().saveOutfit(current.map((i) => i.id), { reasons: live?.reasons, score: live ? Math.round(live.total * 100) : undefined, occasion });
    if (event) {
      useStore.getState().upsertEvent({ ...event, outfitId });
      toast({ message: `Planned for ${event.title}`, icon: 'calendar' });
      router.back();
      return;
    }
    haptic.success();
    toast({ message: 'Saved to your outfits', icon: 'bookmarkFill' });
  };

  const wear = () => {
    if (current.length < 2) return;
    const log = useStore.getState().wearOutfit(current.map((i) => i.id));
    haptic.success();
    toast({ message: 'Logged for today', icon: 'check', action: { label: 'Undo', onPress: () => useStore.getState().undoWear(log.id) } });
    router.navigate('/');
  };

  if (!items.length) {
    return (
      <Screen tabBarSpace>
        <PageHeader title="Create" />
        <EmptyState icon="hanger" title="Nothing to style yet" body="Add a few pieces to your closet, then build outfits here." action={<Button label="Add clothes" icon="camera" onPress={() => router.push('/item/add')} />} />
      </Screen>
    );
  }

  return (
    <Screen tabBarSpace>
      <PageHeader
        title="Create"
        overline={event ? `For ${event.title} · ${formatShortDate(event.date)}` : undefined}
        subtitle={event ? undefined : 'Build a look piece by piece'}
        right={<IconButton icon="refresh" label="Start over" onPress={reset} />}
      />

      <Segmented
        value={mode}
        onChange={(m) => {
          setMode(m);
          setActive(undefined);
        }}
        options={[
          { value: 'separates', label: 'Top + bottom' },
          { value: 'onePiece', label: 'Dress / set' },
        ]}
      />

      <View style={{ marginHorizontal: -space.xl, marginTop: space.md }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.xl }}>
          {(Object.keys(OCCASION_LABELS) as Occasion[]).map((o) => (
            <Chip key={o} label={OCCASION_LABELS[o]} size="sm" selected={occasion === o} onPress={() => setOccasion(o)} />
          ))}
        </ScrollView>
      </View>

      <View style={{ gap: space.sm, marginTop: space.lg }}>
        {slots.map((slot) => {
          const ids = slot === 'accessory' ? accessories : chosen[slot as CoreSlot] ? [chosen[slot as CoreSlot]!] : [];
          const its = ids.map((id) => byId.get(id)).filter(Boolean) as ClothingItem[];
          const open = active === slot;
          const isLocked = its.length > 0 && its.every((i) => locked.includes(i.id));
          return (
            <View key={slot}>
              <Pressable
                onPress={() => setActive(open ? undefined : slot)}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                accessibilityLabel={`${SLOT_LABEL[slot]}: ${its.length ? its.map((i) => i.name).join(', ') : 'empty'}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.md,
                  padding: space.sm,
                  paddingRight: space.xs,
                  borderRadius: radius.lg,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: open ? colors.text : colors.border,
                }}
              >
                {its.length ? (
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {its.map((i) => (
                      <GarmentImage key={i.id} item={i} size={56} rounded={radius.sm} />
                    ))}
                  </View>
                ) : (
                  <View style={{ width: 56, height: 56, borderRadius: radius.sm, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="plus" size={20} color={colors.textSubtle} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text variant="overline" color="textSubtle">
                    {SLOT_LABEL[slot]}
                    {slot === 'outerwear' || slot === 'accessory' ? ' · optional' : ''}
                  </Text>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {its.length ? its.map((i) => i.name).join(', ') : 'Choose'}
                  </Text>
                </View>
                {its.length > 0 && slot !== 'accessory' && (
                  <IconButton
                    icon={isLocked ? 'lock' : 'unlock'}
                    label={isLocked ? 'Unlock' : 'Lock'}
                    color={isLocked ? colors.sun : colors.textSubtle}
                    onPress={() => setLocked((l) => (isLocked ? l.filter((x) => !ids.includes(x)) : [...l, ...ids]))}
                  />
                )}
                <Icon name={open ? 'chevronDown' : 'chevronRight'} size={18} color={colors.textSubtle} />
              </Pressable>
              {open && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.xl, marginTop: space.sm }} contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.xl }}>
                  {candidates.length === 0 && its.length === 0 && (
                    <Text variant="caption" color="textMuted" style={{ paddingVertical: space.lg }}>
                      No clean {SLOT_LABEL[slot].toLowerCase()} pieces. Check your laundry or add one.
                    </Text>
                  )}
                  {its.map((i) => (
                    <CandidateTile key={i.id} item={i} selected onPress={() => pick(slot, i.id)} />
                  ))}
                  {candidates.map((c) => (
                    <CandidateTile key={c.item.id} item={c.item} score={c.score} onPress={() => pick(slot, c.item.id)} />
                  ))}
                </ScrollView>
              )}
            </View>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.lg }}>
        <Button label="Fill the rest" icon="sparkles" variant="secondary" style={{ flex: 1 }} onPress={() => fill(true)} />
        <Button label="Shuffle unlocked" icon="refresh" variant="secondary" style={{ flex: 1 }} onPress={() => fill(false)} />
      </View>

      {current.length >= 2 && (
        <Card style={{ marginTop: space.xl, padding: space.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, paddingBottom: space.md }}>
            <Text variant="title">Preview</Text>
            {live && (
              <View accessible accessibilityLabel={`Match score ${Math.round(live.total * 100)} out of 100`} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.accentSoft }}>
                <Text variant="label" color="accent">
                  {Math.round(live.total * 100)} match
                </Text>
              </View>
            )}
          </View>
          <OutfitBoard items={current} lockedIds={locked} />
          {live && (
            <View style={{ gap: 6, marginTop: space.md, paddingHorizontal: 4 }}>
              {[...live.reasons].slice(0, 3).map((r) => (
                <View key={r} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Icon name="check" size={15} color={colors.accent} strokeWidth={2.2} />
                  <Text variant="caption" color="textMuted">
                    {r}
                  </Text>
                </View>
              ))}
              {live.warnings.map((w) => (
                <View key={w} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Icon name="info" size={15} color={colors.warning} />
                  <Text variant="caption" style={{ color: colors.warning, flex: 1 }}>
                    {w}
                  </Text>
                </View>
              ))}
              {current.some((i) => !i.clean || i.availability !== 'available') && (
                <Text variant="caption" style={{ color: colors.warning }}>
                  Includes something in the hamper or unavailable.
                </Text>
              )}
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.lg }}>
            <Button label={event ? 'Use for event' : 'Save'} icon={event ? 'calendar' : 'bookmark'} variant={event ? 'primary' : 'secondary'} style={{ flex: 1 }} onPress={save} />
            {!event && <Button label="Wear today" icon="check" style={{ flex: 1 }} onPress={wear} />}
          </View>
        </Card>
      )}
    </Screen>
  );
}

function CandidateTile({ item, score, selected, onPress }: { item: ClothingItem; score?: number; selected?: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={`${item.name}${score !== undefined ? `, match ${score}` : ''}${selected ? ', selected' : ''}`}
      style={({ pressed }) => ({ width: 104, opacity: pressed ? 0.8 : 1 })}
    >
      <View style={{ borderRadius: radius.md, borderWidth: 2, borderColor: selected ? colors.text : 'transparent', padding: 2 }}>
        <GarmentImage item={item} size={96} rounded={radius.sm} />
        {score !== undefined && (
          <View style={{ position: 'absolute', top: 6, left: 6, backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 }}>
            <Text variant="label" style={{ fontSize: 11 }}>
              {score}
            </Text>
          </View>
        )}
        {selected && (
          <View style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={13} color={colors.onPrimary} strokeWidth={2.6} />
          </View>
        )}
      </View>
      <Text variant="caption" numberOfLines={1} style={{ marginTop: 4 }}>
        {item.name}
      </Text>
    </Pressable>
  );
}
