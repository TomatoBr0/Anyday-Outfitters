# Architecture

```
┌───────────── UI (src/app, src/components, src/features) ─────────────┐
│ Expo Router screens · design system · feature components            │
└───────────────┬───────────────────────────────┬─────────────────────┘
                │ hooks (useStore, useEngineContext)
┌───────────────▼──────────────┐  ┌─────────────▼──────────────┐
│ State (src/state/store.ts)   │  │ Engine (src/engine)        │
│ zustand, actions, debounced  │  │ pure TS: generate, score,  │
│ write-through persistence    │  │ packing, laundry, colors   │
└───────┬───────────────┬──────┘  └────────────────────────────┘
        │               │
┌───────▼──────┐ ┌──────▼───────────────────────────────────────┐
│ Repository   │ │ Services                                     │
│ (src/storage)│ │ weather (Open-Meteo, cache, estimate)        │
│ AsyncStorage │ │ location (expo-location, foreground only)    │
│ + migrations │ │ images (expo-file-system / image-manipulator)│
└──────────────┘ │ colorSuggest (on-device PNG decode)          │
                 └──────────────────────────────────────────────┘
```

## Key decisions

| Decision | Why |
|---|---|
| **Expo SDK 58 + Expo Go** | Runs on a physical iPhone from Windows with no Xcode. SDK 58 is what the App Store version of Expo Go supports today. Only Expo Go-bundled native modules are used, so there's no custom dev client |
| **Expo Router** | File-based routes, typed routes, modals and tabs |
| **zustand** | Tiny, no provider boilerplate, works with React Compiler; selectors limit re-renders |
| **One AsyncStorage key per collection** | Writes only touch what changed (debounced 200 ms, flushed on backgrounding). A corrupt collection resets on its own without losing the others (tested) |
| **Photos as relative paths** | iOS can move the app container on update, so absolute `file://` URIs would break |
| **Repository interface** | `DataRepository` with `load`/`save`/`clear`. A Supabase or Firebase implementation can drop in via `setRepository()` |
| **Engine as pure functions** | Testable in Node, fast, offline, explainable |
| **No icon font** | A custom SVG icon set matches the logo geometry and avoids a dependency |
| **Fraunces + Inter** | Editorial serif headlines with a highly legible UI sans. Both under the SIL OFL |

## Data model

See `src/types/models.ts`. `SCHEMA_VERSION = 1`. Bump it and add a step in `storage/migrations.ts` whenever a persisted shape changes.

## Future cloud sync (planned)

1. Add `SupabaseRepository implements DataRepository` with row-level security per user.
2. Upload photos to Supabase Storage only after explicit opt-in. Keep the local copy as the cache.
3. Use last-write-wins per document via `updatedAt`. Items, outfits and events already carry timestamps.
4. Calendar import: `PlannedEvent.externalSource` is reserved for Apple/Google IDs. Use `expo-calendar` (read-only, on demand).
