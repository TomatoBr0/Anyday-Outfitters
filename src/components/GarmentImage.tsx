import { Image } from 'expo-image';
import { View, type ViewStyle } from 'react-native';

import { GarmentGlyph } from './GarmentGlyph';
import { resolveImage } from '@/services/images';
import { useTheme } from '@/theme/ThemeProvider';
import type { ClothingItem } from '@/types/models';

interface Props {
  item: ClothingItem;
  size?: number;
  style?: ViewStyle;
  rounded?: number;
  fill?: boolean;
  /** Fill the parent in both directions (non-square tiles). */
  stretch?: boolean;
}

/** A garment's photo, or its silhouette when there's no photo. */
export function GarmentImage({ item, size = 96, style, rounded = 14, fill, stretch }: Props) {
  const { colors } = useTheme();
  const uri = resolveImage(item.imagePath);
  const box: ViewStyle = stretch ? { flex: 1, width: '100%' } : fill ? { width: '100%', aspectRatio: 1 } : { width: size, height: size };
  return (
    <View
      style={[
        box,
        { borderRadius: rounded, overflow: 'hidden', backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={item.name}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={150} recyclingKey={item.id} />
      ) : (
        <View style={{ width: stretch ? '72%' : '78%', maxHeight: '86%', aspectRatio: 1 }}>
          <GarmentGlyph item={item} size="100%" />
        </View>
      )}
    </View>
  );
}

