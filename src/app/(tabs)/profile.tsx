import { router } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';

import { GarmentImage } from '@/components/GarmentImage';
import { LogoMark } from '@/components/Logo';
import { Text } from '@/components/Text';
import { Badge, Card, ListRow, PageHeader, Screen, SectionHeader, Segmented, ToggleRow } from '@/components/ui';
import { BRAND } from '@/config/brand';
import { getColor } from '@/engine/colors';
import { STYLE_LABELS } from '@/engine/scoring';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import type { ThemePreference } from '@/types/models';

export default function Profile() {
  const { colors } = useTheme();
  const items = useStore((s) => s.items);
  const outfits = useStore((s) => s.outfits);
  const logs = useStore((s) => s.wearLogs);
  const prefs = useStore((s) => s.preferences);
  const trips = useStore((s) => s.trips);

  const insights = useMemo(() => {
    const worn = items.filter((i) => i.wearCount > 0);
    const never = items.length - worn.length;
    const top = [...items].sort((a, b) => b.wearCount - a.wearCount)[0];
    const colorCounts = new Map<string, number>();
    for (const i of items) colorCounts.set(i.primaryColor, (colorCounts.get(i.primaryColor) ?? 0) + 1);
    const topColors = [...colorCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const used = items.length ? Math.round((worn.length / items.length) * 100) : 0;
    return { never, top: top?.wearCount ? top : undefined, topColors, used };
  }, [items]);

  const saved = outfits.filter((o) => o.saved).length;
  const dirty = items.filter((i) => !i.clean).length;

  return (
    <Screen tabBarSpace>
      <PageHeader title={prefs.displayName ? prefs.displayName : 'You'} subtitle={prefs.styles.length ? prefs.styles.map((s) => STYLE_LABELS[s]).join(' · ') : 'Set your style to sharpen suggestions'} />

      <View style={{ flexDirection: 'row', gap: space.sm }}>
        <Stat value={items.length} label="Pieces" />
        <Stat value={saved} label="Saved looks" />
        <Stat value={logs.length} label="Days logged" />
      </View>

      {items.length > 0 && (
        <Card style={{ marginTop: space.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="heading">Closet insights</Text>
            <Badge label={`${insights.used}% worn`} tone="accent" />
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surfaceAlt, marginTop: space.md, overflow: 'hidden' }} accessible accessibilityLabel={`${insights.used}% of your closet has been worn`}>
            <View style={{ width: `${insights.used}%`, height: '100%', backgroundColor: colors.accent }} />
          </View>
          <Text variant="caption" color="textMuted" style={{ marginTop: 6 }}>
            {insights.never ? `${insights.never} ${insights.never === 1 ? 'piece hasn’t' : 'pieces haven’t'} been worn yet — Today’s picks will work them in.` : 'You’re wearing your whole closet. Nice.'}
          </Text>
          {insights.top && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.md }}>
              <GarmentImage item={insights.top} size={48} rounded={radius.sm} />
              <View style={{ flex: 1 }}>
                <Text variant="overline" color="textSubtle">
                  Most worn
                </Text>
                <Text variant="bodyStrong">
                  {insights.top.name} · {insights.top.wearCount}×
                </Text>
              </View>
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.md }} accessible accessibilityLabel={`Top colors: ${insights.topColors.map(([c]) => getColor(c).label).join(', ')}`}>
            <Text variant="caption" color="textMuted" style={{ marginRight: 4 }}>
              Your palette
            </Text>
            {insights.topColors.map(([c]) => (
              <View key={c} style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: getColor(c).hex, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' }} />
            ))}
          </View>
        </Card>
      )}

      <SectionHeader title="Your outfits" />
      <Card padded={false} style={{ paddingHorizontal: space.lg }}>
        <ListRow first icon="bookmark" title="Saved outfits" value={String(saved)} onPress={() => router.push('/outfits')} />
        <ListRow icon="history" title="Outfit history" value={String(logs.length)} onPress={() => router.push('/history')} />
        <ListRow icon="basket" title="Laundry" value={dirty ? `${dirty} in hamper` : 'All clean'} onPress={() => router.push('/laundry')} />
        <ListRow icon="suitcase" title="Trips" value={String(trips.length)} onPress={() => router.push('/plan')} />
      </Card>

      <SectionHeader title="Personalization" />
      <Card padded={false} style={{ paddingHorizontal: space.lg }}>
        <ListRow first icon="shirt" title="Style & fit" subtitle="Aesthetics and preferred fits" onPress={() => router.push('/settings/style')} />
        <ListRow icon="sun" title="Weather & location" subtitle={prefs.location ? `${prefs.location.name} · ${prefs.tempUnit === 'F' ? '°F' : '°C'}` : 'Not set'} onPress={() => router.push('/settings/weather')} />
        <ListRow icon="drop" title="Laundry rules" subtitle="What goes in the hamper automatically" onPress={() => router.push('/settings/laundry')} />
      </Card>

      <SectionHeader title="App" />
      <Card style={{ paddingBottom: space.sm }}>
        <Text variant="label" color="textMuted" style={{ marginBottom: space.sm }}>
          Appearance
        </Text>
        <Segmented<ThemePreference>
          value={prefs.theme}
          onChange={(v) => useStore.getState().setPreferences({ theme: v })}
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
        <View style={{ marginTop: space.sm }}>
          <ToggleRow first title="Haptic feedback" value={prefs.haptics} onChange={(v) => useStore.getState().setPreferences({ haptics: v })} />
        </View>
      </Card>
      <Card padded={false} style={{ paddingHorizontal: space.lg, marginTop: space.md }}>
        <ListRow first icon="star" title={`${BRAND.name} Plus`} subtitle="What’s free, what’s coming" onPress={() => router.push('/settings/premium')} />
        <ListRow icon="lock" title="Privacy & data" subtitle="Export, sample data, delete everything" onPress={() => router.push('/settings/data')} />
        <ListRow icon="info" title="About" onPress={() => router.push('/settings/about')} />
      </Card>

      <View style={{ alignItems: 'center', marginTop: space.xxxl, gap: 6, opacity: 0.8 }}>
        <LogoMark size={36} />
        <Text variant="caption" color="textSubtle">
          {BRAND.tagline}
        </Text>
      </View>
    </Screen>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, padding: space.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} accessible accessibilityLabel={`${value} ${label}`}>
      <Text variant="title">{value}</Text>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
    </View>
  );
}
