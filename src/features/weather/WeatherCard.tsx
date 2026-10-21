import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { Text } from '@/components/Text';
import { Skeleton } from '@/components/ui';
import type { WeatherCondition, WeatherSnapshot } from '@/engine/types';
import { CONDITION_LABEL, formatTemp } from '@/services/weather';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

export const CONDITION_ICON: Record<WeatherCondition, IconName> = {
  clear: 'sun',
  cloudy: 'cloud',
  fog: 'fog',
  drizzle: 'rain',
  rain: 'rain',
  snow: 'snow',
  storm: 'storm',
};

export function WeatherCard({ weather }: { weather?: WeatherSnapshot }) {
  const { colors } = useTheme();
  const status = useStore((s) => s.weatherStatus);
  const forecast = useStore((s) => s.forecast);
  const unit = useStore((s) => s.preferences.tempUnit);
  const loc = useStore((s) => s.preferences.location);

  if (!loc) {
    return (
      <Pressable
        onPress={() => router.push('/settings/weather')}
        accessibilityRole="button"
        accessibilityLabel="Add your city for weather-aware outfits"
        style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.sunSoft }}
      >
        <Icon name="pin" color={colors.sun} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">Add your city</Text>
          <Text variant="caption" color="textMuted">
            Outfits get smarter when they know the weather.
          </Text>
        </View>
        <Icon name="chevronRight" size={18} color={colors.textMuted} />
      </Pressable>
    );
  }

  if (!weather && (status === 'loading' || status === 'idle')) {
    return <Skeleton width="100%" height={84} radius={radius.lg} />;
  }

  if (!weather) {
    return (
      <View style={{ padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.surfaceAlt }}>
        <Text variant="bodyStrong">Weather unavailable</Text>
        <Text variant="caption" color="textMuted">
          Outfits are based on season and your preferences for now.
        </Text>
      </View>
    );
  }

  const estimate = forecast?.source === 'estimate';
  const rainy = weather.precipProbability >= 30;
  return (
    <Pressable
      onPress={() => router.push('/settings/weather')}
      accessibilityRole="button"
      accessibilityLabel={`${loc.name}: ${CONDITION_LABEL[weather.condition]}, feels like ${formatTemp(weather.feelsLikeC, unit)}, high ${formatTemp(weather.highC, unit)}, low ${formatTemp(weather.lowC, unit)}, ${Math.round(weather.precipProbability)}% chance of rain`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.lg,
        paddingVertical: space.md,
        paddingHorizontal: space.lg,
        borderRadius: radius.lg,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.sunSoft, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={CONDITION_ICON[weather.condition]} size={26} color={colors.sun} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Text variant="title" style={{ fontSize: 26, lineHeight: 30 }}>
            {formatTemp(weather.tempC, unit)}
          </Text>
          <Text variant="callout" color="textMuted">
            {CONDITION_LABEL[weather.condition]}
            {estimate ? ' · estimate' : ''}
          </Text>
        </View>
        <Text variant="caption" color="textMuted" numberOfLines={1}>
          Feels {formatTemp(weather.feelsLikeC, unit)} · H {formatTemp(weather.highC, unit)} L {formatTemp(weather.lowC, unit)} · {loc.name}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Icon name="drop" size={14} color={rainy ? colors.info : colors.textSubtle} />
          <Text variant="label" style={{ color: rainy ? colors.info : colors.textMuted }}>
            {Math.round(weather.precipProbability)}%
          </Text>
        </View>
        {weather.windKph >= 20 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Icon name="wind" size={14} color={colors.textMuted} />
            <Text variant="label" color="textMuted">
              {Math.round(unit === 'F' ? weather.windKph * 0.621 : weather.windKph)}
              {unit === 'F' ? ' mph' : ' km/h'}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
