import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

export interface PickedPhoto {
  uri: string;
  width: number;
  height: number;
  /** Suggestions for this piece (from AI piece detection), applied in the editor. */
  hint?: { categoryId?: string; primaryColor?: string; name?: string };
}

function denied(what: string) {
  Alert.alert(
    `${what} access is off`,
    `Getup only uses your ${what.toLowerCase()} when you add clothes. You can turn access on in Settings, or add items manually.`,
    [
      { text: 'Not now', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
    ],
  );
}

/** `square` crops to one piece; pass false to keep the whole shot (several pieces). */
export async function pickFromCamera(square = true): Promise<PickedPhoto[] | undefined> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    denied('Camera');
    return;
  }
  const res = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', allowsEditing: square, aspect: [1, 1], quality: 0.9 });
  if (res.canceled) return;
  return res.assets.map((a) => ({ uri: a.uri, width: a.width, height: a.height }));
}

export async function pickFromLibrary(multiple = true, square = !multiple): Promise<PickedPhoto[] | undefined> {
  // iOS 14+ uses the system picker, which needs no library permission.
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    allowsMultipleSelection: multiple,
    selectionLimit: 20,
    allowsEditing: square,
    aspect: [1, 1],
    quality: 0.9,
  });
  if (res.canceled) return;
  return res.assets.map((a) => ({ uri: a.uri, width: a.width, height: a.height }));
}
