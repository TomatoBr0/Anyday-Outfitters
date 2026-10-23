import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { SAMPLE_CLOSET } from '@/data/sampleCloset';
import { suitsWardrobe } from '@/engine/categories';

import { OptionCard } from '@/components/OptionCard';
import { Text } from '@/components/Text';
import { toast } from '@/components/Toast';
import { Button, NavHeader, Screen } from '@/components/ui';
import { pickFromCamera, pickFromLibrary, type PickedPhoto } from '@/features/closet/picker';
import { useStore } from '@/state/store';
import { space } from '@/theme/tokens';

export default function AddItem() {
  const hasItems = useStore((s) => s.items.length > 0);
  const clothesFor = useStore((s) => s.preferences.clothesFor);
  const [busy, setBusy] = useState(false);
  const [several, setSeveral] = useState(false);

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

  const goSeveral = async (fn: () => Promise<PickedPhoto[] | undefined>) => {
    if (busy) return;
    setBusy(true);
    try {
      const photos = await fn();
      if (photos?.[0]) router.replace({ pathname: '/item/split', params: { photo: JSON.stringify(photos[0]) } });
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
        <OptionCard icon="sparkles" title="Several pieces in one photo" body="Lay out a few things, snap once, mark each piece" onPress={() => setSeveral((v) => !v)} disabled={busy} />
        {several && (
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button label="Take photo" icon="camera" variant="secondary" style={{ flex: 1 }} disabled={busy} onPress={() => goSeveral(() => pickFromCamera(false))} />
            <Button label="Choose photo" icon="image" variant="secondary" style={{ flex: 1 }} disabled={busy} onPress={() => goSeveral(() => pickFromLibrary(false, false))} />
          </View>
        )}
        <OptionCard icon="edit" title="Add without a photo" body="Describe it — we’ll draw a placeholder" onPress={() => router.replace({ pathname: '/item/editor', params: { manual: '1' } })} />
        {!hasItems && (
          <OptionCard
            icon="hanger"
            title="Start with a sample closet"
            body={`${SAMPLE_CLOSET.filter((p) => suitsWardrobe(p.categoryId, clothesFor)).length} everyday pieces to try things out — remove any time`}
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
