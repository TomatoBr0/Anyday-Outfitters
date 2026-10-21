import Constants from 'expo-constants';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Wordmark } from '@/components/Logo';
import { Text } from '@/components/Text';
import { Card, NavHeader, Screen, SectionHeader } from '@/components/ui';
import { BRAND } from '@/config/brand';
import { space } from '@/theme/tokens';

export default function About() {
  return (
    <Screen edges={['top', 'bottom']} header={<NavHeader title="About" onBack={() => router.back()} />}>
      <View style={{ alignItems: 'center', paddingVertical: space.xxl, gap: space.md }}>
        <Wordmark size={34} />
        <Text variant="callout" color="textMuted">
          {BRAND.tagline}
        </Text>
        <Text variant="caption" color="textSubtle">
          Version {Constants.expoConfig?.version ?? '0.1.0'} · MVP preview
        </Text>
      </View>

      <SectionHeader title="How suggestions work" />
      <Card>
        <Text variant="body" color="textMuted">
          {BRAND.name} scores every combination of your clean, available clothes on six things: style cohesion, color harmony, weather fit, occasion, your feedback, and rotation (so forgotten pieces get worn). It’s a transparent rules-and-scoring engine that runs entirely on your phone — no cloud AI. Likes and dislikes adjust future rankings by simple, decaying counts.
        </Text>
      </Card>

      <SectionHeader title="Photo color suggestions" />
      <Card>
        <Text variant="body" color="textMuted">
          When you add a photo, the main color is estimated on-device by sampling the center of the image and ignoring a plain background. It’s a suggestion you can change. Garment type isn’t auto-detected yet.
        </Text>
      </Card>

      <SectionHeader title="Credits" />
      <Card>
        <Text variant="body" color="textMuted">
          {BRAND.weatherAttribution}.{'\n'}Typefaces: Fraunces and Inter (SIL Open Font License).
        </Text>
      </Card>
    </Screen>
  );
}
