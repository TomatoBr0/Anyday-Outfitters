import { router } from 'expo-router';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import { NavHeader, Screen } from '@/components/ui';
import { BRAND } from '@/config/brand';
import { space } from '@/theme/tokens';

const RULES: [string, string][] = [
  ['Post outfits, not people', 'Share clothes you’re wearing or styling. Don’t post photos of other people without their permission.'],
  ['Be kind about bodies and style', 'No mocking anyone’s body, size, gender expression or budget. Critique outfits gently, or not at all.'],
  ['No harassment or hate', 'No bullying, threats, slurs, or targeting anyone for who they are.'],
  ['Keep it appropriate', 'No nudity or sexual content. Getup is used by teens.'],
  ['Protect your privacy', 'Don’t share your address, school, phone number or live location. We strip location data from photos, but check the background.'],
  ['No spam or selling', 'No ads, affiliate spam, or fake engagement.'],
  ['Report, block, move on', 'Use ••• → Report on anything that breaks these rules, and Block anyone you don’t want contact with. Blocks are silent.'],
];

export default function Guidelines() {
  return (
    <Screen edges={['top', 'bottom']} header={<NavHeader title="Community Guidelines" onBack={() => router.back()} />}>
      <Text variant="body" color="textMuted" style={{ marginTop: space.sm }}>
        {BRAND.name} is a place to share style and get inspired. These rules keep it that way. Breaking them can get content removed or an account suspended.
      </Text>
      {RULES.map(([h, b], i) => (
        <View key={h} style={{ marginTop: space.lg }}>
          <Text variant="heading">
            {i + 1}. {h}
          </Text>
          <Text variant="body" color="textMuted" style={{ marginTop: 4 }}>
            {b}
          </Text>
        </View>
      ))}
      <Text variant="caption" color="textSubtle" style={{ marginTop: space.xl }}>
        Contact: {BRAND.supportEmail}. Draft pending legal review.
      </Text>
    </Screen>
  );
}
