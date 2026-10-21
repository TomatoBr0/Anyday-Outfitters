import { Text as RNText, type TextProps } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { type as typeScale, type TypeVariant, type ThemeColors } from '@/theme/tokens';

interface Props extends TextProps {
  variant?: TypeVariant;
  color?: keyof ThemeColors | (string & {});
  align?: 'left' | 'center' | 'right';
}

/** Themed text. Dynamic Type is honored up to 1.6× so layouts stay intact. */
export function Text({ variant = 'body', color = 'text', align, style, maxFontSizeMultiplier = 1.6, ...rest }: Props) {
  const { colors } = useTheme();
  const resolved = (colors as unknown as Record<string, string>)[color] ?? color;
  return (
    <RNText
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[typeScale[variant], { color: resolved, textAlign: align }, style]}
      {...rest}
    />
  );
}
