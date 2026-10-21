/**
 * Add / edit a clothing item. Handles a queue of photos (batch import): each
 * photo gets rotate/crop controls, an on-device color suggestion, and a short
 * form. Only category is required — everything else has a sensible default.
 */
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GarmentGlyph } from '@/components/GarmentGlyph';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { toast } from '@/components/Toast';
import { Badge, Button, Chip, FieldLabel, IconButton, NavHeader, Stepper, TextField, ToggleRow } from '@/components/ui';
import type { PickedPhoto } from '@/features/closet/picker';
import { FIT_LABELS, FORMALITY_LABELS, PATTERN_LABELS, SEASON_LABELS, WARMTH_LABELS } from '@/features/closet/labels';
import { GROUP_LABELS, allCategories, getCategory } from '@/engine/categories';
import { COLORS } from '@/engine/colors';
import { STYLE_LABELS } from '@/engine/scoring';
import { suggestColors } from '@/services/colorSuggest';
import { persistImage, processImage, resolveImage } from '@/services/images';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import type { CategoryGroup, ClothingItem, Fit, Formality, Pattern, Season, StyleTag, Warmth } from '@/types/models';
import { haptic } from '@/utils/haptics';
import { newId } from '@/utils/id';

type Draft = Omit<ClothingItem, 'id' | 'createdAt' | 'updatedAt' | 'categoryId'> & { categoryId?: string };

function blankDraft(): Draft {
  return {
    name: '',
    categoryId: undefined,
    primaryColor: 'black',
    secondaryColors: [],
    pattern: 'solid',
    styleTags: [],
    formality: 2,
    warmth: 2,
    waterResistant: false,
    seasons: [],
    clean: true,
    availability: 'available',
    wearsBeforeWash: 1,
    wearsSinceWash: 0,
    wearCount: 0,
    favorite: false,
  };
}

export default function ItemEditor() {
  const params = useLocalSearchParams<{ id?: string; photos?: string; manual?: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const existing = useStore((s) => (params.id ? s.items.find((i) => i.id === params.id) : undefined));
  const custom = useStore((s) => s.preferences.customCategories);
  const prefsStyles = useStore((s) => s.preferences.styles);

  const queue: PickedPhoto[] = useMemo(() => {
    try {
      return params.photos ? JSON.parse(params.photos) : [];
    } catch {
      return [];
    }
  }, [params.photos]);
  const [index, setIndex] = useState(0);
  const photo = queue[index];

  const [draft, setDraft] = useState<Draft>(() => (existing ? { ...existing } : { ...blankDraft(), styleTags: prefsStyles.slice(0, 1) }));
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [rotation, setRotation] = useState(0);
  const [squareCrop, setSquareCrop] = useState(false);
  const [suggested, setSuggested] = useState<{ primary: string; secondary?: string } | undefined>();
  const [analyzing, setAnalyzing] = useState(!!photo);
  const [saving, setSaving] = useState(false);
  const [more, setMore] = useState(!!existing);
  const [group, setGroup] = useState<CategoryGroup>(existing ? getCategory(existing.categoryId, custom).group : 'tops');

  // Move through a batch, resetting per-photo state.
  const goTo = (i: number) => {
    setIndex(i);
    setRotation(0);
    setSquareCrop(false);
    setSuggested(undefined);
    setAnalyzing(true);
  };

  // On-device color suggestion for the current photo.
  useEffect(() => {
    if (!photo) return;
    let alive = true;
    suggestColors(photo.uri).then((s) => {
      if (!alive) return;
      setAnalyzing(false);
      if (s) {
        setSuggested(s);
        setDraft((d) => ({ ...d, primaryColor: s.primary, secondaryColors: s.secondary ? [s.secondary] : [] }));
      }
    });
    return () => {
      alive = false;
    };
  }, [photo]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setTouched((t) => new Set(t).add(key as string));
  };

  const chooseCategory = (id: string) => {
    haptic.tap();
    const cat = getCategory(id, custom);
    setDraft((d) => ({
      ...d,
      categoryId: id,
      // Category defaults fill anything the user hasn't explicitly set.
      formality: touched.has('formality') ? d.formality : cat.defaults.formality,
      warmth: touched.has('warmth') ? d.warmth : cat.defaults.warmth,
      wearsBeforeWash: touched.has('wearsBeforeWash') ? d.wearsBeforeWash : cat.defaults.wearsBeforeWash,
      waterResistant: touched.has('waterResistant') ? d.waterResistant : !!cat.defaults.waterResistant,
      styleTags: touched.has('styleTags') || !cat.defaults.styleTags ? d.styleTags : [...new Set([...cat.defaults.styleTags, ...d.styleTags])],
    }));
  };

  const toggleIn = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const save = async () => {
    if (!draft.categoryId) {
      toast({ message: 'Pick a category first', icon: 'info' });
      return;
    }
    setSaving(true);
    try {
      const id = existing?.id ?? newId();
      let imagePath = existing?.imagePath;
      if (photo) {
        let crop;
        if (squareCrop) {
          const w = rotation % 180 === 0 ? photo.width : photo.height;
          const h = rotation % 180 === 0 ? photo.height : photo.width;
          const side = Math.min(w, h);
          crop = { originX: Math.round((w - side) / 2), originY: Math.round((h - side) / 2), width: side, height: side };
        }
        const processed = await processImage(photo.uri, { width: photo.width, height: photo.height }, { rotate: rotation || undefined, crop });
        imagePath = await persistImage(processed.uri, id);
      }
      const name = draft.name.trim() || `${COLORS.find((c) => c.id === draft.primaryColor)?.label ?? ''} ${getCategory(draft.categoryId, custom).label.toLowerCase()}`.trim();
      const store = useStore.getState();
      if (existing) {
        store.updateItem(existing.id, { ...draft, categoryId: draft.categoryId, name, imagePath });
        toast({ message: 'Saved', icon: 'check' });
        router.back();
        return;
      }
      store.addItems([{ ...draft, categoryId: draft.categoryId, name, imagePath }]);
      haptic.success();
      if (index < queue.length - 1) {
        toast({ message: `Added ${name}`, icon: 'check' });
        goTo(index + 1);
        setDraft((d) => ({ ...blankDraft(), styleTags: d.styleTags, categoryId: d.categoryId }));
        setTouched(new Set());
      } else {
        toast({ message: queue.length > 1 ? `Added ${queue.length} pieces` : `Added ${name}`, icon: 'check' });
        router.back();
      }
    } catch {
      toast({ message: 'Couldn’t save that photo. Try again.', icon: 'info' });
    } finally {
      setSaving(false);
    }
  };

  const skipPhoto = () => {
    if (index < queue.length - 1) goTo(index + 1);
    else router.back();
  };

  const groupCats = allCategories(custom).filter((c) => c.group === group);
  const previewUri = photo?.uri ?? resolveImage(existing?.imagePath);
  const title = existing ? 'Edit item' : queue.length > 1 ? `Item ${index + 1} of ${queue.length}` : 'New item';

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <NavHeader title={title} onBack={() => router.back()} backIcon="x" right={queue.length > 1 ? <Button label="Skip" size="sm" variant="ghost" onPress={skipPhoto} /> : undefined} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
        {/* Preview */}
        <View style={{ alignItems: 'center', marginTop: space.sm }}>
          <View style={{ width: 240, height: 240, borderRadius: radius.xl, backgroundColor: colors.surfaceAlt, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
            {previewUri ? (
              <Image
                source={{ uri: previewUri }}
                style={{ width: '100%', height: '100%', transform: [{ rotate: `${rotation}deg` }] }}
                contentFit={squareCrop || !photo ? 'cover' : 'contain'}
                accessibilityLabel="Photo preview"
              />
            ) : draft.categoryId ? (
              <GarmentGlyph item={{ categoryId: draft.categoryId, primaryColor: draft.primaryColor, secondaryColors: draft.secondaryColors, pattern: draft.pattern }} size={180} />
            ) : (
              <View style={{ alignItems: 'center', gap: 8 }}>
                <Icon name="shirt" size={48} color={colors.textSubtle} />
                <Text variant="caption" color="textSubtle">
                  Pick a category below
                </Text>
              </View>
            )}
          </View>
          {photo && (
            <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
              <Chip label="Rotate" icon="rotate" size="sm" onPress={() => setRotation((r) => (r + 90) % 360)} />
              <Chip label="Square crop" icon="crop" size="sm" selected={squareCrop} onPress={() => setSquareCrop((s) => !s)} />
              <Chip label="Remove background" size="sm" accessibilityLabel="Remove background, planned feature" onPress={() => toast({ message: 'Background removal is planned — not in this version yet', icon: 'info' })} />
            </View>
          )}
        </View>

        <FieldLabel>Category</FieldLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.xl }} contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.xl }}>
          {(Object.keys(GROUP_LABELS) as CategoryGroup[]).map((g) => (
            <Chip key={g} label={GROUP_LABELS[g]} size="sm" selected={group === g} onPress={() => setGroup(g)} />
          ))}
        </ScrollView>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md }}>
          {groupCats.map((c) => (
            <Chip key={c.id} label={c.label} selected={draft.categoryId === c.id} onPress={() => chooseCategory(c.id)} />
          ))}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: space.lg, marginBottom: 8, gap: 8 }}>
          <Text variant="label" color="textMuted">
            Main color
          </Text>
          {analyzing && <ActivityIndicator size="small" />}
          {suggested && <Badge label="Suggested from photo — tap to change" tone="sun" />}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {COLORS.map((c) => {
            const sel = draft.primaryColor === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => {
                  haptic.tap();
                  set('primaryColor', c.id);
                  set('secondaryColors', draft.secondaryColors.filter((x) => x !== c.id));
                }}
                accessibilityRole="button"
                accessibilityLabel={c.label}
                accessibilityState={{ selected: sel }}
                style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: sel ? colors.text : 'transparent', alignItems: 'center', justifyContent: 'center' }}
              >
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.id === 'multi' ? '#C9643F' : c.hex, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                  {c.id === 'multi' && <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>MIX</Text>}
                </View>
              </Pressable>
            );
          })}
        </View>
        <Text variant="caption" color="textMuted" style={{ marginTop: 4 }}>
          {COLORS.find((c) => c.id === draft.primaryColor)?.label}
        </Text>

        <TextField
          label="Name (optional)"
          placeholder={draft.categoryId ? `e.g. ${COLORS.find((c) => c.id === draft.primaryColor)?.label} ${getCategory(draft.categoryId, custom).label.toLowerCase()}` : 'e.g. Favorite denim jacket'}
          value={draft.name}
          onChangeText={(t) => set('name', t)}
          returnKeyType="done"
          style={{ marginTop: 0 }}
        />

        <FieldLabel>Style</FieldLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {(Object.keys(STYLE_LABELS) as StyleTag[]).map((t) => (
            <Chip key={t} label={STYLE_LABELS[t]} size="sm" selected={draft.styleTags.includes(t)} onPress={() => set('styleTags', toggleIn(draft.styleTags, t))} />
          ))}
        </View>

        <FieldLabel>How dressy?</FieldLabel>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {([1, 2, 3, 4, 5] as Formality[]).map((f) => (
            <View key={f} style={{ flex: 1 }}>
              <Chip label={FORMALITY_LABELS[f]} size="sm" selected={draft.formality === f} onPress={() => set('formality', f)} />
            </View>
          ))}
        </View>

        <FieldLabel>How warm?</FieldLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {([1, 2, 3, 4, 5] as Warmth[]).map((w) => (
            <Chip key={w} label={WARMTH_LABELS[w]} size="sm" selected={draft.warmth === w} onPress={() => set('warmth', w)} />
          ))}
        </View>

        <Pressable onPress={() => setMore((m) => !m)} accessibilityRole="button" accessibilityState={{ expanded: more }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.xl, minHeight: 44 }}>
          <Text variant="bodyStrong">More details</Text>
          <Text variant="caption" color="textMuted">
            pattern, fit, care, season…
          </Text>
          <View style={{ flex: 1 }} />
          <View style={{ transform: [{ rotate: more ? '180deg' : '0deg' }] }}>
            <Icon name="chevronDown" size={18} />
          </View>
        </Pressable>

        {more && (
          <View>
            <FieldLabel>Pattern</FieldLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
              {(Object.keys(PATTERN_LABELS) as Pattern[]).map((p) => (
                <Chip key={p} label={PATTERN_LABELS[p]} size="sm" selected={draft.pattern === p} onPress={() => set('pattern', p)} />
              ))}
            </View>

            <FieldLabel>Accent colors</FieldLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {COLORS.filter((c) => c.id !== draft.primaryColor && c.id !== 'multi').map((c) => (
                <Chip key={c.id} label={c.label} swatch={c.hex} size="sm" selected={draft.secondaryColors.includes(c.id)} onPress={() => set('secondaryColors', toggleIn(draft.secondaryColors, c.id).slice(-3))} />
              ))}
            </View>

            <FieldLabel>Fit</FieldLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
              {(Object.keys(FIT_LABELS) as Fit[]).map((f) => (
                <Chip key={f} label={FIT_LABELS[f]} size="sm" selected={draft.fit === f} onPress={() => set('fit', draft.fit === f ? undefined : f)} />
              ))}
            </View>

            <FieldLabel>Seasons (leave empty for all)</FieldLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
              {(Object.keys(SEASON_LABELS) as Season[]).map((s) => (
                <Chip key={s} label={SEASON_LABELS[s]} size="sm" selected={draft.seasons.includes(s)} onPress={() => set('seasons', toggleIn(draft.seasons, s))} />
              ))}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.lg }}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">Wears before washing</Text>
                <Text variant="caption" color="textMuted">
                  {draft.wearsBeforeWash >= 999 ? 'Never goes in the hamper automatically' : `Goes to the hamper after ${draft.wearsBeforeWash} ${draft.wearsBeforeWash === 1 ? 'wear' : 'wears'}`}
                </Text>
              </View>
              <Stepper label="Wears before washing" value={draft.wearsBeforeWash >= 999 ? 0 : draft.wearsBeforeWash} min={0} max={30} onChange={(v) => set('wearsBeforeWash', v === 0 ? 999 : v)} />
            </View>

            <View style={{ marginTop: space.md }}>
              <ToggleRow first title="Handles rain" subtitle="Water-resistant shoes or outerwear" value={draft.waterResistant} onChange={(v) => set('waterResistant', v)} />
              <ToggleRow title="Favorite" value={draft.favorite} onChange={(v) => set('favorite', v)} />
            </View>

            <View style={{ gap: space.md, marginTop: space.md }}>
              <TextField label="Brand" placeholder="Optional" value={draft.brand ?? ''} onChangeText={(t) => set('brand', t || undefined)} />
              <TextField label="Material" placeholder="e.g. Cotton, wool" value={draft.material ?? ''} onChangeText={(t) => set('material', t || undefined)} />
              <TextField label="Notes" placeholder="Anything to remember" value={draft.notes ?? ''} onChangeText={(t) => set('notes', t || undefined)} multiline />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.xl, paddingTop: space.md, paddingBottom: Math.max(insets.bottom, space.lg), backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
        {photo && queue.length > 1 && (
          <IconButton icon="trash" label="Discard this photo" background={colors.surfaceAlt} size={48} onPress={skipPhoto} />
        )}
        <Button
          label={existing ? 'Save changes' : index < queue.length - 1 ? 'Save & next' : 'Add to closet'}
          icon={existing ? 'check' : 'plus'}
          style={{ flex: 1 }}
          disabled={!draft.categoryId}
          loading={saving}
          onPress={save}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
