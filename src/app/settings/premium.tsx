import { router } from 'expo-router';
import { View } from 'react-native';

import { Icon } from '@/components/Icon';
import { LogoMark } from '@/components/Logo';
import { Text } from '@/components/Text';
import { Badge, Card, NavHeader, Screen, SectionHeader } from '@/components/ui';
import { BRAND } from '@/config/brand';
import { FEATURES } from '@/config/features';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';

export default function Premium() {
  const { colors } = useTheme();
  const free = FEATURES.filter((f) => f.tier === 'free');
  const plus = FEATURES.filter((f) => f.tier === 'plus');
  return (
    <Screen edges={['top', 'bottom']} header={<NavHeader title={`${BRAND.name} Plus`} onBack={() => router.back()} />}>
      <View style={{ alignItems: 'center', paddingVertical: space.xl, gap: space.md }}>
        <LogoMark size={64} />
        <Text variant="display" align="center">
          The essentials are free.
        </Text>
        <Text variant="body" color="textMuted" align="center" style={{ maxWidth: 320 }}>
          Plus is where extra power will live. It isn’t available yet — nothing here costs anything today.
        </Text>
      </View>

      <SectionHeader title="Free, forever" />
      <Card>
        {free.map((f) => (
          <View key={f.id} style={{ flexDirection: 'row', gap: space.md, paddingVertical: 8 }}>
            <Icon name="check" size={18} color={colors.accent} strokeWidth={2.4} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{f.title}</Text>
              <Text variant="caption" color="textMuted">
                {f.body}
              </Text>
            </View>
          </View>
        ))}
      </Card>

      <SectionHeader title="Coming to Plus" />
      <Card>
        {plus.map((f) => (
          <View key={f.id} style={{ flexDirection: 'row', gap: space.md, paddingVertical: 8, alignItems: 'flex-start' }}>
            <Icon name="star" size={18} color={colors.sun} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{f.title}</Text>
              <Text variant="caption" color="textMuted">
                {f.body}
              </Text>
            </View>
            <Badge label="Planned" />
          </View>
        ))}
      </Card>
    </Screen>
  );
}
