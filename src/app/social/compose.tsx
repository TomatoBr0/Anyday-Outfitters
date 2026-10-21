/**
 * Share an outfit. Never publishes without the explicit Publish tap on the
 * preview step. Photos are re-encoded on device (strips EXIF/GPS metadata).
 * The draft autosaves so nothing is lost if the app closes.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GarmentImage } from '@/components/GarmentImage';
import { Icon } from '@/components/Icon';
import { Text } from '@/components/Text';
import { toast } from '@/components/Toast';
import { Button, Chip, FieldLabel, IconButton, NavHeader, Segmented, TextField, ToggleRow } from '@/components/ui';
import { itemsToTags } from '@/engine/recreate';
import { STYLE_LABELS } from '@/engine/scoring';
import { PostCard } from '@/features/social/components';
import { persistImage, processImage, resolveImage } from '@/services/images';
import { LIMITS } from '@/social/rules';
import { useSocial } from '@/state/social';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import type { ID, StyleTag } from '@/types/models';
import type { Audience, Post } from '@/types/social';
import { newId } from '@/utils/id';

const DRAFT_KEY = 'getup:v1:composeDraft';
interface Photo { uri: string; width: number; height: number }
interface Draft { photos: Photo[]; caption: string; styleTags: StyleTag[]; itemIds: ID[]; audience: Audience; brand: boolean; names: boolean }

export default function Compose() {
  const params = useLocalSearchParams<{ items?: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const closet = useStore((s) => s.items);
  const myStyles = useStore((s) => s.preferences.styles);
  const [step, setStep] = useState<'edit' | 'preview'>('edit');
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => ({
    photos: [],
    caption: '',
    styleTags: myStyles.slice(0, 2),
    itemIds: (params.items ?? '').split(',').filter(Boolean),
    audience: 'public',
    brand: false,
    names: false,
  }));
  const [restored, setRestored] = useState(false);

  // Restore an unfinished draft (unless we were opened with a specific outfit).
  useEffect(() => {
    AsyncStorage.getItem(DRAFT_KEY)
      .then((raw) => {
        if (raw && !params.items) setDraft(JSON.parse(raw));
      })
      .catch(() => {})
      .finally(() => setRestored(true));
  }, [params.items]);
  useEffect(() => {
    if (restored) AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft)).catch(() => {});
  }, [draft, restored]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const tagged = useMemo(() => closet.filter((i) => draft.itemIds.includes(i.id)), [closet, draft.itemIds]);

  const addPhotos = async (source: 'front' | 'back' | 'library') => {
    if (draft.photos.length >= LIMITS.images) return;
    setPicking(true);
    try {
      let res: ImagePicker.ImagePickerResult;
      if (source === 'library') {
        res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsMultipleSelection: true, selectionLimit: LIMITS.images - draft.photos.length, quality: 0.9 });
      } else {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Camera access is off', 'Turn it on in Settings to take outfit photos, or choose from your library.', [
            { text: 'Not now', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]);
          return;
        }
        res = await ImagePicker.launchCameraAsync({
          mediaTypes: 'images',
          cameraType: source === 'front' ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
          allowsEditing: true,
          aspect: [4, 5],
          quality: 0.9,
        });
      }
      if (!res.canceled) set('photos', [...draft.photos, ...res.assets.map((a) => ({ uri: a.uri, width: a.width, height: a.height }))].slice(0, LIMITS.images));
    } finally {
      setPicking(false);
    }
  };

  const previewPost: Post = {
    id: 'preview',
    authorId: 'me',
    images: draft.photos.map((p) => p.uri),
    caption: draft.caption,
    styleTags: draft.styleTags,
    items: itemsToTags(tagged, { brand: draft.brand, productName: draft.names }),
    audience: draft.audience,
    commentsDisabled: false,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
  };

  const publish = async () => {
    setBusy(true);
    try {
      // Re-encode each photo: resizes and strips location/EXIF metadata.
      const images: string[] = [];
      for (const p of draft.photos) {
        const out = await processImage(p.uri, { width: p.width, height: p.height }, {}, 1600);
        images.push(await persistImage(out.uri, `post-${newId()}`));
      }
      const post = useSocial.getState().createPost({ ...previewPost, images });
      await AsyncStorage.removeItem(DRAFT_KEY);
      toast({ message: draft.audience === 'private' ? 'Saved as a private draft' : 'Posted', icon: 'check' });
      router.replace({ pathname: '/social/post/[id]', params: { id: post.id } });
    } catch (e) {
      toast({ message: e instanceof Error ? e.message : 'Couldn’t post. Your draft is saved.', icon: 'info' });
    } finally {
      setBusy(false);
    }
  };

  const canContinue = draft.photos.length > 0 || tagged.length > 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <NavHeader
        title={step === 'edit' ? 'Share an outfit' : 'Preview'}
        onBack={() => (step === 'preview' ? setStep('edit') : router.back())}
        backIcon={step === 'edit' ? 'x' : 'chevronLeft'}
      />
      <ScrollView contentContainerStyle={{ padding: space.xl, paddingBottom: 140 }} keyboardShouldPersistTaps="handled">
        {step === 'edit' ? (
          <>
            <FieldLabel>{`Photos (${draft.photos.length}/${LIMITS.images})`}</FieldLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
              {draft.photos.map((p, i) => (
                <View key={p.uri}>
                  <Image source={{ uri: resolveImage(p.uri) }} style={{ width: 110, height: 138, borderRadius: radius.md }} contentFit="cover" accessibilityLabel={`Photo ${i + 1}`} />
                  <IconButton icon="x" label={`Remove photo ${i + 1}`} size={30} background={colors.surface} style={{ position: 'absolute', top: 4, right: 4 }} onPress={() => set('photos', draft.photos.filter((_, k) => k !== i))} />
                </View>
              ))}
              {draft.photos.length < LIMITS.images && (
                <View style={{ gap: 6 }}>
                  <Chip label="Camera" icon="camera" size="sm" onPress={() => !picking && addPhotos('back')} />
                  <Chip label="Selfie" icon="camera" size="sm" onPress={() => !picking && addPhotos('front')} />
                  <Chip label="Library" icon="image" size="sm" onPress={() => !picking && addPhotos('library')} />
                </View>
              )}
            </ScrollView>
            <Text variant="caption" color="textSubtle" style={{ marginTop: 6 }}>
              No photo? Tagged pieces are shown as a flat-lay. Location data is removed from photos before posting.
            </Text>

            <View style={{ marginTop: space.lg }}>
              <TextField label="Caption" placeholder="What’s the vibe?" value={draft.caption} onChangeText={(t) => set('caption', t)} multiline maxLength={LIMITS.caption} />
            </View>

            <FieldLabel>Style tags</FieldLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
              {(Object.keys(STYLE_LABELS) as StyleTag[]).map((t) => (
                <Chip key={t} label={STYLE_LABELS[t]} size="sm" selected={draft.styleTags.includes(t)} onPress={() => set('styleTags', draft.styleTags.includes(t) ? draft.styleTags.filter((x) => x !== t) : [...draft.styleTags, t].slice(0, LIMITS.tags))} />
              ))}
            </View>

            <FieldLabel>Tag pieces from your closet (optional)</FieldLabel>
            <Text variant="caption" color="textMuted" style={{ marginBottom: space.sm }}>
              Tags share category, color and style so others can recreate the look. Your closet itself stays private.
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
              {closet.map((i) => {
                const sel = draft.itemIds.includes(i.id);
                return (
                  <Pressable key={i.id} onPress={() => set('itemIds', sel ? draft.itemIds.filter((x) => x !== i.id) : [...draft.itemIds, i.id])} accessibilityRole="checkbox" accessibilityState={{ checked: sel }} accessibilityLabel={i.name}>
                    <View style={{ borderWidth: 2, borderColor: sel ? colors.text : 'transparent', borderRadius: radius.md, padding: 2 }}>
                      <GarmentImage item={i} size={64} rounded={radius.sm} />
                      {sel && (
                        <View style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                          <Icon name="check" size={11} color={colors.onPrimary} strokeWidth={2.6} />
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
            {tagged.length > 0 && (
              <View style={{ marginTop: space.sm }}>
                <ToggleRow first title="Show brands" subtitle="Off by default" value={draft.brand} onChange={(v) => set('brand', v)} />
                <ToggleRow title="Show item names" subtitle="e.g. “Grey hoodie”" value={draft.names} onChange={(v) => set('names', v)} />
              </View>
            )}

            <FieldLabel>Who can see this</FieldLabel>
            <Segmented<Audience>
              value={draft.audience}
              onChange={(v) => set('audience', v)}
              options={[
                { value: 'public', label: 'Everyone' },
                { value: 'followers', label: 'Followers' },
                { value: 'private', label: 'Only me' },
              ]}
            />
          </>
        ) : (
          <>
            <PostCard post={previewPost} />
            <Text variant="caption" color="textMuted" style={{ marginTop: space.md }}>
              {draft.audience === 'public' ? 'Everyone can see this.' : draft.audience === 'followers' ? 'Only your approved followers can see this.' : 'Only you can see this (a draft).'}
            </Text>
          </>
        )}
      </ScrollView>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: space.xl, paddingBottom: Math.max(insets.bottom, space.lg), backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border }}>
        {step === 'edit' ? (
          <Button label="Preview" iconRight="arrowRight" disabled={!canContinue} onPress={() => setStep('preview')} />
        ) : (
          <Button label={draft.audience === 'private' ? 'Save draft' : 'Publish'} icon="check" loading={busy} onPress={publish} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
