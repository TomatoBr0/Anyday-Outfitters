import { router } from 'expo-router';
import { View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { Button, FieldLabel, NavHeader, Screen, Segmented } from '@/components/ui';
import { BRAND } from '@/config/brand';
import { CitySearch } from '@/features/weather/CitySearch';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import type { ColdSensitivity, TempUnit } from '@/types/models';

export default function WeatherSettings() {
  const { colors } = useTheme();
  const prefs = useStore((s) => s.preferences);
  const status = useStore((s) => s.weatherStatus);
  const forecast = useStore((s) => s.forecast);
  const set = useStore.getState().setPreferences;

  return (
    <Screen edges={['top', 'bottom']} header={<NavHeader title="Weather & location" onBack={() => router.back()} />}>
      <FieldLabel>Location</FieldLabel>
      {prefs.location ? (
        <View style={{ gap: space.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
            <Icon name="pin" color={colors.sun} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{prefs.location.name}</Text>
              <Text variant="caption" color="textMuted">
                {prefs.location.source === 'device' ? 'From your device' : 'Set manually'} ·{' '}
                {status === 'ready' ? `updated ${forecast ? new Date(forecast.fetchedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : ''}` : status === 'loading' ? 'updating…' : 'forecast unavailable — using estimates'}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button label="Refresh" icon="refresh" variant="secondary" size="sm" onPress={() => useStore.getState().refreshWeather(true)} />
            <Button label="Remove" variant="ghost" size="sm" onPress={() => set({ location: undefined })} />
          </View>
          <Text variant="label" color="textMuted" style={{ marginTop: space.md }}>
            Change location
          </Text>
          <CitySearch onPick={(l) => set({ location: l })} />
        </View>
      ) : (
        <>
          <Text variant="caption" color="textMuted" style={{ marginBottom: space.md }}>
            Your location is only used to fetch the local forecast. It’s rounded to about 1 km and never tracked in the background.
          </Text>
          <CitySearch onPick={(l) => set({ location: l })} />
        </>
      )}

      <FieldLabel>Units</FieldLabel>
      <Segmented<TempUnit>
        value={prefs.tempUnit}
        onChange={(v) => set({ tempUnit: v })}
        options={[
          { value: 'F', label: 'Fahrenheit' },
          { value: 'C', label: 'Celsius' },
        ]}
      />

      <FieldLabel>Temperature comfort</FieldLabel>
      <Segmented<ColdSensitivity>
        value={prefs.coldSensitivity}
        onChange={(v) => set({ coldSensitivity: v })}
        options={[
          { value: 'runsCold', label: 'I run cold' },
          { value: 'neutral', label: 'Neutral' },
          { value: 'runsWarm', label: 'I run warm' },
        ]}
      />
      <Text variant="caption" color="textMuted" style={{ marginTop: 6 }}>
        Shifts suggestions about 7°F (4°C) warmer or cooler than the forecast.
      </Text>

      <Text variant="caption" color="textSubtle" style={{ marginTop: space.xxl }}>
        {BRAND.weatherAttribution}
      </Text>
    </Screen>
  );
}
