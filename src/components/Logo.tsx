/**
 * Getup mark: a hanger whose bar is a horizon with the sun rising through it —
 * "get up" and "get-up" (an outfit) in one shape. Geometry mirrors
 * branding/logo/getup-mark.svg.
 */
import { Text, View, type ViewStyle } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';
import { fonts, palette } from '@/theme/tokens';

export const MARK_PATHS = {
  hook: 'M50 33V28.6c0-2.6 1.9-4 4-5.4a8 8 0 1 0-12.1-6.9',
  hanger: 'M50 33 15.6 63.2c-2.6 2.3-1 6.3 2.4 6.3h64c3.4 0 5-4 2.4-6.3L50 33Z',
  sun: 'M34 69.5a16 16 0 0 1 32 0Z',
};

interface MarkProps {
  size?: number;
  ink?: string;
  sun?: string;
  /** Draw the app-icon tile behind the mark. */
  tile?: boolean;
  tileColor?: string;
}

export function LogoMark({ size = 48, ink, sun, tile, tileColor }: MarkProps) {
  const { colors } = useTheme();
  const stroke = ink ?? colors.text;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" accessibilityLabel="Getup logo" accessibilityRole="image">
      {tile && <Rect x={0} y={0} width={100} height={100} rx={22} fill={tileColor ?? palette.linen100} />}
      <Path d={MARK_PATHS.sun} fill={sun ?? colors.sun} />
      <Path d={MARK_PATHS.hanger} fill="none" stroke={stroke} strokeWidth={6.5} strokeLinejoin="round" />
      <Path d={MARK_PATHS.hook} fill="none" stroke={stroke} strokeWidth={6.5} strokeLinecap="round" />
    </Svg>
  );
}

export function Wordmark({ size = 28, color, style }: { size?: number; color?: string; style?: ViewStyle }) {
  const { colors } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: size * 0.3 }, style]} accessible accessibilityLabel="Getup">
      <LogoMark size={size * 1.25} ink={color} />
      <Text
        style={{ fontFamily: fonts.display, fontSize: size, color: color ?? colors.text, letterSpacing: -0.5, includeFontPadding: false }}
        allowFontScaling={false}
      >
        getup
      </Text>
    </View>
  );
}
