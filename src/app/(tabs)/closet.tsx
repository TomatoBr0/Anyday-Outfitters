import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GarmentImage } from '@/components/GarmentImage';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { Button, Chip, EmptyState, IconButton, PageHeader, TextField } from '@/components/ui';
import { GROUP_LABELS, allCategories, getCategory } from '@/engine/categories';
import { COLORS, getColor } from '@/engine/colors';
import { STYLE_LABELS } from '@/engine/scoring';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import type { CategoryGroup, ClothingItem, StyleTag } from '@/types/models';
import { relativeDay } from '@/utils/dates';
import { haptic } from '@/utils/haptics';

const ORDER = new Map(allCategories().map((c, i) => [c.id, i]));
const catOrder = (id: string) => ORDER.get(id) ?? 999;

type Status = 'all' | 'favorites' | 'clean' | 'dirty';
type Sort = 'recent' | 'most' | 'least' | 'name';

const SORTS: { value: Sort; label: string }[] = [
  { value: 'recent', label: 'Recently added' },
  { value: 'most', label: 'Most worn' },
  { value: 'least', label: 'Least worn' },
  { value: 'name', label: 'A–Z' },
];

export default function Closet() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const items = useStore((s) => s.items);
  const custom = useStore((s) => s.preferences.customCategories);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<CategoryGroup | 'all'>('all');
  const [status, setStatus] = useState<Status>('all');
  const [color, setColor] = useState<string | undefined>();
  const [style, setStyle] = useState<StyleTag | undefined>();
  const [sort, setSort] = useState<Sort>('recent');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((i) => {
      const cat = getCategory(i.categoryId, custom);
      if (group !== 'all' && cat.group !== group) return false;
      if (status === 'favorites' && !i.favorite) return false;
      if (status === 'clean' && !(i.clean && i.availability === 'available')) return false;
      if (status === 'dirty' && i.clean) return false;
      if (color && i.primaryColor !== color && !i.secondaryColors.includes(color)) return false;
      if (style && !i.styleTags.includes(style)) return false;
      if (q) {
        const hay = `${i.name} ${cat.label} ${i.brand ?? ''} ${getColor(i.primaryColor).label} ${i.subcategory ?? ''} ${i.notes ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    return list.sort((a, b) => {
      switch (sort) {
        case 'most':
          return b.wearCount - a.wearCount;
        case 'least':
          return a.wearCount - b.wearCount || (a.lastWornOn ?? '').localeCompare(b.lastWornOn ?? '');
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          // Items added together (e.g. a batch or the sample closet) group by category.
          return b.createdAt.localeCompare(a.createdAt) || catOrder(a.categoryId) - catOrder(b.categoryId);
      }
    });
  }, [items, query, group, status, color, style, sort, custom]);

  const activeFilters = (color ? 1 : 0) + (style ? 1 : 0) + (sort !== 'recent' ? 1 : 0);
  const cols = width > 700 ? 4 : 2;
  const tileW = (width - space.xl * 2 - space.md * (cols - 1)) / cols;

  const header = (
    <View>
      <View style={{ paddingHorizontal: space.xl }}>
        <PageHeader
          title="Closet"
          subtitle={`${items.length} ${items.length === 1 ? 'piece' : 'pieces'}`}
          right={
            <>
              <IconButton icon={view === 'grid' ? 'list' : 'grid'} label={view === 'grid' ? 'List view' : 'Grid view'} onPress={() => setView(view === 'grid' ? 'list' : 'grid')} />
              <IconButton icon="plus" label="Add clothes" background={colors.primary} color={colors.onPrimary} onPress={() => router.push('/item/add')} />
            </>
          }
        />
        <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <TextField icon="search" placeholder="Search your closet" value={query} onChangeText={setQuery} returnKeyType="search" clearButtonMode="while-editing" accessibilityLabel="Search your closet" />
          </View>
          <Pressable
            onPress={() => setShowFilters((s) => !s)}
            accessibilityRole="button"
            accessibilityLabel={`Filters${activeFilters ? `, ${activeFilters} active` : ''}`}
            accessibilityState={{ expanded: showFilters }}
            style={{ width: 48, height: 48, borderRadius: radius.md, borderWidth: 1, borderColor: activeFilters ? colors.primary : colors.border, backgroundColor: showFilters ? colors.surfaceAlt : colors.surface, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="sliders" size={20} />
            {activeFilters > 0 && (
              <View style={{ position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.sun, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{activeFilters}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.xl, paddingTop: space.md }}>
        <Chip label="All" size="sm" selected={group === 'all'} onPress={() => setGroup('all')} />
        {(Object.keys(GROUP_LABELS) as CategoryGroup[]).map((g) => (
          <Chip key={g} label={GROUP_LABELS[g]} size="sm" selected={group === g} onPress={() => setGroup(group === g ? 'all' : g)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.xl, paddingTop: space.sm }}>
        <Chip label="Favorites" icon="heart" size="sm" selected={status === 'favorites'} onPress={() => setStatus(status === 'favorites' ? 'all' : 'favorites')} />
        <Chip label="Ready to wear" size="sm" selected={status === 'clean'} onPress={() => setStatus(status === 'clean' ? 'all' : 'clean')} />
        <Chip label="In hamper" icon="basket" size="sm" selected={status === 'dirty'} onPress={() => setStatus(status === 'dirty' ? 'all' : 'dirty')} />
      </ScrollView>

      {showFilters && (
        <View style={{ paddingTop: space.md, gap: space.sm }}>
          <Text variant="label" color="textMuted" style={{ paddingHorizontal: space.xl }}>
            Color
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.xl }}>
            {COLORS.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => {
                  haptic.tap();
                  setColor(color === c.id ? undefined : c.id);
                }}
                accessibilityRole="button"
                accessibilityLabel={c.label}
                accessibilityState={{ selected: color === c.id }}
                style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: color === c.id ? colors.text : 'transparent', alignItems: 'center', justifyContent: 'center' }}
              >
                <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c.hex, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)' }} />
              </Pressable>
            ))}
          </ScrollView>
          <Text variant="label" color="textMuted" style={{ paddingHorizontal: space.xl, marginTop: space.xs }}>
            Style
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.xl }}>
            {(Object.keys(STYLE_LABELS) as StyleTag[]).map((t) => (
              <Chip key={t} label={STYLE_LABELS[t]} size="sm" selected={style === t} onPress={() => setStyle(style === t ? undefined : t)} />
            ))}
          </ScrollView>
          <Text variant="label" color="textMuted" style={{ paddingHorizontal: space.xl, marginTop: space.xs }}>
            Sort
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.xl }}>
            {SORTS.map((s) => (
              <Chip key={s.value} label={s.label} size="sm" selected={sort === s.value} onPress={() => setSort(s.value)} />
            ))}
          </ScrollView>
        </View>
      )}
      <View style={{ height: space.lg }} />
    </View>
  );

  if (!items.length) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <SafeTop />
        {header}
        <EmptyState
          icon="hanger"
          title="Start your closet"
          body="Snap a photo of a few favorites. You don’t need everything — five pieces is enough to get outfits."
          action={
            <View style={{ gap: space.sm, alignItems: 'center' }}>
              <Button label="Add clothes" icon="camera" onPress={() => router.push('/item/add')} />
              <Button label="Load sample closet" variant="ghost" onPress={() => useStore.getState().loadSamples()} />
            </View>
          }
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeTop />
      <FlatList
        key={`${view}-${cols}`}
        data={filtered}
        keyExtractor={(i) => i.id}
        numColumns={view === 'grid' ? cols : 1}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: 120 }}
        columnWrapperStyle={view === 'grid' ? { gap: space.md, paddingHorizontal: space.xl } : undefined}
        ItemSeparatorComponent={() => <View style={{ height: view === 'grid' ? space.lg : 0 }} />}
        ListEmptyComponent={
          <EmptyState icon="search" title="Nothing matches" body="Try clearing a filter or searching for something else." />
        }
        renderItem={({ item }) => (view === 'grid' ? <GridTile item={item} width={tileW} /> : <ListTile item={item} />)}
        initialNumToRender={12}
        windowSize={7}
      />
    </View>
  );
}

function SafeTop() {
  const insets = useSafeAreaInsets();
  return <View style={{ height: insets.top }} />;
}

function statusLabel(i: ClothingItem) {
  if (i.availability !== 'available') return { lent: 'Lent out', repair: 'In repair', storage: 'In storage' }[i.availability as 'lent' | 'repair' | 'storage'];
  if (!i.clean) return 'In hamper';
  if (i.stain) return i.stain === 'light' ? 'Light stain' : i.stain === 'bad' ? 'Bad stain' : 'Stained';
  return undefined;
}

function GridTile({ item, width }: { item: ClothingItem; width: number }) {
  const { colors } = useTheme();
  const st = statusLabel(item);
  return (
    <Pressable
      onPress={() => router.push(`/item/${item.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}${item.favorite ? ', favorite' : ''}${st ? `, ${st}` : ''}`}
      style={({ pressed }) => ({ width, opacity: pressed ? 0.85 : 1 })}
    >
      <View>
        <GarmentImage item={item} size={width} rounded={radius.lg} style={{ opacity: !item.clean || item.availability !== 'available' ? 0.55 : 1 }} />
        {item.favorite && (
          <View style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="heartFill" size={15} color={colors.sun} />
          </View>
        )}
        {st && (
          <View style={{ position: 'absolute', bottom: 8, left: 8, backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text variant="label" style={{ fontSize: 11 }}>
              {st}
            </Text>
          </View>
        )}
      </View>
      <Text variant="callout" numberOfLines={1} style={{ marginTop: 8 }}>
        {item.name}
      </Text>
      <Text variant="caption" color="textSubtle" numberOfLines={1}>
        {item.wearCount ? `Worn ${item.wearCount}×` : 'Not worn yet'}
      </Text>
    </Pressable>
  );
}

function ListTile({ item }: { item: ClothingItem }) {
  const { colors } = useTheme();
  const custom = useStore((s) => s.preferences.customCategories);
  const st = statusLabel(item);
  return (
    <Pressable
      onPress={() => router.push(`/item/${item.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}${st ? `, ${st}` : ''}`}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.xl, paddingVertical: space.sm, opacity: pressed ? 0.7 : 1 })}
    >
      <GarmentImage item={item} size={64} rounded={radius.md} />
      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {item.name}
        </Text>
        <Text variant="caption" color="textMuted" numberOfLines={1}>
          {getCategory(item.categoryId, custom).label} · {getColor(item.primaryColor).label}
          {item.lastWornOn ? ` · worn ${relativeDay(item.lastWornOn).toLowerCase()}` : ''}
        </Text>
      </View>
      {st && (
        <Text variant="label" style={{ color: colors.sun }}>
          {st}
        </Text>
      )}
      {item.favorite && <Icon name="heartFill" size={16} color={colors.sun} />}
    </Pressable>
  );
}
