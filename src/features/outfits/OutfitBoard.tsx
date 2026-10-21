/**
 * Editorial flat-lay of an outfit: layers on the left, bottoms and shoes on
 * the right, accessories in a small row. Tiles can be tapped (lock/swap).
 */
import { Pressable, View } from 'react-native';

import { GarmentImage } from '@/components/GarmentImage';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { getCategory } from '@/engine/categories';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import type { ClothingItem, ID } from '@/types/models';

interface Props {
  items: ClothingItem[];
  lockedIds?: ID[];
  onItemPress?: (item: ClothingItem) => void;
  compact?: boolean;
}

export function OutfitBoard({ items, lockedIds = [], onItemPress, compact }: Props) {
  const custom = useStore((s) => s.preferences.customCategories);
  const slot = (i: ClothingItem) => getCategory(i.categoryId, custom).slot;
  const outer = items.filter((i) => slot(i) === 'outerwear');
  const top = items.filter((i) => slot(i) === 'top' || slot(i) === 'onePiece');
  const bottom = items.filter((i) => slot(i) === 'bottom');
  const shoes = items.filter((i) => slot(i) === 'footwear');
  const acc = items.filter((i) => slot(i) === 'accessory');

  const left = [...outer, ...top];
  const right = [...bottom, ...shoes];
  const gap = compact ? 5 : space.sm;
  // Asymmetric flat-lay: layers get the wide column, bottoms + shoes the narrow one.
  // A fixed aspect ratio keeps the whole look (and the CTA below it) on screen.
  const cols = [left, right].filter((c) => c.length);

  return (
    <View style={{ gap }}>
      <View style={{ flexDirection: 'row', gap, aspectRatio: compact ? 1.05 : 1.32 }}>
        {cols.map((col, ci) => (
          <View key={ci} style={{ flex: cols.length === 2 && ci === 0 ? 1.35 : 1, gap }}>
            {col.map((i) => (
              <View key={i.id} style={{ flex: 1 }}>
                <BoardTile item={i} locked={lockedIds.includes(i.id)} onPress={onItemPress} compact={compact} />
              </View>
            ))}
          </View>
        ))}
      </View>
      {acc.length > 0 && !compact && (
        <View style={{ flexDirection: 'row', gap }}>
          {acc.map((i) => (
            <View key={i.id} style={{ width: 56, height: 56 }}>
              <BoardTile item={i} locked={lockedIds.includes(i.id)} onPress={onItemPress} small />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function BoardTile({ item, locked, onPress, compact, small }: { item: ClothingItem; locked: boolean; onPress?: (item: ClothingItem) => void; compact?: boolean; small?: boolean }) {
  const { colors } = useTheme();
  const content = (
    <View style={{ flex: 1 }}>
      <GarmentImage item={item} stretch rounded={compact || small ? radius.sm : radius.md} />
      {locked && (
        <View style={{ position: 'absolute', top: 6, right: 6, backgroundColor: colors.primary, borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="lock" size={13} color={colors.onPrimary} strokeWidth={2.2} />
        </View>
      )}
      {!item.clean && !small && (
        <View style={{ position: 'absolute', bottom: 6, left: 6, backgroundColor: colors.sunSoft, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
          <Text variant="label" style={{ fontSize: 10, color: colors.sun }}>
            In hamper
          </Text>
        </View>
      )}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}${locked ? ', locked' : ''}`}
      accessibilityHint="Lock or swap this piece"
      style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.8 : 1 })}
    >
      {content}
    </Pressable>
  );
}

/** Small horizontal strip of thumbnails used in lists. */
export function OutfitStrip({ items, size = 56 }: { items: ClothingItem[]; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }} accessibilityLabel={items.map((i) => i.name).join(', ')}>
      {items.slice(0, 5).map((i) => (
        <GarmentImage key={i.id} item={i} size={size} rounded={10} />
      ))}
    </View>
  );
}
