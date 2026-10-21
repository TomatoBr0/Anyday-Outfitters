import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { toast } from '@/components/Toast';
import { Button, Chip, FieldLabel, NavHeader, TextField, ToggleRow } from '@/components/ui';
import { STYLE_LABELS } from '@/engine/scoring';
import { Avatar } from '@/features/social/components';
import { persistImage, processImage } from '@/services/images';
import { LIMITS, validateUsername } from '@/social/rules';
import { ME, useSocial } from '@/state/social';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';
import type { StyleTag } from '@/types/models';

export default function EditProfile() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const social = useSocial();
  const me = social.profiles.find((p) => p.id === ME);
  const prefs = useStore((s) => s.preferences);
  const [username, setUsername] = useState(me?.username ?? '');
  const [displayName, setDisplayName] = useState(me?.displayName ?? prefs.displayName ?? '');
  const [bio, setBio] = useState(me?.bio ?? '');
  // Style preferences are private by default; the user picks which to show.
  const [styleTags, setStyleTags] = useState<StyleTag[]>(me?.styleTags ?? []);
  const [isPrivate, setPrivate] = useState(me?.isPrivate ?? true);
  const [avatarUri, setAvatar] = useState(me?.avatarUri);
  const [agreed, setAgreed] = useState(!!me);

  const uname = username.trim().toLowerCase();
  const taken = social.profiles.some((p) => p.id !== ME && p.username === uname);
  const error = uname ? validateUsername(uname) ?? (taken ? 'That username is taken' : undefined) : undefined;
  const valid = !!uname && !error && displayName.trim().length > 0 && agreed;

  const pickAvatar = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (r.canceled) return;
    const a = r.assets[0];
    const out = await processImage(a.uri, { width: a.width, height: a.height }, {}, 400);
    setAvatar(await persistImage(out.uri, 'avatar'));
  };

  const save = () => {
    const data = { username: uname, displayName: displayName.trim().slice(0, LIMITS.displayName), bio: bio.trim().slice(0, LIMITS.bio), styleTags, isPrivate, avatarUri };
    if (me) social.updateProfile(data);
    else social.join(data);
    social.updateProfile({ bio: data.bio, avatarUri });
    toast({ message: me ? 'Profile updated' : 'Welcome to Getup Social', icon: 'check' });
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <NavHeader title={me ? 'Edit profile' : 'Create your profile'} onBack={() => router.back()} backIcon="x" />
      <ScrollView contentContainerStyle={{ padding: space.xl, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={pickAvatar} accessibilityRole="button" accessibilityLabel="Change profile photo" style={{ alignItems: 'center', gap: space.sm }}>
          <Avatar profile={{ id: ME, username: uname, displayName: displayName || '?', styleTags: [], isPrivate, createdAt: '', avatarUri, avatarColor: '#4F6249' }} size={88} />
          <Text variant="label" color="accent">
            {avatarUri ? 'Change photo' : 'Add photo (optional)'}
          </Text>
        </Pressable>
        <View style={{ gap: space.md, marginTop: space.lg }}>
          <TextField label="Username" placeholder="yourname" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} maxLength={24} hint={error ?? 'Lowercase letters, numbers, _ and .'} />
          <TextField label="Display name" placeholder="Your name" value={displayName} onChangeText={setDisplayName} maxLength={LIMITS.displayName} />
          <TextField label="Bio" placeholder="A line about your style" value={bio} onChangeText={setBio} maxLength={LIMITS.bio} multiline />
        </View>
        <FieldLabel>Styles to show on your profile</FieldLabel>
        <Text variant="caption" color="textMuted" style={{ marginBottom: space.sm }}>
          Your style preferences stay private unless you pick them here.
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {(Object.keys(STYLE_LABELS) as StyleTag[]).map((t) => (
            <Chip key={t} label={STYLE_LABELS[t]} size="sm" selected={styleTags.includes(t)} onPress={() => setStyleTags(styleTags.includes(t) ? styleTags.filter((x) => x !== t) : [...styleTags, t].slice(0, 5))} />
          ))}
        </View>
        <View style={{ marginTop: space.lg }}>
          <ToggleRow first title="Private account" subtitle="Only people you approve see your posts. Recommended for teens." value={isPrivate} onChange={setPrivate} />
          {!me && <ToggleRow title="I agree to the Community Guidelines" subtitle="Be kind. No harassment, nudity or hate." value={agreed} onChange={setAgreed} />}
        </View>
        {!me && (
          <Pressable onPress={() => router.push('/social/guidelines')} accessibilityRole="link" style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text variant="label" color="accent">
              Read the Community Guidelines
            </Text>
          </Pressable>
        )}
        <Text variant="caption" color="textSubtle" style={{ marginTop: space.sm }}>
          Your closet, laundry and outfit history are never shown on your profile.
        </Text>
        <Button label={me ? 'Save' : 'Create profile'} disabled={!valid} onPress={save} style={{ marginTop: space.xl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
