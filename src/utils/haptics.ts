import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { useStore } from '@/state/store';

const enabled = () => Platform.OS !== 'web' && useStore.getState().preferences.haptics;

export const haptic = {
  tap() {
    if (enabled()) Haptics.selectionAsync().catch(() => {});
  },
  impact() {
    if (enabled()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  success() {
    if (enabled()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  warning() {
    if (enabled()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  },
};
