import { Fraunces_400Regular_Italic, Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastHost } from '@/components/Toast';
import { useSocial } from '@/state/social';
import { flushPersistence, useStore } from '@/state/store';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Fraunces_400Regular_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const coreReady = useStore((s) => s.hydrated);
  const socialReady = useSocial((s) => s.hydrated);
  const hydrated = coreReady && socialReady;

  useEffect(() => {
    useStore.getState().hydrate();
    useSocial.getState().hydrate();
    const sub = AppState.addEventListener('change', (st) => {
      if (st !== 'active') flushPersistence();
      else useStore.getState().refreshWeather();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (hydrated) useStore.getState().refreshWeather();
  }, [hydrated]);

  const ready = fontsLoaded && hydrated;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <Navigator />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Navigator() {
  const { colors, scheme } = useTheme();
  const onboarded = useStore((s) => s.preferences.onboarded);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inOnboarding = segments[0] === 'onboarding';
    if (!onboarded && !inOnboarding) router.replace('/onboarding');
    else if (onboarded && inOnboarding) router.replace('/');
  }, [onboarded, segments, router]);

  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, background: colors.background, card: colors.background, text: colors.text, border: colors.border, primary: colors.accent },
  };

  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="item/add" options={{ presentation: 'modal' }} />
        <Stack.Screen name="item/editor" options={{ presentation: 'modal' }} />
        <Stack.Screen name="item/split" options={{ presentation: 'modal' }} />
        <Stack.Screen name="event/edit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="trip/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="social/compose" options={{ presentation: 'modal' }} />
        <Stack.Screen name="social/edit-profile" options={{ presentation: 'modal' }} />
      </Stack>
      <ToastHost />
    </NavThemeProvider>
  );
}
