import { useMemo } from 'react';

import type { EngineContext } from '@/engine/types';
import { snapshotFor } from '@/services/weather';
import { useStore } from '@/state/store';
import type { Formality, ID, ISODate, Occasion } from '@/types/models';
import { toISODate } from '@/utils/dates';

interface Opts {
  date?: ISODate;
  occasion?: Occasion;
  targetFormality?: Formality;
  lockedItemIds?: ID[];
  excludeSignatures?: string[];
  seed?: number;
}

/** Build the engine context from app state (memoized on relevant inputs). */
export function useEngineContext(opts: Opts = {}): EngineContext {
  const items = useStore((s) => s.items);
  const prefs = useStore((s) => s.preferences);
  const wearLogs = useStore((s) => s.wearLogs);
  const feedback = useStore((s) => s.feedback);
  const forecast = useStore((s) => s.forecast);
  const date = opts.date ?? toISODate();
  const today = toISODate();
  const weather = useMemo(() => snapshotFor(forecast, date, today), [forecast, date, today]);
  // Arrays from callers are often fresh each render; key memoization on their contents.
  const lockedKey = opts.lockedItemIds?.join() ?? '';
  const excludeKey = opts.excludeSignatures?.join() ?? '';
  const { occasion, targetFormality, seed } = opts;

  return useMemo(
    () => ({
      items,
      date,
      weather,
      occasion: occasion ?? 'everyday',
      targetFormality,
      preferredStyles: prefs.styles,
      fitByGroup: prefs.fitByGroup,
      coldSensitivity: prefs.coldSensitivity,
      wearLogs,
      feedback,
      customCategories: prefs.customCategories,
      repeatWindowDays: prefs.repeatWindowDays,
      lockedItemIds: lockedKey ? lockedKey.split(',') : [],
      excludeSignatures: excludeKey ? excludeKey.split(',') : [],
      seed,
    }),
    [items, date, weather, occasion, targetFormality, prefs, wearLogs, feedback, lockedKey, excludeKey, seed],
  );
}
