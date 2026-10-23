import { router } from 'expo-router';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import { Chip, FieldLabel, NavHeader, Screen, Segmented, Stepper, TextField } from '@/components/ui';
import { STYLE_LABELS } from '@/engine/scoring';
import { FIT_LABELS } from '@/features/closet/labels';
import { useStore } from '@/state/store';
import { space } from '@/theme/tokens';
import type { CategoryGroup, ClothesFor, Fit, StyleTag } from '@/types/models';

const GROUPS: { g: CategoryGroup; label: string }[] = [
  { g: 'tops', label: 'Tops' },
  { g: 'bottoms', label: 'Bottoms' },
  { g: 'other', label: 'Dresses & sets' },
];

const CLOTHES_FOR: { value: ClothesFor; label: string }[] = [
  { value: 'mens', label: 'Men’s' },
  { value: 'womens', label: 'Women’s' },
  { value: 'all', label: 'Both' },
];

export default function StyleSettings() {
  const prefs = useStore((s) => s.preferences);
  const set = useStore.getState().setPreferences;
  return (
    <Screen edges={['top', 'bottom']} header={<NavHeader title="Style & fit" onBack={() => router.back()} />}>
      <TextField label="Name" placeholder="Optional" value={prefs.displayName ?? ''} onChangeText={(t) => set({ displayName: t || undefined })} autoCapitalize="words" />

      <FieldLabel>Clothes to suggest</FieldLabel>
      <Segmented value={prefs.clothesFor} onChange={(v) => set({ clothesFor: v })} options={CLOTHES_FOR} />
      <Text variant="caption" color="textMuted" style={{ marginTop: space.sm }}>
        {prefs.clothesFor === 'mens' ? 'Dresses and skirts are left out of your picks.' : 'Picks can include anything in your closet.'}
      </Text>

      <FieldLabel>Your aesthetics</FieldLabel>
      <Text variant="caption" color="textMuted" style={{ marginBottom: space.md }}>
        Outfits that match these rank higher. Pick several to mix things up.
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {(Object.keys(STYLE_LABELS) as StyleTag[]).map((t) => (
          <Chip key={t} label={STYLE_LABELS[t]} selected={prefs.styles.includes(t)} onPress={() => set({ styles: prefs.styles.includes(t) ? prefs.styles.filter((x) => x !== t) : [...prefs.styles, t] })} />
        ))}
      </View>

      {GROUPS.map(({ g, label }) => ({ g, label: g === 'other' && prefs.clothesFor === 'mens' ? 'Suits & sets' : label })).map(({ g, label }) => (
        <View key={g}>
          <FieldLabel>{`Preferred fit · ${label}`}</FieldLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {(Object.keys(FIT_LABELS) as Fit[]).map((f) => (
              <Chip key={f} label={FIT_LABELS[f]} size="sm" selected={prefs.fitByGroup[g] === f} onPress={() => set({ fitByGroup: { ...prefs.fitByGroup, [g]: prefs.fitByGroup[g] === f ? undefined : f } })} />
            ))}
          </View>
        </View>
      ))}

      <FieldLabel>Variety</FieldLabel>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="body" style={{ flex: 1 }}>
          Avoid repeating pieces worn in the last {prefs.repeatWindowDays} {prefs.repeatWindowDays === 1 ? 'day' : 'days'}
        </Text>
        <Stepper label="Repeat window in days" value={prefs.repeatWindowDays} min={1} max={21} onChange={(v) => set({ repeatWindowDays: v })} />
      </View>
    </Screen>
  );
}
