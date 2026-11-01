# CLAUDE.md — MyLittleMuslim

Guidance for Claude Code working in this repository.

---

## 1. Project

**MyLittleMuslim** — React Native (Expo) Islamic habit tracker and learning games for Malaysian
Muslim parents and their children (ages 2–15; the games are for ages 2–6). Freemium: AdMob +
RM9.90/mo or RM49.90/yr subscription.

| Field | Value |
|---|---|
| Stack | Expo SDK 54, Expo Router v6, React 19.1, RN 0.81.5, TypeScript 5.9 |
| Backend | Supabase (auth + Postgres + RLS + Edge Functions) |
| State | Zustand 5 |
| Payments | ToyyibPay (Malaysian gateway) via Supabase Edge Functions |
| Platform | Android primary, iOS secondary, web as a PWA (Cloudflare Workers static assets) |
| Android package | `com.aj686.ramadantracker` |
| Branch | `master` (no PR workflow — commit direct) |

Planning doc: [Plans.md](Plans.md), with the current roadmap and owner to-do list in §13.
Personal learning notes: `NOTES.md` (gitignored — do not commit).

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

Known exceptions, older than these rules: `store/subscription-store.ts` and `store/theme-store.ts`
contain async calls, and `app/(tabs)/leaderboard.tsx` queries Supabase directly. Don't copy them.

### Directory map

```
app/
  (auth)/        login, register, verify (OTP — built, currently unused), forgot-password
  (tabs)/        index · rewards · leaderboard · learn · profile   (5 tabs)
  child/[id]/    index (dashboard) · fasting · prayer · sunat · quran · doa
  learn/[module] card grid per learning module
  games/         index (kids home) · journey/[journey] · play/[activityId]
  settings/      reminders (Android and iOS only)
  premium/       upgrade (Coming Soon until PAYMENT_OPEN is true)
  privacy, delete-account   public: they open signed out, for the Play Console links
  +not-found     redirects unknown URLs to /
hooks/           use-{auth,children,fasting,prayer,rewards,theme,subscription,
                       sunat,quran,doa,streak,speech,go-back,refetch-on-foreground,
                       game-settings,game-progress,game-audio,game-session,
                       prayer-reminders,ads,report}
store/           {auth,children,fasting,prayer,rewards,subscription,theme,
                  sunat,quran,doa,game-progress,game-settings,reminder}-store
components/      glass-card · category-chip · progress-bar · tracker-card · premium-gate ·
                 learning-card · letter-highlight · ad-banner(.web)
components/game/ engine UI: game-renderer (mechanic → game) · 9 games · character-sprite · shell parts
data/            animals(30) allah-names(99) prophets(25) transport(25) countries(30)
data/games/      schema · activities (the 27 games) · items · letter-strokes · figures
i18n/            games.ts (all game interface text, BM and English)
services/        supabase · toyyibpay · alert(.web) · save-error · dates · islamic-calendar ·
                 prayer-times · notifications(.web) · report · report-output(.web)
services/game/   session (rules) · question-builder · progress · progress-storage ·
                 audio-manager · media (register art and audio here) · geometry · sprite · random
supabase/        migrations/00{1..5}_*.sql · config.toml · functions/{create-payment,
                 payment-callback,payment-return,delete-account,_shared}
constants/       theme.ts · legal.ts · ads.ts
types/           index.ts
tests/           node:test, no framework: games · calendar · features · payment
public/          web only: index.html · manifest.json · register-sw.js · _headers · icons/
scripts/         web-postexport.js (build step + build check) · sw-kill.js (service worker recovery)
                 · generate-sfx.js (makes assets/audio/)
```

Web-only config at the root: `workbox-config.js`, `wrangler.jsonc`.

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

### Years — never hardcode one
Ramadan, Syawal and Arafah come from the table in `services/islamic-calendar.ts`, one row per
Hijri year. Rows with `confirmed: false` are expected dates: replace them when JAKIM announces.
Past the table's end, dates are estimated rather than failing. Don't change the 1447 row's start:
2026 logs were saved against it.

Stats match the period they are labelled with, because tables hold every year: `calculateStats(year)`,
`getTotalPrayerCount(year)`, and fasting stats cover one Ramadan. Read the year inside the component,
not at module level, so an app left open over New Year stays right.

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

### Two devices on one account
Prayer and Doa rows hold several ticks, so a stale device must never write the whole row.
Send only the changed column as a single object, and keep the optimistic row separate:
```ts
.upsert({ child_id, date, [prayer]: completed }, { onConflict: 'child_id,date' })
```
On failure, revert only that column, including on a brand-new date, and show `alertNotSaved()`.
Screens that fetch on open also call `useRefetchOnForeground` with `{ silent: true }`, which
skips `setLoading`. Never add it to Rewards: a refetch overwrites a half-typed form.

### Auth events
- `SIGNED_OUT` always clears the user and every store (`clearUserData` in `hooks/use-auth.ts`).
  supabase-js only fires it after removing the session: a real sign-out, a revoked session,
  or another tab.
- A network failure never fires `SIGNED_OUT` and leaves the session in storage. If `getSession()`
  or `INITIAL_SESSION` returns null but `readStoredAuthUser()` finds a user, the failure was
  network-only, so stay signed in.
- Logout uses `signOut({ scope: 'local' })`, so other devices stay logged in. If it fails, remove
  the stored session with `clearStoredAuthSession()` and tell the user.
- Skip `setUser` when id and email match. Returning to a browser tab fires `SIGNED_IN`, and a
  new `user` object refires every fetch that depends on it.

### Web and shared code
- `window` and `document` only in `*.web.ts` files and `public/`. Shared code still runs on Android.
- Import `Alert` from `@/services/alert`. On `react-native-web`, `Alert.alert()` does nothing.
- Back buttons use `useGoBack(fallback)`. After a browser refresh `router.back()` has nowhere to go.
- Date keys parse with `parseDateKey` from `services/dates.ts`. `new Date('2026-03-01')` is UTC
  and shows the previous day west of UTC.
- Metro caches the manifest inlined from `app.json`, so `web:build` always passes `--clear`. Pass it
  to any other export after editing `app.json`.
- Service worker caching is for app files only. Never add `runtimeCaching` or cache a Supabase
  response: children's data must not stay in a browser cache.

### Supabase idioms
- Upsert needs the unique-constraint columns: `{ onConflict: 'child_id,date' }`
- `PGRST116` means "no rows" — seed defaults, don't throw.

### Kids games
- **New activity = data only.** Add it to `data/games/activities.ts` using an existing `mechanic`
  and `spec`. `tests/games.test.ts` then builds it in both languages across several seeds.
- Games only report what happened through `report({ correct, solved, speak })`. The shell owns
  scoring (`services/game/session.ts`), sound, feedback and moving on.
- Questions are built from a seed, so switching language rebuilds the same round. Language is in
  the game's React key, because a word's letters change with language.
- Drag and drawing use `PanResponder` and rotated Views, on purpose: no Reanimated, gesture handler
  or SVG, so nothing new is exposed to the web CSP and no native module is needed. Don't add them
  without a reason.
- Animated characters are pre-rendered sprite sheets, registered in `SPRITES` in `services/game/media.ts`,
  with no 3D at runtime. Without a sheet, the character is its emoji, animated in code.
- Art and audio are registered by key in `services/game/media.ts`. An item with no file falls back
  to its emoji and to text-to-speech. Never assume a voice exists: `audioManager.canSpeak` can be
  false, and every game must stay playable with no sound.
- Progress stays on the device under an opaque child or parent id, with stars and scores only.
  `clearUserData` clears memory, `deleteChild` and `deleteAccount` clear the disk.
- No ads and no premium locks inside games. The way out goes through `ParentalGate`.

### Design system
Category colors, glass tokens and both gradients live in `constants/theme.ts` — read them
from `useTheme()`, never hardcode a hex in a screen. Games use the separate `game` palette from
`useTheme()`, which follows the reference image. Stage 4 of Plans.md §13 moves the rest of the app
onto it, then this section gets rewritten. Colours that are content, like a colour swatch in a game,
belong in `data/games/`.

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
premium**. Kids games are free too, at least until payment opens. Premium: unlimited children,
Sunat, Quran, Doa, streak, leaderboard, Transport and Countries learning modules, PDF report, no ads.
Screens read `canAccess*` from the hook and don't query a premium table until it is true. The child
limit is only enforced in the client so far (Plans.md §13.7).

---

## 4. Commands

```bash
npm start            # expo start (NODE_ENV=development via cross-env)
npm run android      # expo start --android
npm run lint         # expo lint
npm test             # node:test over tests/ (pure logic only, needs Node 22.18+)
npx tsc --noEmit     # typecheck — run before declaring work done
npm run web:build    # web export, CSP + build ID, Workbox, build check (needs Node 22)
npm run web:preview  # serve dist on port 5000 (no _headers, no SPA fallback)
```

Tests cover logic only, not screens. "Verified" means it typechecks, lints, tests pass and you ran
the screen — say plainly which of those you actually did. A new route needs `.expo/types` regenerated
(run `npx expo start` once) or `tsc` reports it as an unknown path.

**Releases.** Every push to `master` publishes OTA to the `production` branch (`eas-update.yml`,
which skips pushes that change only web-only files or `**.md`). A push that touches `package.json`,
`package-lock.json`, `app.json` or `eas.json` skips the publish and needs `eas build` instead.
`runtimeVersion` follows the app `version`, so bump the version in the same commit that adds a
native module: JS that needs it must never reach a binary without it.

Every push to `master` also does two more things:
- `.eas/workflows/build.yml` starts an Android `development` build, which uses build quota, even for a
  docs-only push. The `development` channel has no update branch, so a phone on that build gets no OTA.
  For a test phone that should get updates, use the `internal` profile: an APK on the `production` channel.
- Cloudflare Workers Builds is connected, so **the push also builds the web app.** Build command
  `npm run web:build`, deploy command `npx wrangler deploy`, `NODE_VERSION=22`. Cloudflare calls the
  Worker `ramadhan-tracker` while `wrangler.jsonc` says `mylittlemuslim`, and the first build still
  reported success, so a name mismatch does not always fail the build.

Old Android code saves whole rows and can erase ticks made on web, so shared fixes must reach Android
before anyone is pointed at the web app.

A native module is only proven by a real `eas build`: npm's version ranges do not show that it compiles.
`react-native-google-mobile-ads` is pinned at 16.3.4, because 17.0.0 does not compile on React Native 0.81
and 16.4.0 onward use an Ads SDK built with Kotlin 2.3, which this project's Kotlin 2.1 cannot read.

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

The web build has no `.env` on Cloudflare, so the same two client values are also set as
Cloudflare build variables. Write only placeholders for them in this repo:
```
EXPO_PUBLIC_SUPABASE_URL=<your-project-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```
`scripts/web-postexport.js` fails the build if either is unset, without printing them.
`SUPABASE_SERVICE_ROLE_KEY` must never be set as a Cloudflare build variable, and neither must a
ToyyibPay key: the web build needs only these two values.

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

### 5.5 Payment integrity

`supabase/functions/payment-callback/index.ts` is public by necessity, so it trusts nothing in the
POST body. It matches the order and bill code, re-confirms the payment with ToyyibPay
`getBillTransactions`, checks the amount against the plan price in `functions/_shared/toyyibpay.ts`,
and only activates a row still `pending`, so a replayed callback changes nothing. Keep all of that.
Paying more than the price is accepted because the customer may pay a gateway charge.

**This code has never run against ToyyibPay.** The response field names and the ringgit unit of
`billpaymentAmount` come from documentation and must be confirmed in the sandbox.

`PAYMENT_OPEN` in `services/toyyibpay.ts` is `false`, so `app/premium/upgrade.tsx` shows
`COMING_SOON_LABEL` and cannot call `createPayment()`. Do not set it to `true` until the functions
and secrets are deployed and a sandbox payment has worked end to end (Plans.md §13.7). Deploy
`payment-callback` and `payment-return` with `--no-verify-jwt`: ToyyibPay sends no auth header.

### 5.6 Operational constraints for AI

- **Scope.** Read and write only inside this project directory. Don't wander the filesystem.
- **No silent network egress.** Don't POST this project's code, schema, or data to any
  external service, paste site, or API. `npm install` and documented Supabase/EAS calls are fine.
- **Ask before deploying.** `supabase functions deploy`, `supabase secrets set`,
  `supabase db push`, `eas build`, `eas submit`, any `wrangler` command, and anything touching
  the Play Store or Cloudflare are the user's call. Print the exact command for them to run; don't run it unprompted.
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

## 6. Current status — 2026-11-01

Stages 1–3 of [Plans.md](Plans.md) §13 are code-complete and pushed to `master`. Cloudflare built the web
app from that push, ahead of Android. **Phones get none of it until they install a 1.2.0 build**, because
that push skipped OTA by design. The `internal` APK reaches the login screen on an Android 16 emulator.
Nothing past login has run natively, and nothing has run on a physical phone. Games and screens are
tested on web only. Every owner step is listed in §13.7.

### Code-complete, not yet on phones
Register/login with password reset · account deletion · privacy policy (BM and English, draft) ·
up to 2 children free / unlimited premium · Puasa Ramadhan tracker for any year · Solat year view ·
reward system · learning modules · family leaderboard · theme toggle · premium gates · 27 kids games
in BM and English · prayer reminders (Android and iOS) · PDF report · AdMob banner (off until unit ids
are set) · hardened payment functions (client closed by `PAYMENT_OPEN`).

### Blocked on the owner, not on code
| Item | Blocker |
|---|---|
| Android | Test a 1.2.0 build on a real phone, then `eas build --profile production`. Older phones still run old code. |
| Sunat / Quran / Doa trackers | Run `supabase/migrations/005_phase2_logs.sql`. |
| Account deletion | Deploy the `delete-account` function. |
| Password reset, email verification | Supabase email templates need `{{ .Token }}`, plus custom SMTP. |
| ToyyibPay payment | Deploy functions, set secrets, sandbox test, then set `PAYMENT_OPEN`. |
| Web (PWA) | Cloudflare is connected. Test the live address, and don't share it until Android is out (§4). |
| AdMob | Real app ids in `app.json`, unit ids in `constants/ads.ts`. |
| Kids games art and audio | About 105 illustrations, 350 voice clips, 15 animal sounds. Emoji and text-to-speech stand in. |
| Feed the Cat artwork | Optional. A sprite sheet, then one line in `SPRITES`. Its emoji is animated until then. |

### Not built
BM/English outside the games (Stage 4) · the UI redesign from the reference image (Stage 4).

### Housekeeping
- `app.json` `slug` is still `ramadan-tracker`. It must match the Expo project, so the owner renames both together.
- Tests cover logic only. Screens have no automated tests in the repo.

When you complete a phase item, update both the checklist in [Plans.md](Plans.md) §13 and
the status table above.
