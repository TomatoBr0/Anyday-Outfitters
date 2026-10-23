import { BlurView } from 'expo-blur';
import { Tabs, router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { OptionCard } from '@/components/OptionCard';
import { Text } from '@/components/Text';
import { requireProfile } from '@/features/social/components';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';
import { haptic } from '@/utils/haptics';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Today', icon: 'today' },
  closet: { label: 'Closet', icon: 'hanger' },
  create: { label: 'Create', icon: 'plus' },
  social: { label: 'Social', icon: 'people' },
  profile: { label: 'You', icon: 'user' },
};

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="closet" />
      <Tabs.Screen name="create" />
      <Tabs.Screen name="social" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

function TabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 10);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={[styles.wrap, { paddingBottom: bottom }]} pointerEvents="box-none">
      <View style={[styles.bar, { borderColor: colors.border, shadowColor: colors.shadow }]}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={40} tint={scheme === 'dark' ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, { backgroundColor: colors.tabBar }]} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.tabBar }]} />
        )}
        {state.routes.map((route: any, index: number) => {
          const meta = TABS[route.name];
          if (!meta) return null;
          const focused = state.index === index;
          const onPress = () => {
            haptic.tap();
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          };
          if (route.name === 'create') {
            return (
              <Pressable
                key={route.key}
                onPress={() => {
                  haptic.tap();
                  setMenuOpen(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Create or log an outfit"
                accessibilityHint="Make an outfit, or log or post one"
                accessibilityState={{ selected: focused, expanded: menuOpen }}
                style={styles.item}
              >
                <View style={[styles.create, { backgroundColor: colors.primary }]}>
                  <Icon name="plus" size={24} color={colors.onPrimary} strokeWidth={2.2} />
                </View>
              </Pressable>
            );
          }
          const tint = focused ? colors.text : colors.textSubtle;
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityLabel={meta.label}
              accessibilityState={{ selected: focused }}
              style={styles.item}
            >
              <Icon name={meta.icon} size={23} color={tint} strokeWidth={focused ? 2 : 1.75} />
              <Text style={{ fontFamily: focused ? fonts.semibold : fonts.medium, fontSize: 10.5, color: tint, marginTop: 2 }} maxFontSizeMultiplier={1.2}>
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <CreateMenu
        visible={menuOpen}
        bottom={bottom + 66 + 12}
        onClose={() => setMenuOpen(false)}
        onMake={() => {
          setMenuOpen(false);
          const route = state.routes.find((r) => r.name === 'create');
          if (route && state.routes[state.index]?.key !== route.key) navigateToTab(route.key);
        }}
        onLog={() => {
          setMenuOpen(false);
          if (requireProfile()) router.push('/social/compose');
        }}
      />
    </View>
  );
}

function CreateMenu({ visible, bottom, onClose, onMake, onLog }: { visible: boolean; bottom: number; onClose: () => void; onMake: () => void; onLog: () => void }) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(150)} style={StyleSheet.absoluteFill}>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close menu" style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} />
      </Animated.View>
      <Animated.View entering={FadeInDown.duration(200)} style={{ position: 'absolute', left: 14, right: 14, bottom, gap: 10 }}>
        <OptionCard primary icon="sparkles" title="Make an outfit" body="Build a look from your closet" onPress={onMake} />
        <OptionCard icon="camera" title="Log or post a fit" body="Snap what you’re wearing. Keep it private or share it" onPress={onLog} />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 14 },
  bar: {
    flexDirection: 'row',
    height: 66,
    borderRadius: 33,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' },
  create: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
});
