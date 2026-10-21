import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { Button, TextField } from '@/components/ui';
import { locateDevice } from '@/services/location';
import { searchCity, type GeoResult } from '@/services/weather';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import type { SavedLocation } from '@/types/models';

/** "Use my location" + manual city search. Calls onPick with a saved location. */
export function CitySearch({ onPick, showDevice = true }: { onPick: (l: SavedLocation) => void; showDevice?: boolean }) {
  const { colors } = useTheme();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [locating, setLocating] = useState(false);

  const tooShort = q.trim().length < 2;
  const visible = tooShort ? [] : results;

  useEffect(() => {
    if (tooShort) return;
    const t = setTimeout(async () => {
      setLoading(true);
      setError(undefined);
      try {
        setResults(await searchCity(q));
      } catch {
        setError('City search needs a connection. Try again in a moment.');
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [q, tooShort]);

  const useDevice = async () => {
    setLocating(true);
    setError(undefined);
    const r = await locateDevice();
    setLocating(false);
    if (r.ok) onPick(r.location);
    else setError(r.reason === 'denied' ? 'Location is off for Getup — search for your city instead.' : 'Couldn’t get your location. Search for your city instead.');
  };

  return (
    <View style={{ gap: space.md }}>
      {showDevice && <Button label="Use my current location" icon="pin" variant="secondary" loading={locating} onPress={useDevice} />}
      <TextField icon="search" placeholder="Search for a city" value={q} onChangeText={setQ} autoCorrect={false} returnKeyType="search" accessibilityLabel="Search for a city" />
      {loading && !tooShort && <ActivityIndicator />}
      {error && (
        <Text variant="caption" style={{ color: colors.warning }}>
          {error}
        </Text>
      )}
      {visible.length > 0 && (
        <View style={{ borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
          {visible.map((r, i) => (
            <Pressable
              key={`${r.latitude},${r.longitude}`}
              onPress={() => onPick({ name: r.name, latitude: Math.round(r.latitude * 100) / 100, longitude: Math.round(r.longitude * 100) / 100, source: 'manual' })}
              accessibilityRole="button"
              accessibilityLabel={[r.name, r.region, r.country].filter(Boolean).join(', ')}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, minHeight: 52, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border, opacity: pressed ? 0.6 : 1 })}
            >
              <Icon name="pin" size={18} color={colors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{r.name}</Text>
                <Text variant="caption" color="textMuted">
                  {[r.region, r.country].filter(Boolean).join(', ')}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
