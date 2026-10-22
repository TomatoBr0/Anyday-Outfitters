/**
 * Getup UI kit: buttons, chips, cards, fields, list rows and layout helpers.
 * All touch targets are ≥44pt and carry accessibility roles/labels.
 */
import { forwardRef, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  type TextInputInstance,
  View,
  type PressableProps,
  type ScrollViewProps,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, space } from '@/theme/tokens';
import { haptic } from '@/utils/haptics';

// ------------------------------------------------------------------ Button

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  full?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, variant = 'primary', size = 'md', icon, iconRight, loading, full, disabled, onPress, style, ...rest }: ButtonProps) {
  const { colors } = useTheme();
  const bg = {
    primary: colors.primary,
    secondary: colors.surface,
    ghost: 'transparent',
    accent: colors.accent,
    danger: 'transparent',
  }[variant];
  const fg = {
    primary: colors.onPrimary,
    secondary: colors.text,
    ghost: colors.text,
    accent: colors.onAccent,
    danger: colors.danger,
  }[variant];
  const h = { sm: 38, md: 48, lg: 56 }[size];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      disabled={disabled || loading}
      onPress={(e) => {
        haptic.tap();
        onPress?.(e);
      }}
      style={({ pressed }) => [
        {
          minHeight: Math.max(44, h),
          paddingHorizontal: size === 'sm' ? space.md : space.xl,
          borderRadius: radius.pill,
          backgroundColor: bg,
          borderWidth: variant === 'secondary' ? 1 : variant === 'danger' ? 1 : 0,
          borderColor: variant === 'danger' ? colors.danger : colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: space.sm,
          opacity: disabled ? 0.45 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
          alignSelf: full ? 'stretch' : 'auto',
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Icon name={icon} size={size === 'sm' ? 17 : 19} color={fg} />}
          <Text style={{ color: fg, fontFamily: fonts.semibold, fontSize: size === 'sm' ? 14 : 16 }} numberOfLines={1}>
            {label}
          </Text>
          {iconRight && <Icon name={iconRight} size={size === 'sm' ? 17 : 19} color={fg} />}
        </>
      )}
    </Pressable>
  );
}

// ------------------------------------------------------------------ IconButton

interface IconButtonProps extends Omit<PressableProps, 'style'> {
  icon: IconName;
  label: string;
  size?: number;
  color?: string;
  background?: string;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({ icon, label, size = 44, color, background, onPress, style, ...rest }: IconButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={(e) => {
        haptic.tap();
        onPress?.(e);
      }}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: background ?? 'transparent',
          opacity: pressed ? 0.6 : 1,
        },
        style,
      ]}
      {...rest}
    >
      <Icon name={icon} size={Math.round(size * 0.48)} color={color ?? colors.text} />
    </Pressable>
  );
}

// ------------------------------------------------------------------ Chip

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  swatch?: string;
  size?: 'sm' | 'md';
  accessibilityLabel?: string;
}

export function Chip({ label, selected, onPress, icon, swatch, size = 'md', accessibilityLabel }: ChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: !!selected }}
      onPress={
        onPress &&
        (() => {
          haptic.tap();
          onPress();
        })
      }
      hitSlop={size === 'sm' ? 6 : 2}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        minHeight: size === 'sm' ? 32 : 40,
        paddingHorizontal: size === 'sm' ? 12 : 15,
        borderRadius: radius.pill,
        backgroundColor: selected ? colors.primary : colors.surface,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      {swatch && (
        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: swatch, borderWidth: 1, borderColor: 'rgba(0,0,0,0.15)' }} />
      )}
      {icon && <Icon name={icon} size={16} color={selected ? colors.onPrimary : colors.text} />}
      <Text variant={size === 'sm' ? 'caption' : 'callout'} style={{ color: selected ? colors.onPrimary : colors.text, fontFamily: fonts.medium }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ChipRow({ children, scroll = true, style }: { children: ReactNode; scroll?: boolean; style?: StyleProp<ViewStyle> }) {
  if (!scroll) return <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }, style]}>{children}</View>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[{ gap: space.sm, paddingHorizontal: space.xl }, style]}>
      {children}
    </ScrollView>
  );
}

// ------------------------------------------------------------------ Card

export function Card({ children, style, padded = true, onPress, accessibilityLabel }: { children: ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean; onPress?: () => void; accessibilityLabel?: string }) {
  const { colors, scheme } = useTheme();
  const base: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: padded ? space.lg : 0,
    borderWidth: scheme === 'dark' ? 1 : 0,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: scheme === 'dark' ? 0 : 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  };
  if (onPress)
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={() => {
          haptic.tap();
          onPress();
        }}
        style={({ pressed }) => [base, { transform: [{ scale: pressed ? 0.985 : 1 }] }, style]}
      >
        {children}
      </Pressable>
    );
  return <View style={[base, style]}>{children}</View>;
}

// ------------------------------------------------------------------ Screen

interface ScreenProps extends ScrollViewProps {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  /** Extra space for the floating tab bar. */
  tabBarSpace?: boolean;
  header?: ReactNode;
  edges?: ('top' | 'bottom')[];
}

export function Screen({ children, scroll = true, padded = true, tabBarSpace, header, edges = ['top'], contentContainerStyle, ...rest }: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const pt = edges.includes('top') ? insets.top : 0;
  const pb = (edges.includes('bottom') ? insets.bottom : 0) + (tabBarSpace ? 96 : space.xl);
  if (!scroll)
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: pt }}>
        {header}
        <View style={{ flex: 1, paddingHorizontal: padded ? space.xl : 0, paddingBottom: pb }}>{children}</View>
      </View>
    );
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: pt }}>
      {header}
      <ScrollView
        contentContainerStyle={[{ paddingHorizontal: padded ? space.xl : 0, paddingBottom: pb }, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        {...rest}
      >
        {children}
      </ScrollView>
    </View>
  );
}

/** Large editorial page title with optional right-side actions. */
export function PageHeader({ title, subtitle, right, overline }: { title: string; subtitle?: string; right?: ReactNode; overline?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: space.lg, paddingBottom: space.lg, gap: space.md }}>
      <View style={{ flex: 1 }}>
        {overline && (
          <Text variant="overline" color="textMuted" style={{ marginBottom: 4 }}>
            {overline}
          </Text>
        )}
        <Text variant="display" accessibilityRole="header">
          {title}
        </Text>
        {subtitle && (
          <Text variant="callout" color="textMuted" style={{ marginTop: 4 }}>
            {subtitle}
          </Text>
        )}
      </View>
      {right && <View style={{ flexDirection: 'row', gap: space.xs }}>{right}</View>}
    </View>
  );
}

/** Compact header with back button for pushed/modal screens. */
export function NavHeader({ title, onBack, right, backIcon = 'chevronLeft' }: { title?: string; onBack?: () => void; right?: ReactNode; backIcon?: IconName }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.sm, minHeight: 52 }}>
      <View style={{ width: 88, alignItems: 'flex-start' }}>
        {onBack && <IconButton icon={backIcon} label={backIcon === 'x' ? 'Close' : 'Back'} onPress={onBack} />}
      </View>
      <Text variant="heading" numberOfLines={1} style={{ flex: 1, textAlign: 'center' }} accessibilityRole="header">
        {title ?? ''}
      </Text>
      <View style={{ width: 88, alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'flex-end' }}>{right}</View>
    </View>
  );
}

export function SectionHeader({ title, action, onAction, style }: { title: string; action?: string; onAction?: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.xxl, marginBottom: space.md }, style]}>
      <Text variant="title" accessibilityRole="header" style={{ fontSize: 20, lineHeight: 26 }}>
        {title}
      </Text>
      {action && onAction && (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={12} style={{ minHeight: 44, justifyContent: 'center' }}>
          <Text variant="label" color="accent">
            {action}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// ------------------------------------------------------------------ Segmented

export function Segmented<T extends string>({ options, value, onChange, style }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="tablist" style={[{ flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, padding: 4 }, style]}>
      {options.map((o) => {
        const sel = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: sel }}
            onPress={() => {
              haptic.tap();
              onChange(o.value);
            }}
            style={{
              flex: 1,
              minHeight: 38,
              borderRadius: radius.pill,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: sel ? colors.surface : 'transparent',
              shadowColor: colors.shadow,
              shadowOpacity: sel ? 0.08 : 0,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
            }}
          >
            <Text variant="label" color={sel ? 'text' : 'textMuted'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ------------------------------------------------------------------ Fields

interface FieldProps extends TextInputProps {
  label?: string;
  hint?: string;
  icon?: IconName;
}

export const TextField = forwardRef<TextInputInstance, FieldProps>(function TextField({ label, hint, icon, style, ...rest }, ref) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {label && (
        <Text variant="label" color="textMuted">
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.sm,
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: space.md,
          minHeight: 48,
        }}
      >
        {icon && <Icon name={icon} size={18} color={colors.textMuted} />}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textSubtle}
          accessibilityLabel={label ?? rest.placeholder}
          maxFontSizeMultiplier={1.6}
          style={[{ flex: 1, color: colors.text, fontFamily: fonts.body, fontSize: 16, paddingVertical: 12 }, style]}
          {...rest}
        />
      </View>
      {hint && (
        <Text variant="caption" color="textSubtle">
          {hint}
        </Text>
      )}
    </View>
  );
});

export function FieldLabel({ children }: { children: string }) {
  return (
    <Text variant="label" color="textMuted" style={{ marginBottom: 8, marginTop: space.lg }}>
      {children}
    </Text>
  );
}

// ------------------------------------------------------------------ Rows

interface RowProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  value?: string;
  onPress?: () => void;
  right?: ReactNode;
  destructive?: boolean;
  first?: boolean;
}

export function ListRow({ title, subtitle, icon, value, onPress, right, destructive, first }: RowProps) {
  const { colors } = useTheme();
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 12, minHeight: 56, borderTopWidth: first ? 0 : 1, borderTopColor: colors.border }}>
      {icon && (
        <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={18} color={destructive ? colors.danger : colors.text} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" color={destructive ? 'danger' : 'text'}>
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption" color="textMuted">
            {subtitle}
          </Text>
        )}
      </View>
      {value && (
        <Text variant="callout" color="textMuted">
          {value}
        </Text>
      )}
      {right}
      {onPress && !right && <Icon name="chevronRight" size={18} color={colors.textSubtle} />}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title} onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      {content}
    </Pressable>
  );
}

export function ToggleRow({ title, subtitle, value, onChange, first }: { title: string; subtitle?: string; value: boolean; onChange: (v: boolean) => void; first?: boolean }) {
  const { colors } = useTheme();
  return (
    <ListRow
      first={first}
      title={title}
      subtitle={subtitle}
      right={
        <Switch
          accessibilityLabel={title}
          value={value}
          onValueChange={(v) => {
            haptic.tap();
            onChange(v);
          }}
          trackColor={{ true: colors.accent, false: colors.borderStrong }}
          thumbColor="#FFFFFF"
        />
      }
    />
  );
}

// ------------------------------------------------------------------ Misc

export function EmptyState({ icon, title, body, action }: { icon: IconName; title: string; body: string; action?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: space.xxxl, paddingHorizontal: space.xl, gap: space.md }}>
      <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: colors.sunSoft, alignItems: 'center', justifyContent: 'center', marginBottom: space.sm }}>
        <Icon name={icon} size={34} color={colors.sun} />
      </View>
      <Text variant="title" align="center">
        {title}
      </Text>
      <Text variant="body" color="textMuted" align="center" style={{ maxWidth: 300 }}>
        {body}
      </Text>
      {action && <View style={{ marginTop: space.sm }}>{action}</View>}
    </View>
  );
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'accent' | 'sun' | 'danger' | 'warning' }) {
  const { colors } = useTheme();
  const map = {
    neutral: [colors.surfaceAlt, colors.textMuted],
    accent: [colors.accentSoft, colors.accent],
    sun: [colors.sunSoft, colors.sun],
    danger: [colors.sunSoft, colors.danger],
    warning: [colors.sunSoft, colors.warning],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <Text variant="label" style={{ color: fg, fontSize: 12 }}>
        {label}
      </Text>
    </View>
  );
}

export function Skeleton({ width, height, radius: r = radius.md, style }: { width: ViewStyle['width']; height: number; radius?: number; style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <View accessibilityElementsHidden style={[{ width, height, borderRadius: r, backgroundColor: colors.surfaceAlt, opacity: 0.8 }, style]} />;
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  const { colors } = useTheme();
  return <View style={[{ height: 1, backgroundColor: colors.border, marginVertical: space.lg }, style]} />;
}

export function Stepper({ value, onChange, min = 0, max = 99, label }: { value: number; onChange: (v: number) => void; min?: number; max?: number; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }} accessible accessibilityLabel={`${label}: ${value}`} accessibilityRole="adjustable"
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') onChange(Math.min(max, value + 1));
        if (e.nativeEvent.actionName === 'decrement') onChange(Math.max(min, value - 1));
      }}
    >
      <IconButton icon="chevronLeft" label={`Decrease ${label}`} size={38} background={colors.surfaceAlt} onPress={() => onChange(Math.max(min, value - 1))} />
      <Text variant="bodyStrong" style={{ minWidth: 28, textAlign: 'center' }}>
        {value}
      </Text>
      <IconButton icon="chevronRight" label={`Increase ${label}`} size={38} background={colors.surfaceAlt} onPress={() => onChange(Math.min(max, value + 1))} />
    </View>
  );
}
