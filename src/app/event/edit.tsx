import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { DateStrip } from '@/components/DateStrip';
import { Text } from '@/components/Text';
import { toast } from '@/components/Toast';
import { Button, Chip, FieldLabel, NavHeader, TextField } from '@/components/ui';
import { OCCASION_FORMALITY, OCCASION_LABELS } from '@/engine/scoring';
import { FORMALITY_LABELS } from '@/features/closet/labels';
import { useStore } from '@/state/store';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';
import type { Formality, Occasion } from '@/types/models';
import { toISODate } from '@/utils/dates';

const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;

export default function EditEvent() {
  const params = useLocalSearchParams<{ id?: string; date?: string }>();
  const { colors } = useTheme();
  const existing = useStore((s) => (params.id ? s.events.find((e) => e.id === params.id) : undefined));
  const [title, setTitle] = useState(existing?.title ?? '');
  const [date, setDate] = useState(existing?.date ?? params.date ?? toISODate());
  const [time, setTime] = useState(existing?.time ?? '');
  const [location, setLocation] = useState(existing?.location ?? '');
  const [occasion, setOccasion] = useState<Occasion>(existing?.occasion ?? 'everyday');
  const [formality, setFormality] = useState<Formality>(existing?.formality ?? OCCASION_FORMALITY.everyday[1]);
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const timeError = time && !TIME_RE.test(time) ? 'Use 24-hour time, like 18:30' : undefined;

  const save = (thenPlan = false) => {
    if (!title.trim()) {
      toast({ message: 'Give the event a name', icon: 'info' });
      return;
    }
    if (timeError) return;
    const id = useStore.getState().upsertEvent({
      id: existing?.id,
      title: title.trim(),
      date,
      time: time || undefined,
      location: location.trim() || undefined,
      occasion,
      formality,
      notes: notes.trim() || undefined,
      outfitId: existing?.outfitId,
    });
    if (thenPlan) router.replace({ pathname: '/create', params: { eventId: id } });
    else {
      toast({ message: existing ? 'Event updated' : 'Event added', icon: 'calendar' });
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <NavHeader title={existing ? 'Edit event' : 'New event'} onBack={() => router.back()} backIcon="x" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: space.xl, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <TextField label="What’s happening?" placeholder="e.g. Sam’s birthday dinner" value={title} onChangeText={setTitle} autoFocus={!existing} returnKeyType="next" />
        <FieldLabel>Date</FieldLabel>
        <DateStrip value={date} onChange={setDate} start={date < toISODate() ? date : toISODate()} />
        <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.lg }}>
          <View style={{ flex: 1 }}>
            <TextField label="Time (optional)" placeholder="18:30" value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" maxLength={5} />
          </View>
          <View style={{ flex: 1.4 }}>
            <TextField label="Where (optional)" placeholder="Location" value={location} onChangeText={setLocation} />
          </View>
        </View>
        {timeError && (
          <Text variant="caption" style={{ color: colors.danger, marginTop: 4 }}>
            {timeError}
          </Text>
        )}
        <FieldLabel>Occasion</FieldLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {(Object.keys(OCCASION_LABELS) as Occasion[]).map((o) => (
            <Chip
              key={o}
              label={OCCASION_LABELS[o]}
              size="sm"
              selected={occasion === o}
              onPress={() => {
                setOccasion(o);
                setFormality(OCCASION_FORMALITY[o][1] as Formality);
              }}
            />
          ))}
        </View>
        <FieldLabel>Dress code</FieldLabel>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {([1, 2, 3, 4, 5] as Formality[]).map((f) => (
            <View key={f} style={{ flex: 1 }}>
              <Chip label={FORMALITY_LABELS[f]} size="sm" selected={formality === f} onPress={() => setFormality(f)} />
            </View>
          ))}
        </View>
        <View style={{ marginTop: space.lg }}>
          <TextField label="Notes" placeholder="Optional" value={notes} onChangeText={setNotes} multiline />
        </View>
        <View style={{ gap: space.sm, marginTop: space.xl }}>
          <Button label={existing?.outfitId ? 'Save & change outfit' : 'Save & plan outfit'} icon="sparkles" onPress={() => save(true)} />
          <Button label="Save" variant="secondary" onPress={() => save(false)} />
          {existing && (
            <Button
              label="Delete event"
              variant="danger"
              onPress={() =>
                Alert.alert('Delete event?', undefined, [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      useStore.getState().deleteEvent(existing.id);
                      router.back();
                    },
                  },
                ])
              }
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
