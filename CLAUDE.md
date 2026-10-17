# CLAUDE.md — MyLittleMuslim

Guidance for Claude Code working in this repository.

---

## 1. Project

**MyLittleMuslim** — React Native (Expo) Islamic habit tracker for Malaysian Muslim parents
and their children (ages 6–15). Freemium: AdMob + RM9.90/mo or RM49.90/yr subscription.

| Field | Value |
|---|---|
| Stack | Expo SDK 54, Expo Router v6, React 19.1, RN 0.81.5, TypeScript 5.9 |
| Backend | Supabase (auth + Postgres + RLS + Edge Functions) |
| State | Zustand 5 |
| Payments | ToyyibPay (Malaysian gateway) via Supabase Edge Functions |
| Platform | Android primary, iOS secondary |
| Android package | `com.aj686.ramadantracker` |
| Branch | `master` (no PR workflow — commit direct) |

Planning doc: [Plans.md](Plans.md). Personal learning notes: `NOTES.md` (gitignored — do not commit).

---

## 2. Architecture — the 3-layer rule

```
Screen (app/**)  →  Hook (hooks/**)  →  Store (store/**)
   UI + local         Supabase calls      state + plain
   useState only      + business logic    setters only
```

Hard rules, enforced throughout the codebase:

- **Stores** hold state and primitive setters. No `async`, no Supabase, no business logic.
- **Hooks** own all Supabase I/O and computation, then write into stores.
- **Screens** call hooks and keep `useState` for UI-only concerns. Never hold server data.
- Multi-child data is keyed per child: `Record<string, SomeLog[]>` → `{ "<child-uuid>": [...] }`.
- Read a store outside React with `useSomeStore.getState()` — never inside JSX.

### Directory map

```
app/
  (auth)/        login, register, verify (OTP — built, currently unused)
  (tabs)/        index · rewards · leaderboard · learn · profile   (5 tabs)
  child/[id]/    index (dashboard) · fasting · prayer · sunat · quran · doa
  learn/[module] card grid per learning module
  premium/       upgrade (paywall)
hooks/           use-{auth,children,fasting,prayer,rewards,theme,subscription,
                       sunat,quran,doa,streak,speech}
store/           {auth,children,fasting,prayer,rewards,subscription,theme,
                  sunat,quran,doa}-store
components/      glass-card · category-chip · progress-bar · tracker-card ·
                 premium-gate · learning-card · letter-highlight
data/            animals(30) allah-names(99) prophets(25) transport(25) countries(30)
services/        supabase.ts · toyyibpay.ts
supabase/        migrations/00{1..4}_*.sql · functions/{create-payment,
                 payment-callback,payment-return}
constants/       theme.ts
types/           index.ts
```

**Dead code — do not extend, do not import:** `screens/` and `navigation/` are leftovers
from the pre-Expo-Router build (Phase 0). All live UI is under `app/`. Flag them for deletion
rather than editing them.

---

## 3. Conventions that bite

### Dates — never use `toISOString()` for a calendar date
It shifts across the timezone boundary (MYT is UTC+8). Build the string by hand:
```ts
const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
```
`toISOString()` is fine for `timestamptz` columns (`expires_at`, `updated_at`) — only wrong
for date keys.

### Prayer denominator is year-to-date, not fixed
```ts
const daysElapsed  = Math.max(1, Math.floor((today - jan1) / 86400000) + 1);
const possibleSoFar = daysElapsed * 5;   // NOT 150
```
Fasting is the exception: fixed 30 Ramadan days.

### Stale closures in optimistic updates
Prayer toggles previously dropped taps because the handler closed over stale store state.
Always re-read inside the handler:
```ts
const fresh = usePrayerStore.getState().logs[childId];
```

### Optimistic update shape
```ts
upsertLog(childId, optimistic);                    // 1. paint immediately
try   { const { data } = await supabase.from('…').upsert(…); upsertLog(childId, data); }
catch { upsertLog(childId, existing); }            // 3. revert
```

### Supabase idioms
- Upsert needs the unique-constraint columns: `{ onConflict: 'child_id,date' }`
- `PGRST116` means "no rows" — seed defaults, don't throw.

### Design system
Category colors, glass tokens and both gradients live in `constants/theme.ts` — read them
from `useTheme()`, never hardcode a hex in a screen.

| Tracker | Color | | Tracker | Color |
|---|---|---|---|---|
| Puasa Ramadhan | `#22C55E` | | Puasa Sunat | `#06B6D4` |
| Solat | `#A855F7` | | Quran | `#3B82F6` |
| Rewards | `#F97316` | | Doa | `#EC4899` |

Glass card: `BlurView intensity 60` + `rgba(255,255,255,0.80)` + `borderRadius: 20`.
Tab bar: flat white, 0.5px border, zero elevation (Telegram style).

### Freemium gates
`hooks/use-subscription.ts` is the single source of truth. Free tier: 2 children, Puasa
Ramadhan, Solat, **and the full reward system (money + custom) — rewards are FREE, not
premium**. Premium: unlimited children, Sunat, Quran, Doa, streak, leaderboard, Transport
and Countries learning modules, no ads.

---

## 4. Commands

```bash
npm start            # expo start (NODE_ENV=development via cross-env)
npm run android      # expo start --android
npm run lint         # expo lint
npx tsc --noEmit     # typecheck — run before declaring work done
```

No test suite exists. "Verified" means it typechecks, lints, and you ran the screen — say
plainly which of those you actually did.

---

## 5. SECURITY — secrets and data handling

This project holds a live Supabase project, a payment gateway key, and **children's personal
data**. Treat all three as sensitive.

### 5.1 Never read, print, or transmit these

| Target | Rule |
|---|---|
| `.env` | **Do not open it.** It holds the real Supabase URL + anon key. Gitignored. Read `.env.example` instead to learn variable *names*. |
| `*.jks`, `*.p8`, `*.p12`, `*.key`, `*.pem`, `*.mobileprovision` | Android/iOS signing material. Never read, never print, never move. |
| `eas.json` credentials block | May carry EAS/store tokens. |
| `SUPABASE_SERVICE_ROLE_KEY` | Bypasses all RLS. Exists **only** in Supabase Edge Function env. Must never reach the client bundle, a file, or chat output. |
| `TOYYIBPAY_SECRET_KEY`, `TOYYIBPAY_CATEGORY_CODE` | Set via `supabase secrets set` only. Never in source, never in `app.json`. |
| `~/.aws`, `~/.ssh`, `~/.npmrc`, browser profiles, anything outside this project | Out of scope for every task here. |

If a task appears to require a secret's value, **stop and ask the user to supply it or run
the command themselves.** Never work around it by reading the file.

### 5.2 Never commit

- `.env` or any `.env*.local` — already gitignored; keep it that way.
- Real keys inside `.env.example`, `app.json`, `eas.json`, or any `.ts` file. Placeholders only.
- `NOTES.md` (gitignored by intent).
- Real user emails, auth tokens, child names, or Supabase row dumps in code comments,
  commit messages, migration files, or markdown.

Before any commit, check the staged diff for a key-shaped string (`eyJ…` JWT, a 32+ char
hex/base64 blob, `sb_secret_…`, `https://*.supabase.co` paired with a key).

### 5.3 Secrets belong in exactly one place each

```
EXPO_PUBLIC_*  → .env  (client-visible by design — anon key only, RLS is the real guard)
Edge Function  → supabase secrets set  (service role, ToyyibPay keys, callback URLs)
Signing keys   → EAS / local keystore, never in the repo
```

The `EXPO_PUBLIC_` prefix means **the value ships inside the app bundle and is readable by
anyone who downloads the APK.** Only the Supabase *anon* key may ever carry that prefix.
Never prefix a service role key, a ToyyibPay key, or any server secret with `EXPO_PUBLIC_`.

### 5.4 Database access must stay behind RLS

Every child-scoped table (`children`, `fasting_log`, `prayer_log`, `rewards`, `sunat_log`,
`quran_log`, `doa_log`, `subscriptions`) has RLS tied to `auth.uid()`. When adding a table:

1. `alter table <name> enable row level security;`
2. Add a policy scoping rows to the owning parent, e.g.
   ```sql
   create policy "Users manage own <name>" on <name> for all using (
     exists (select 1 from children
             where children.id = <name>.child_id and children.parent_id = auth.uid())
   );
   ```
3. Never disable RLS "temporarily" to debug. Never query with the service role from the client.

`subscriptions` is deliberately asymmetric: users may `SELECT` their own row; all
`INSERT`/`UPDATE` happens service-role-side in Edge Functions so a user cannot grant
themselves premium.

### 5.5 Payment integrity — known gap

`supabase/functions/payment-callback/index.ts` activates a subscription on `status === '1'`
and validates only that `order_id` exists. It does **not** verify the paid `amount` against
the plan price, and it is not idempotent (a replayed callback re-extends `expires_at` from
`now()`). The endpoint is public by necessity. Before going to production, harden it:

- compare `amount` (sen) against the plan's expected price and reject a mismatch;
- re-confirm the bill server-side via ToyyibPay `getBillTransactions` rather than trusting
  the POST body;
- ignore the callback if the row is already `active` for that `billcode`.

Payment is currently stubbed anyway — `app/premium/upgrade.tsx` shows a "Coming Soon" alert
instead of calling `createPayment()`. Do not un-stub it until the above is fixed and secrets
are deployed.

### 5.6 Operational constraints for AI

- **Scope.** Read and write only inside this project directory. Don't wander the filesystem.
- **No silent network egress.** Don't POST this project's code, schema, or data to any
  external service, paste site, or API. `npm install` and documented Supabase/EAS calls are fine.
- **Ask before deploying.** `supabase functions deploy`, `supabase secrets set`,
  `supabase db push`, `eas build`, `eas submit`, and anything touching the Play Store are the
  user's call. Print the exact command for them to run; don't run it unprompted.
- **Ask before destructive SQL.** No `drop`, `truncate`, or unguarded `delete`/`update`
  against the live project. Migrations are forward-only, additive, numbered files in
  `supabase/migrations/`.
- **Never commit or push unless asked.**
- **Don't log PII.** No `console.log` of auth sessions, tokens, emails, or child records —
  Expo logs surface in terminals and crash reports.
- **Children's data minimization.** The app stores a child's first name only. Don't add
  fields collecting a child's photo, birthdate, precise location, or contact details without
  the user explicitly asking — this app targets minors and those fields carry
  Play Store Families Policy and PDPA obligations.
- **Redact in output.** If a secret does appear in a tool result or log, do not echo it back;
  refer to it by name and tell the user it should be rotated.

---

## 6. Current status — audited 2026-10-17

### Shipped and working
Register/login (no email verification — instant access) · up to 2 children free /
unlimited premium · Puasa Ramadhan 30-day tracker · Solat 5-waktu year view
(all 5 prayers/day) · reward system (money + custom) · learning modules Animals,
99 Names of Allah, Prophets with `expo-speech` · family leaderboard · profile with
light/dark/system theme toggle · premium gate UI · paywall screen (stubbed).

Phases 1–5 in [Plans.md](Plans.md) are code-complete.

### Blocked on deployment, not on code
| Item | Blocker |
|---|---|
| Sunat / Quran / Doa trackers | `sunat_log`, `quran_log`, `doa_log` tables not created in Supabase. SQL sits inline in Plans.md §8 — **has no migration file yet**; should become `supabase/migrations/005_phase2_logs.sql`. |
| ToyyibPay payment | Edge Functions not deployed; secrets not set; callback not hardened (§5.5); client still stubbed. |
| Email verification | `verify.tsx` + `verifyOtp`/`resendVerification` built; Supabase email confirmation is OFF. Needs `{{ .Token }}` template + custom SMTP. |

### Not built
Language toggle (EN/MS) · AdMob ads · push notifications (prayer reminders) ·
PDF progress report · `hooks/use-ads.ts` · `hooks/use-report.ts`.
No i18n, AdMob, or `expo-notifications` dependency is installed yet.

### Housekeeping
- `screens/` and `navigation/` are dead Phase-0 code, still tracked in git — delete.
- `app.json` `slug` is still `ramadan-tracker` while the app name is MyLittleMuslim.
- No automated tests anywhere.

When you complete a phase item, update both the checklist in [Plans.md](Plans.md) §11 and
the status table above.
