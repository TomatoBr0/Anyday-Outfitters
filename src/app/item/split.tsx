/**
 * One photo, several pieces. People drag a box around each piece (or let the
 * optional AI detector draw them); each box is cropped into its own photo and
 * the whole batch goes to the item editor, pre-filled with any suggestions.
 */
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, View, useWindowDimensions, type GestureResponderEvent } from 'react-native';

import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { toast } from '@/components/Toast';
import { Badge, Button, NavHeader, Screen } from '@/components/ui';
import { getCategory } from '@/engine/categories';
import type { PickedPhoto } from '@/features/closet/picker';
import { detectConfigured, detectPieces, hintFrom, type FracBox } from '@/services/detectPieces';
import { processImage } from '@/services/images';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import { haptic } from '@/utils/haptics';

interface Marked {
  key: number;
  box: FracBox;
  hint?: PickedPhoto['hint'];
}

const MIN_FRAC = 0.04;
const MAX_PIECES = 12;

export default function SplitPhoto() {
  const params = useLocalSearchParams<{ photo?: string }>();
  const photo = useMemo<PickedPhoto | undefined>(() => {
    try {
      return params.photo ? JSON.parse(params.photo) : undefined;
    } catch {
      return undefined;
    }
  }, [params.photo]);
  const { colors } = useTheme();
  const { width: winW, height: winH } = useWindowDimensions();
  const custom = useStore((s) => s.preferences.customCategories);
  const [marked, setMarked] = useState<Marked[]>([]);
  const [drawing, setDrawing] = useState<FracBox | undefined>();
  const [detecting, setDetecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const nextKey = useRef(1);

  // Fit the photo inside the screen width and ~55% of its height.
  const aspect = photo ? photo.width / photo.height : 1;
  const maxW = winW - space.xl * 2;
  const dispW = Math.min(maxW, winH * 0.55 * aspect);
  const dispH = dispW / aspect;

  const [origin, setOrigin] = useState<{ x: number; y: number } | undefined>();
  const toFrac = (x: number, y: number) => ({ x: Math.min(1, Math.max(0, x / dispW)), y: Math.min(1, Math.max(0, y / dispH)) });
  const rect = (a: { x: number; y: number }, b: { x: number; y: number }): FracBox => ({
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  });
  const pointOf = (e: GestureResponderEvent) => toFrac(e.nativeEvent.locationX, e.nativeEvent.locationY);
  const finish = (e: GestureResponderEvent) => {
    const box = origin ? rect(origin, pointOf(e)) : undefined;
    setOrigin(undefined);
    setDrawing(undefined);
    if (!box || box.width < MIN_FRAC || box.height < MIN_FRAC) return;
    haptic.tap();
    setMarked((m) => (m.length >= MAX_PIECES ? m : [...m, { key: nextKey.current++, box }]));
  };

  if (!photo) {
    return (
      <Screen edges={[]} header={<NavHeader title="Several pieces" onBack={() => router.back()} backIcon="x" />}>
        <Text>That photo couldn’t be opened. Go back and try again.</Text>
      </Screen>
    );
  }

  const findPieces = async () => {
    setDetecting(true);
    try {
      const found = await detectPieces(photo);
      if (!found.length) {
        toast({ message: 'No clothes found. Draw a box around each piece instead.', icon: 'info' });
        return;
      }
      haptic.success();
      setMarked(found.slice(0, MAX_PIECES).map((p) => ({ key: nextKey.current++, box: p.box, hint: hintFrom(p) })));
    } catch {
      toast({ message: 'Couldn’t find pieces right now. Draw the boxes yourself.', icon: 'info' });
    } finally {
      setDetecting(false);
    }
  };

  const addAll = async () => {
    setSaving(true);
    try {
      const crops: PickedPhoto[] = [];
      for (const m of marked) {
        const crop = {
          originX: Math.round(m.box.x * photo.width),
          originY: Math.round(m.box.y * photo.height),
          width: Math.max(1, Math.round(m.box.width * photo.width)),
          height: Math.max(1, Math.round(m.box.height * photo.height)),
        };
        const out = await processImage(photo.uri, photo, { crop });
        crops.push({ uri: out.uri, width: out.width, height: out.height, hint: m.hint });
      }
      router.replace({ pathname: '/item/editor', params: { photos: JSON.stringify(crops) } });
    } catch {
      toast({ message: 'Couldn’t cut out those pieces. Try again.', icon: 'info' });
      setSaving(false);
    }
  };

  const shown = drawing ? [...marked.map((m) => m.box), drawing] : marked.map((m) => m.box);

  return (
    <Screen edges={[]} header={<NavHeader title="Several pieces" onBack={() => router.back()} backIcon="x" />}>
      <Text variant="body" color="textMuted" style={{ marginBottom: space.md }}>
        Drag a box around each piece. Each box becomes its own item.
      </Text>

      <View style={{ alignSelf: 'center', width: dispW, height: dispH, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surfaceAlt }}>
        <Image source={{ uri: photo.uri }} style={{ width: dispW, height: dispH }} contentFit="fill" />
        <View
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
          onResponderGrant={(e) => setOrigin(pointOf(e))}
          onResponderMove={(e) => origin && setDrawing(rect(origin, pointOf(e)))}
          onResponderRelease={finish}
          onResponderTerminate={() => {
            setOrigin(undefined);
            setDrawing(undefined);
          }}
          style={{ position: 'absolute', left: 0, top: 0, width: dispW, height: dispH }}
          accessible
          accessibilityLabel={`Photo. ${marked.length} ${marked.length === 1 ? 'piece' : 'pieces'} marked. Drag to mark another.`}
        >
          {shown.map((b, i) => (
            <View
              key={i}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: b.x * dispW,
                top: b.y * dispH,
                width: b.width * dispW,
                height: b.height * dispH,
                borderWidth: 2,
                borderColor: i < marked.length ? colors.sun : colors.onPrimary,
                borderStyle: i < marked.length ? 'solid' : 'dashed',
                borderRadius: 6,
                backgroundColor: 'rgba(255,255,255,0.08)',
              }}
            >
              {i < marked.length && (
                <View style={{ position: 'absolute', top: 4, left: 4, minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: colors.sun, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{i + 1}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {detectConfigured && (
        <View style={{ marginTop: space.lg, gap: 6 }}>
          <Button label={marked.length ? 'Find pieces again' : 'Find pieces for me'} icon="sparkles" variant="secondary" loading={detecting} disabled={saving} onPress={findPieces} full />
          <Text variant="caption" color="textSubtle" align="center">
            Sends a small copy of this photo to our server to spot each piece. Nothing is kept.
          </Text>
        </View>
      )}

      {marked.length > 0 && (
        <View style={{ marginTop: space.lg, gap: space.sm }}>
          {marked.map((m, i) => (
            <View key={m.key} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 6 }}>
              <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.sun, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong" numberOfLines={1}>
                  {m.hint?.name || (m.hint?.categoryId ? getCategory(m.hint.categoryId, custom).label : `Piece ${i + 1}`)}
                </Text>
                {m.hint ? <Badge label="Suggested — you can change it next" tone="sun" /> : <Text variant="caption" color="textMuted">You’ll pick the type next</Text>}
              </View>
              <Pressable
                onPress={() => setMarked((list) => list.filter((x) => x.key !== m.key))}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Remove piece ${i + 1}`}
                style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
              >
                <Icon name="x" size={18} color={colors.textMuted} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Button
        label={marked.length ? `Add ${marked.length} ${marked.length === 1 ? 'piece' : 'pieces'}` : 'Mark at least one piece'}
        iconRight="arrowRight"
        size="lg"
        full
        loading={saving}
        disabled={!marked.length || detecting}
        onPress={addAll}
        style={{ marginTop: space.xl, marginBottom: space.xl }}
      />
    </Screen>
  );
}
