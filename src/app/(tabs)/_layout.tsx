import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { Text } from '@/components/Text';
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

function TabBar({ state, navigation }: any) {
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 10);

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
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          if (route.name === 'create') {
            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel="Create an outfit"
                accessibilityState={{ selected: focused }}
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
    </View>
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
