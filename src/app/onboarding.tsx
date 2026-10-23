/**
 * Seven quick steps, every one skippable except the welcome. Collects only what
 * changes recommendations: which clothes to suggest, styles, fits, temperature
 * comfort, location, and a first few closet items.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GarmentGlyph } from '@/components/GarmentGlyph';
import { Icon, type IconName } from '@/components/Icon';
import { LogoMark } from '@/components/Logo';
import { OptionCard } from '@/components/OptionCard';
import { Text } from '@/components/Text';
import { Button, Chip, IconButton, Segmented, TextField } from '@/components/ui';
import { BRAND } from '@/config/brand';
import { SAMPLE_CLOSET } from '@/data/sampleCloset';
import { suitsWardrobe } from '@/engine/categories';
import { STYLE_LABELS } from '@/engine/scoring';
import { FIT_LABELS } from '@/features/closet/labels';
import { pickFromCamera, pickFromLibrary } from '@/features/closet/picker';
import { styleExamplesFor } from '@/features/onboarding/styleExamples';
import { CitySearch } from '@/features/weather/CitySearch';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, space } from '@/theme/tokens';
import type { CategoryGroup, ClothesFor, ColdSensitivity, Fit, StyleTag, TempUnit } from '@/types/models';
import { haptic } from '@/utils/haptics';

const STEPS = ['welcome', 'wardrobe', 'style', 'fit', 'temp', 'location', 'closet'] as const;

export default function Onboarding() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const prefs = useStore((s) => s.preferences);
  const [step, setStep] = useState(0);
  const [clothesFor, setClothesFor] = useState<ClothesFor>(prefs.clothesFor);
  const [name, setName] = useState(prefs.displayName ?? '');
  const [styles, setStyles] = useState<StyleTag[]>(prefs.styles);
  const [fits, setFits] = useState<Partial<Record<CategoryGroup, Fit>>>(prefs.fitByGroup);
  const [cold, setCold] = useState<ColdSensitivity>(prefs.coldSensitivity);
  const [unit, setUnit] = useState<TempUnit>(prefs.tempUnit);

  const set = useStore.getState().setPreferences;
  const next = () => {
    haptic.tap();
    const current = STEPS[step];
    if (current === 'wardrobe') set({ clothesFor });
    if (current === 'style') set({ styles, displayName: name.trim() || undefined });
    if (current === 'fit') set({ fitByGroup: fits });
    if (current === 'temp') set({ coldSensitivity: cold, tempUnit: unit });
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const back = () => setStep((s) => Math.max(0, s - 1));
  const finish = (then?: () => void) => {
    set({ onboarded: true });
    haptic.success();
    then?.();
  };

  const kind = STEPS[step];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingTop: insets.top + space.sm, paddingHorizontal: space.xl }}>
        {step > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <IconButton icon="chevronLeft" label="Back" onPress={back} />
            <View style={{ flex: 1, flexDirection: 'row', gap: 4 }} accessible accessibilityLabel={`Step ${step} of ${STEPS.length - 1}`}>
              {STEPS.slice(1).map((_, i) => (
                <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < step ? colors.text : colors.border }} />
              ))}
            </View>
            {kind !== 'closet' ? (
              <Pressable onPress={next} hitSlop={10} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
                <Text variant="label" color="textMuted">
                  Skip
                </Text>
              </Pressable>
            ) : (
              <View style={{ width: 30 }} />
            )}
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: 140, flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View key={kind} entering={step === 0 ? FadeIn.duration(400) : FadeInRight.duration(260)} style={{ flex: 1 }}>
          {kind === 'welcome' && <Welcome />}
          {kind === 'wardrobe' && <WardrobeStep value={clothesFor} onChange={setClothesFor} />}
          {kind === 'style' && <StyleStep name={name} setName={setName} styles={styles} setStyles={setStyles} clothesFor={clothesFor} />}
          {kind === 'fit' && <FitStep fits={fits} setFits={setFits} clothesFor={clothesFor} />}
          {kind === 'temp' && <TempStep cold={cold} setCold={setCold} unit={unit} setUnit={setUnit} />}
          {kind === 'location' && <LocationStep onDone={next} />}
          {kind === 'closet' && <ClosetStep finish={finish} />}
        </Animated.View>
      </ScrollView>

      {kind !== 'closet' && kind !== 'location' && (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.xl, paddingBottom: Math.max(insets.bottom, space.lg), paddingTop: space.md, backgroundColor: colors.background }}>
          <Button label={step === 0 ? 'Get started' : 'Continue'} iconRight="arrowRight" size="lg" onPress={next} full />
          {step === 0 && (
            <Text variant="caption" color="textSubtle" align="center" style={{ marginTop: space.md }}>
              Takes about a minute. Everything stays on your phone.
            </Text>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function Welcome() {
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const points: { icon: IconName; title: string; body: string }[] = [
    { icon: 'hanger', title: 'Your closet, organized', body: 'Snap what you own. Search it, filter it, track what’s clean.' },
    { icon: 'heart', title: 'Your style, understood', body: 'Suggestions shaped by your taste, the weather and your day.' },
    { icon: 'today', title: 'Your outfits, ready', body: 'A complete look every morning, from clothes you already have.' },
  ];
  return (
    <View style={{ paddingTop: height * 0.08 }}>
      <Animated.View entering={FadeInDown.duration(500)} style={{ alignItems: 'flex-start' }}>
        <View style={{ width: 92, height: 92, borderRadius: 24, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}>
          <LogoMark size={72} />
        </View>
        <Text variant="hero" style={{ marginTop: space.xxl }}>
          Get up.{'\n'}Get dressed.{'\n'}
          <Text variant="hero" style={{ color: colors.sun, fontFamily: 'Fraunces_400Regular_Italic' }}>
            Get going.
          </Text>
        </Text>
        <Text variant="body" color="textMuted" style={{ marginTop: space.md, maxWidth: 320 }}>
          {BRAND.name} turns the clothes you already own into a ready-to-wear outfit every morning.
        </Text>
      </Animated.View>
      <View style={{ marginTop: space.xxl, gap: space.lg }}>
        {points.map((p, i) => (
          <Animated.View key={p.title} entering={FadeInDown.delay(250 + i * 120).duration(400)} style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={p.icon} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="heading">{p.title}</Text>
              <Text variant="caption" color="textMuted">
                {p.body}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

function StepTitle({ title, body }: { title: string; body?: string }) {
  return (
    <View style={{ marginTop: space.xl, marginBottom: space.xl }}>
      <Text variant="display" accessibilityRole="header">
        {title}
      </Text>
      {body && (
        <Text variant="body" color="textMuted" style={{ marginTop: space.sm }}>
          {body}
        </Text>
      )}
    </View>
  );
}

function WardrobeStep({ value, onChange }: { value: ClothesFor; onChange: (v: ClothesFor) => void }) {
  const opts: { v: ClothesFor; title: string; body: string }[] = [
    { v: 'mens', title: 'Men’s clothes', body: 'No dresses or skirts in your picks' },
    { v: 'womens', title: 'Women’s clothes', body: 'Dresses and skirts included' },
    { v: 'all', title: 'A mix of both', body: 'We’ll suggest from everything you add' },
  ];
  return (
    <View>
      <StepTitle title="What do you usually wear?" body="So your outfits match what’s actually in your closet. Change it any time in Style & fit." />
      <View style={{ gap: space.md }}>
        {opts.map((o) => (
          <RadioCard key={o.v} title={o.title} body={o.body} selected={value === o.v} onPress={() => onChange(o.v)} />
        ))}
      </View>
    </View>
  );
}

function RadioCard({ title, body, icon, selected, onPress }: { title: string; body: string; icon?: IconName; selected: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${title}. ${body}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 2, borderColor: selected ? colors.text : colors.border }}
    >
      {icon && <Icon name={icon} size={26} color={colors.sun} />}
      <View style={{ flex: 1 }}>
        <Text variant="heading">{title}</Text>
        <Text variant="caption" color="textMuted">
          {body}
        </Text>
      </View>
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: selected ? colors.text : colors.borderStrong, alignItems: 'center', justifyContent: 'center' }}>
        {selected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.text }} />}
      </View>
    </Pressable>
  );
}

function StyleStep({ name, setName, styles, setStyles, clothesFor }: { name: string; setName: (s: string) => void; styles: StyleTag[]; setStyles: (s: StyleTag[]) => void; clothesFor: ClothesFor }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const cardW = (width - space.xl * 2 - space.md) / 2;
  return (
    <View>
      <StepTitle title="What do you like to wear?" body="Pick as many as feel like you. Mixing is encouraged." />
      <TextField label="What should we call you? (optional)" placeholder="First name" value={name} onChangeText={setName} autoCapitalize="words" returnKeyType="done" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.xl }}>
        {styleExamplesFor(clothesFor).map((ex) => {
          const sel = styles.includes(ex.tag);
          return (
            <Pressable
              key={ex.tag}
              onPress={() => {
                haptic.tap();
                setStyles(sel ? styles.filter((s) => s !== ex.tag) : [...styles, ex.tag]);
              }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: sel }}
              accessibilityLabel={`${STYLE_LABELS[ex.tag]}: ${ex.blurb}`}
              style={({ pressed }) => ({
                width: cardW,
                borderRadius: radius.lg,
                padding: space.md,
                backgroundColor: sel ? colors.surface : colors.surfaceAlt,
                borderWidth: 2,
                borderColor: sel ? colors.text : 'transparent',
                transform: [{ scale: pressed ? 0.97 : 1 }],
              })}
            >
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', height: 92, alignItems: 'center' }}>
                {ex.pieces.map((p, i) => (
                  <GarmentGlyph key={i} item={{ categoryId: p.categoryId, primaryColor: p.primaryColor, secondaryColors: p.secondaryColors ?? [], pattern: p.pattern ?? 'solid' }} size={ex.pieces.length > 3 ? 40 : 46} />
                ))}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.sm }}>
                <Text variant="bodyStrong">{STYLE_LABELS[ex.tag]}</Text>
                {sel && <Icon name="check" size={18} strokeWidth={2.4} />}
              </View>
              <Text variant="caption" color="textMuted" numberOfLines={2}>
                {ex.blurb}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function FitStep({ fits, setFits, clothesFor }: { fits: Partial<Record<CategoryGroup, Fit>>; setFits: (f: Partial<Record<CategoryGroup, Fit>>) => void; clothesFor: ClothesFor }) {
  const groups: { g: CategoryGroup; label: string }[] = [
    { g: 'tops', label: 'Tops' },
    { g: 'bottoms', label: 'Bottoms' },
    { g: 'other', label: clothesFor === 'mens' ? 'Suits & sets' : 'Dresses & sets' },
  ];
  return (
    <View>
      <StepTitle title="How do you like things to fit?" body="Used as a tiebreaker when two outfits are equally good. Skip any that don’t apply." />
      {groups.map(({ g, label }) => (
        <View key={g} style={{ marginBottom: space.xl }}>
          <Text variant="heading" style={{ marginBottom: space.sm }}>
            {label}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {(Object.keys(FIT_LABELS) as Fit[]).map((f) => (
              <Chip key={f} label={FIT_LABELS[f]} selected={fits[g] === f} onPress={() => setFits({ ...fits, [g]: fits[g] === f ? undefined : f })} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function TempStep({ cold, setCold, unit, setUnit }: { cold: ColdSensitivity; setCold: (c: ColdSensitivity) => void; unit: TempUnit; setUnit: (u: TempUnit) => void }) {
  const opts: { v: ColdSensitivity; title: string; body: string; icon: IconName }[] = [
    { v: 'runsCold', title: 'Chilly — I’d want a layer', body: 'We’ll lean warmer', icon: 'snow' },
    { v: 'neutral', title: 'Just right', body: 'We’ll go by the forecast', icon: 'cloud' },
    { v: 'runsWarm', title: 'Warm — t-shirt is plenty', body: 'We’ll keep it lighter', icon: 'sun' },
  ];
  return (
    <View>
      <StepTitle title={`At ${unit === 'F' ? '65°F' : '18°C'} in a t-shirt, you feel…`} body="Two people can dress very differently for the same weather." />
      <Segmented
        value={unit}
        onChange={setUnit}
        options={[
          { value: 'F', label: '°F' },
          { value: 'C', label: '°C' },
        ]}
        style={{ marginBottom: space.xl, alignSelf: 'flex-start', width: 160 }}
      />
      <View style={{ gap: space.md }}>
        {opts.map((o) => (
          <RadioCard key={o.v} title={o.title} body={o.body} icon={o.icon} selected={cold === o.v} onPress={() => setCold(o.v)} />
        ))}
      </View>
    </View>
  );
}

function LocationStep({ onDone }: { onDone: () => void }) {
  const { colors } = useTheme();
  const loc = useStore((s) => s.preferences.location);
  return (
    <View>
      <StepTitle title="Where are you getting dressed?" />
      <View style={{ flexDirection: 'row', gap: space.md, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.surfaceAlt, marginBottom: space.xl }}>
        <Icon name="info" size={20} color={colors.textMuted} />
        <Text variant="caption" color="textMuted" style={{ flex: 1 }}>
          Only used to fetch your local forecast, so rain means boots and cold means layers. We round it to your area and never track you in the background.
        </Text>
      </View>
      {loc ? (
        <View style={{ gap: space.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.accentSoft }}>
            <Icon name="check" color={colors.accent} />
            <Text variant="bodyStrong" style={{ flex: 1 }}>
              {loc.name}
            </Text>
          </View>
          <Button label="Continue" iconRight="arrowRight" size="lg" onPress={onDone} full />
        </View>
      ) : (
        <CitySearch onPick={(l) => useStore.getState().setPreferences({ location: l })} />
      )}
      {!loc && (
        <Button label="Skip for now" variant="ghost" onPress={onDone} style={{ marginTop: space.lg }} />
      )}
    </View>
  );
}

function ClosetStep({ finish }: { finish: (then?: () => void) => void }) {
  const count = useStore((s) => s.items.length);
  const clothesFor = useStore((s) => s.preferences.clothesFor);
  const sampleCount = SAMPLE_CLOSET.filter((p) => suitsWardrobe(p.categoryId, clothesFor)).length;
  const go = async (fn: () => Promise<{ uri: string; width: number; height: number }[] | undefined>) => {
    const photos = await fn();
    if (!photos?.length) return;
    finish(() => {
      router.replace('/');
      setTimeout(() => router.push({ pathname: '/item/editor', params: { photos: JSON.stringify(photos) } }), 50);
    });
  };
  return (
    <View>
      <StepTitle title="Let’s add a few pieces" body="Five or six favorites is enough for your first outfit. You can add the rest any time." />
      <View style={{ gap: space.md }}>
        <OptionCard primary icon="camera" title="Take photos" body="One piece at a time" onPress={() => go(pickFromCamera)} />
        <OptionCard icon="image" title="Choose from library" body="Select several at once" onPress={() => go(() => pickFromLibrary(true))} />
        <OptionCard
          icon="hanger"
          title="Start with a sample closet"
          body={`Explore with ${sampleCount} example pieces — remove later`}
          onPress={() => {
            if (!count) useStore.getState().loadSamples();
            finish(() => router.replace('/'));
          }}
        />
        <OptionCard
          icon="edit"
          title="Add without photos"
          body="Describe pieces quickly"
          onPress={() =>
            finish(() => {
              router.replace('/');
              setTimeout(() => router.push({ pathname: '/item/editor', params: { manual: '1' } }), 50);
            })
          }
        />
      </View>
      <Button label="I’ll do this later" variant="ghost" style={{ marginTop: space.xl }} onPress={() => finish(() => router.replace('/'))} />
    </View>
  );
}
