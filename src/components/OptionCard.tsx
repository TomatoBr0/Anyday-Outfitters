import { Pressable, View } from 'react-native';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

interface Props {
  icon: IconName;
  title: string;
  body: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
}

/** Large tappable choice card (add-item sources, onboarding closet step). */
export function OptionCard({ icon, title, body, onPress, primary, disabled }: Props) {
  const { colors } = useTheme();
  const fg = primary ? colors.onPrimary : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${body}`}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.lg,
        padding: space.lg,
        borderRadius: radius.lg,
        backgroundColor: primary ? colors.primary : colors.surface,
        borderWidth: primary ? 0 : 1,
        borderColor: colors.border,
        opacity: pressed || disabled ? 0.8 : 1,
      })}
    >
      <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: primary ? 'rgba(255,255,255,0.12)' : colors.surfaceAlt }}>
        <Icon name={icon} size={24} color={fg} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="heading" style={{ color: fg }}>
          {title}
        </Text>
        <Text variant="caption" style={{ color: primary ? colors.onPrimary : colors.textMuted, opacity: primary ? 0.8 : 1 }}>
          {body}
        </Text>
      </View>
      <Icon name="chevronRight" size={18} color={primary ? colors.onPrimary : colors.textSubtle} />
    </Pressable>
  );
}
