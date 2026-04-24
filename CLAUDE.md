# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build (output: dist/)
npm run preview      # Preview production build
```

No test or lint commands are configured.

## Environment Variables

Create `.env.local` with:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Architecture

React 19 + TypeScript SPA built with Vite. UI is entirely in Spanish.

**Entry point:** `index.tsx` → `App.tsx` (mounted into `#root`)

**`App.tsx`** is the single source of truth — all state lives here (`foodItems`, `dailyGoal`, `templates`, `history`, `userName`). No Redux or Context API; props are drilled to child components. App lifecycle is driven by an `AppStatus` state machine: `'loading' → 'signed-out' | 'needs-name' | 'ready'`. Auth state changes are handled via `subscribeToAuthChanges`, which re-runs `checkStatus` on every Supabase auth event.

**Persistence pattern:**
- **Food items** are persisted with *granular* ops: `addFoodItem` / `addMultipleFoodItems` / `deleteFoodItem` each call a single-row `insertFoodItem` / `insertFoodItems` / `deleteFoodItemById` on Supabase. There is no effect that resaves all items on every state change.
- **Goal** and **templates** are still saved via a `useEffect` that watches state. Both effects early-return unless `hydratedRef.current` is true — this flag starts `false` and is set `true` by a trailing effect on the first render after `appStatus` becomes `'ready'`. That guard is what prevents the hydration render from triggering a full rewrite of the data we just loaded. `checkStatus` / `handleNameSaved` reset the flag to `false` before publishing fresh state.
- **History** is not stored separately — `loadHistory(currentGoal)` aggregates `(date, calories)` rows from `food_items` client-side (≤90 days). A third effect keeps today's in-memory history entry in sync with `foodItems`; it does not write to the DB.

**`services/dataService.ts`** — all persistence and auth functions. Fully backed by Supabase (not localStorage). `saveTemplates` does a `DELETE` + two batched `INSERT`s (one for templates, one for all items); it relies on the `template_items.template_id` CASCADE to clean up children. `loadProfile()` returns `{ name, dailyGoal }` in a single round-trip (replaces the old separate `loadUserName` / `loadGoal`). `saveGoal` / `saveUserName` both upsert `user_profiles`. The module caches `uid` at module scope and resolves it via `supabase.auth.getSession()` (local, no network); the cache is invalidated on `SIGNED_OUT` and in `signOut()`.

**`services/supabaseService.ts`** — initializes and exports the Supabase client from env vars.

**`components/Auth.tsx`** — handles email/password sign-in, registration, email verification pending state, resend verification, and post-verification name entry. The `view` prop switches between `'auth'` (full auth flow) and `'name-entry'` (shown after first verified login when no name is set yet).

**`types.ts`** — `FoodItem`, `MealType`, `FoodTemplate`, `DailyHistory`

**`utils/uuid.ts`** — thin wrapper around `crypto.randomUUID()`, used whenever a new `FoodItem` or `FoodTemplate` needs a client-side id.

**`utils/withTimeout.ts`** — wraps any promise with a race against a `setTimeout` rejection. Every Supabase call in `App.tsx` goes through this (8 s for single requests, 12 s for batched `Promise.all`).

## Database schema

Schema is in `supabase/schema.sql`. Tables (all with RLS, scoped to `auth.uid()`):
- `user_profiles` — `id` (FK to `auth.users`), `name`, `daily_goal`
- `food_items` — `user_id`, `date` (DATE), `name`, `calories`, `meal`; indexed on `(user_id, date)`
- `food_templates` — `user_id`, `name`, `total_calories`
- `template_items` — `template_id` (FK to `food_templates` cascade), `name`, `calories`

A trigger (`on_auth_user_created`) inserts an empty `user_profiles` row on new user signup.

To apply the schema: run `supabase/schema.sql` in the Supabase Dashboard SQL Editor.

## Styling

Tailwind CSS is loaded via CDN in `index.html` (not installed as a package). Custom color palette (`primary`, `secondary`, `accent`, `light`, `dark`) is defined in the inline `tailwind.config` script in `index.html`. The `@` alias in `vite.config.ts` resolves to the project root.

## Stale artifacts

`index.html` contains an importmap entry for `@google/genai` and `recharts` via `esm.sh`. The Gemini integration (`components/GeminiAdvisor.tsx`, `services/geminiService.ts`) has been deleted; `@google/genai` is no longer used. `recharts` is also unused — `HistoryView` renders a plain HTML table, not a chart.
