import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { OptionCard } from '@/components/OptionCard';
import { Text } from '@/components/Text';
import { toast } from '@/components/Toast';
import { NavHeader, Screen } from '@/components/ui';
import { pickFromCamera, pickFromLibrary, type PickedPhoto } from '@/features/closet/picker';
import { useStore } from '@/state/store';
import { space } from '@/theme/tokens';

export default function AddItem() {
  const hasItems = useStore((s) => s.items.length > 0);
  const [busy, setBusy] = useState(false);

  const go = async (fn: () => Promise<PickedPhoto[] | undefined>) => {
    if (busy) return;
    setBusy(true);
    try {
      const photos = await fn();
      if (photos?.length) router.replace({ pathname: '/item/editor', params: { photos: JSON.stringify(photos) } });
    } catch {
      toast({ message: 'Couldn’t open photos. Try again.', icon: 'info' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen edges={[]} header={<NavHeader title="Add clothes" onBack={() => router.back()} backIcon="x" />}>
      <Text variant="title" style={{ marginTop: space.md }}>
        How do you want to add?
      </Text>
      <Text variant="body" color="textMuted" style={{ marginTop: 6, marginBottom: space.xl }}>
        Lay the piece flat or hang it against a plain wall for the best photo. Photos stay on your phone.
      </Text>
      <View style={{ gap: space.md }}>
        <OptionCard icon="camera" title="Take a photo" body="Snap one piece at a time" primary onPress={() => go(pickFromCamera)} disabled={busy} />
        <OptionCard icon="image" title="Choose from library" body="Select up to 20 photos at once" onPress={() => go(() => pickFromLibrary(true))} disabled={busy} />
        <OptionCard icon="edit" title="Add without a photo" body="Describe it — we’ll draw a placeholder" onPress={() => router.replace({ pathname: '/item/editor', params: { manual: '1' } })} />
        {!hasItems && (
          <OptionCard
            icon="hanger"
            title="Start with a sample closet"
            body="27 everyday pieces to try things out — remove any time"
            onPress={() => {
              useStore.getState().loadSamples();
              toast({ message: 'Sample closet added', icon: 'check' });
              router.back();
            }}
          />
        )}
      </View>
    </Screen>
  );
}
