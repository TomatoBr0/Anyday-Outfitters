import { router } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Share, View } from 'react-native';

import { Text } from '@/components/Text';
import { toast } from '@/components/Toast';
import { Card, ListRow, NavHeader, Screen, SectionHeader } from '@/components/ui';
import { imagesSize } from '@/services/images';
import { useStore } from '@/state/store';
import { space } from '@/theme/tokens';

export default function DataSettings() {
  const items = useStore((s) => s.items);
  const samples = items.filter((i) => i.sample).length;
  const photoBytes = useMemo(() => imagesSize(), []);

  const exportData = async () => {
    const s = useStore.getState();
    const data = { exportedAt: new Date().toISOString(), schemaVersion: s.schemaVersion, items: s.items, outfits: s.outfits, wearLogs: s.wearLogs, events: s.events, trips: s.trips, preferences: { ...s.preferences, location: s.preferences.location ? { name: s.preferences.location.name } : undefined } };
    try {
      await Share.share({ message: JSON.stringify(data, null, 2), title: 'Getup data export' });
    } catch {
      toast({ message: 'Export cancelled', icon: 'info' });
    }
  };

  return (
    <Screen edges={['top', 'bottom']} header={<NavHeader title="Privacy & data" onBack={() => router.back()} />}>
      <Card style={{ marginTop: space.sm }}>
        <Text variant="heading">Everything stays on this phone</Text>
        <Text variant="body" color="textMuted" style={{ marginTop: 6 }}>
          Your closet, photos, outfits, history and preferences are stored only on this device. There’s no account, no analytics SDK and no ad tracking. The only network requests are for weather and city search (Open-Meteo), which receive your approximate coordinates or the city name you type.
        </Text>
      </Card>

      <SectionHeader title="Your data" />
      <Card padded={false} style={{ paddingHorizontal: space.lg }}>
        <ListRow first title="Closet pieces" value={String(items.length)} />
        <ListRow title="Photo storage" value={photoBytes ? `${(photoBytes / 1_048_576).toFixed(1)} MB` : '—'} />
        <ListRow icon="arrowRight" title="Export as JSON" subtitle="Item details, outfits, history (photos not included)" onPress={exportData} />
        {samples > 0 && (
          <ListRow
            icon="hanger"
            title="Remove sample items"
            subtitle={`${samples} sample pieces`}
            onPress={() =>
              Alert.alert('Remove sample items?', 'Your own items stay.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => useStore.getState().removeSamples() },
              ])
            }
          />
        )}
      </Card>

      <SectionHeader title="Danger zone" />
      <Card padded={false} style={{ paddingHorizontal: space.lg }}>
        <ListRow
          first
          destructive
          icon="hanger"
          title="Clear wardrobe"
          subtitle="Every piece and photo, plus saved outfits and history. Settings stay"
          onPress={() =>
            Alert.alert('Clear your wardrobe?', `This permanently removes all ${items.length} pieces and their photos, along with saved outfits and wear history. Your settings, events and trips stay. It can’t be undone.`, [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Clear wardrobe',
                style: 'destructive',
                onPress: () => {
                  useStore.getState().clearWardrobe();
                  toast({ message: 'Wardrobe cleared', icon: 'check' });
                },
              },
            ])
          }
        />
        <ListRow
          destructive
          icon="trash"
          title="Delete all data"
          subtitle="Closet, photos, outfits, history, settings"
          onPress={() =>
            Alert.alert('Delete everything?', 'This permanently erases your closet, photos and history from this phone. It can’t be undone.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete everything',
                style: 'destructive',
                onPress: async () => {
                  await useStore.getState().resetAll();
                  router.replace('/onboarding');
                },
              },
            ])
          }
        />
      </Card>
      <View style={{ height: space.xl }} />
    </Screen>
  );
}
