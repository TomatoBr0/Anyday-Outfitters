import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';

interface ToastData {
  id: number;
  message: string;
  icon?: IconName;
  action?: { label: string; onPress: () => void };
}

const useToastStore = create<{ toast?: ToastData; show: (t: Omit<ToastData, 'id'>) => void; hide: () => void }>((set) => ({
  toast: undefined,
  show: (t) => set({ toast: { ...t, id: Date.now() } }),
  hide: () => set({ toast: undefined }),
}));

export const toast = (t: Omit<ToastData, 'id'>) => useToastStore.getState().show(t);

export function ToastHost() {
  const { toast: t, hide } = useToastStore();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!t) return;
    const timer = setTimeout(hide, t.action ? 5000 : 2600);
    return () => clearTimeout(timer);
  }, [t, hide]);

  if (!t) return null;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: insets.bottom + 92, alignItems: 'center' }}>
      <Animated.View
        key={t.id}
        entering={FadeInDown.duration(220)}
        exiting={FadeOutDown.duration(180)}
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md,
          backgroundColor: colors.primary,
          borderRadius: radius.pill,
          paddingLeft: space.lg,
          paddingRight: t.action ? space.xs : space.lg,
          minHeight: 48,
          maxWidth: '92%',
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
        }}
      >
        {t.icon && <Icon name={t.icon} size={18} color={colors.onPrimary} />}
        <Text variant="callout" style={{ color: colors.onPrimary, flexShrink: 1 }}>
          {t.message}
        </Text>
        {t.action && (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              t.action!.onPress();
              hide();
            }}
            style={{ paddingHorizontal: space.md, minHeight: 40, justifyContent: 'center', borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.12)' }}
          >
            <Text variant="label" style={{ color: colors.onPrimary }}>
              {t.action.label}
            </Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}
