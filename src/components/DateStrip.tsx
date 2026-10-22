import { useEffect, useMemo, useRef } from 'react';
import { Pressable, ScrollView, View, type ScrollViewInstance } from 'react-native';

import { Text } from './Text';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import type { ISODate } from '@/types/models';
import { addDays, fromISODate, toISODate } from '@/utils/dates';
import { haptic } from '@/utils/haptics';

/** Horizontal day picker covering the next `days` days from `start`. */
export function DateStrip({ value, onChange, start = toISODate(), days = 120, min }: { value: ISODate; onChange: (d: ISODate) => void; start?: ISODate; days?: number; min?: ISODate }) {
  const { colors } = useTheme();
  const list = useMemo(() => Array.from({ length: days }, (_, i) => addDays(start, i)), [start, days]);
  const ref = useRef<ScrollViewInstance>(null);
  const W = 58;

  useEffect(() => {
    const idx = list.indexOf(value);
    if (idx > 2) setTimeout(() => ref.current?.scrollTo({ x: (idx - 2) * (W + space.sm), animated: false }), 0);
    // only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.xl }} style={{ marginHorizontal: -space.xl }}>
      {list.map((d) => {
        const date = fromISODate(d);
        const sel = d === value;
        const disabled = !!min && d < min;
        const first = date.getDate() === 1 || d === list[0];
        return (
          <View key={d}>
            <Text variant="overline" color="textSubtle" style={{ height: 14, fontSize: 9 }}>
              {first ? date.toLocaleDateString(undefined, { month: 'short' }) : ''}
            </Text>
            <Pressable
              disabled={disabled}
              onPress={() => {
                haptic.tap();
                onChange(d);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: sel, disabled }}
              accessibilityLabel={date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              style={{ width: W, paddingVertical: space.sm, borderRadius: radius.md, alignItems: 'center', backgroundColor: sel ? colors.primary : colors.surface, borderWidth: 1, borderColor: sel ? colors.primary : colors.border, opacity: disabled ? 0.35 : 1 }}
            >
              <Text variant="caption" style={{ color: sel ? colors.onPrimary : colors.textMuted }}>
                {date.toLocaleDateString(undefined, { weekday: 'short' })}
              </Text>
              <Text variant="heading" style={{ color: sel ? colors.onPrimary : colors.text }}>
                {date.getDate()}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}
