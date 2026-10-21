import { router } from 'expo-router';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import { Card, NavHeader, Screen, SectionHeader, ToggleRow } from '@/components/ui';
import { GROUP_LABELS, allCategories } from '@/engine/categories';
import { useStore } from '@/state/store';
import { space } from '@/theme/tokens';
import type { CategoryGroup } from '@/types/models';

export default function LaundrySettings() {
  const prefs = useStore((s) => s.preferences);
  const cats = allCategories(prefs.customCategories);
  const set = useStore.getState().setPreferences;
  const toggle = (id: string, on: boolean) =>
    set({ autoDirtyCategories: on ? [...new Set([...prefs.autoDirtyCategories, id])] : prefs.autoDirtyCategories.filter((x) => x !== id) });

  return (
    <Screen edges={['top', 'bottom']} header={<NavHeader title="Laundry rules" onBack={() => router.back()} />}>
      <Text variant="body" color="textMuted" style={{ marginTop: space.sm }}>
        When you tap “Wear today”, pieces in these categories go to the hamper once they reach their own wears-before-washing count (set per item — a tee might be 1, jeans 5, a coat 20). Everything else stays clean until you say otherwise.
      </Text>
      {(Object.keys(GROUP_LABELS) as CategoryGroup[]).map((g) => (
        <View key={g}>
          <SectionHeader title={GROUP_LABELS[g]} />
          <Card padded={false} style={{ paddingHorizontal: space.lg }}>
            {cats
              .filter((c) => c.group === g)
              .map((c, i) => (
                <ToggleRow
                  key={c.id}
                  first={i === 0}
                  title={c.label}
                  subtitle={c.defaults.wearsBeforeWash >= 999 ? 'Usually never washed this way' : `Default: wash every ${c.defaults.wearsBeforeWash} ${c.defaults.wearsBeforeWash === 1 ? 'wear' : 'wears'}`}
                  value={prefs.autoDirtyCategories.includes(c.id)}
                  onChange={(v) => toggle(c.id, v)}
                />
              ))}
          </Card>
        </View>
      ))}
    </Screen>
  );
}
