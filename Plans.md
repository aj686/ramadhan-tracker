# MyLittleMuslim — Master Development Plan

> Last updated: 2026-03-01 (Phase 2 implementation)
> Stack: React Native (Expo), Supabase, Zustand, TypeScript
> Current branch: `master`

---

## Table of Contents

1. [App Overview & Branding](#1-app-overview--branding)
2. [Freemium Model](#2-freemium-model)
3. [Phase 0 — Base (Done)](#3-phase-0--base-done-)
4. [Phase 1 — Design Overhaul (Done)](#4-phase-1--design-overhaul-done-)
5. [Phase 2 — Feature Expansion](#5-phase-2--feature-expansion)
6. [Phase 3 — Premium Plus](#6-phase-3--premium-plus)
7. [File Structure — Current vs Target](#7-file-structure--current-vs-target)
8. [Supabase DB Schema](#8-supabase-db-schema)
9. [Component Inventory](#9-component-inventory)
10. [Design System](#10-design-system)
11. [Implementation Checklist](#11-implementation-checklist)

---

## 1. App Overview & Branding

| Field         | Value                                           |
|---------------|-------------------------------------------------|
| App Name      | **MyLittleMuslim**                              |
| Old Name      | Ramadan Tracker (replaced everywhere)           |
| Target Users  | Malaysian Muslim parents with young children    |
| Age of Kids   | 6–15 years                                      |
| Language      | English (primary), Malay terms for features     |
| Platform      | Android (primary), iOS (secondary)              |
| Monetization  | Freemium — AdMob (free) + subscription (premium)|

---

## 2. Freemium Model

### FREE Tier
| Feature                          | Limit         |
|----------------------------------|---------------|
| Child profiles                   | Up to 2       |
| Puasa Ramadhan tracker           | Full access   |
| Solat 5 waktu tracker (year)     | Full access   |
| Reward system (money + custom)   | Full access ✅ |
| AdMob ads shown                  | Yes           |

> **IMPORTANT:** Custom reward (money & custom text) is FREE.
> Applies to Puasa Ramadhan + Solat only. Premium trackers get their own reward config.

### PREMIUM — RM9.90/bulan or RM49.90/tahun
| Feature                          | Notes                           |
|----------------------------------|---------------------------------|
| Unlimited child profiles         | Remove the 2-child limit        |
| Puasa Sunat tracker              | Isnin/Khamis, Syawal, Arafah   |
| Quran reading tracker            | Pages per day, progress to 30j  |
| Doa harian checklist             | 6 daily doas                    |
| Streak system                    | Prayer streak on dashboard       |
| Family leaderboard               | Sibling ranking by score        |
| Progress report PDF              | Phase 3                         |
| Remove ads                       | AdMob removed                   |
| Priority support                 |                                 |

---

## 3. Phase 0 — Base (Done) ✅

Original combined fasting+prayer screen, 3 hardcoded children limit, dark green theme.
All replaced in Phase 1.

---

## 4. Phase 1 — Design Overhaul (Done) ✅ 2026-03-01

### What Was Done

#### Design & Theme
- `constants/theme.ts` — full color system (category colors, glass tokens, tab bar, dark mode)
- White pastel gradient background (`['#F0FFF4', '#FFFFFF', '#FFF8F0']`) on all screens
- Glass cards: `BlurView` + semi-transparent bg + shadow
- Telegram-style tab bar (flat white, 0.5px border, no elevation)

#### Theme Toggle ← NEW after Phase 1 start
- `store/theme-store.ts` — persists `'light' | 'dark' | 'system'` to AsyncStorage
- `hooks/use-theme.ts` — reads from theme store, falls back to system
- `app/_layout.tsx` — loads preference on startup
- `app/(tabs)/profile.tsx` → **Appearance** section with 3-way toggle button

#### Screens Built
| File | Notes |
|------|-------|
| `app/(auth)/login.tsx` | MyLittleMuslim branding, 🌙 logo, white bg |
| `app/(auth)/register.tsx` | Same |
| `app/(tabs)/index.tsx` | Child list, glass cards, 2-child free limit, upgrade nudge |
| `app/(tabs)/rewards.tsx` | FREE badge, glass form, money/custom reward config |
| `app/(tabs)/profile.tsx` | Email, plan badge, Appearance toggle, Logout |
| `app/(tabs)/_layout.tsx` | 3 tabs: Home / Rewards / Profile |
| `app/child/[id]/index.tsx` | Dashboard: reward card + TrackerCards for each feature |
| `app/child/[id]/fasting.tsx` | 30-day Ramadan log, Full/Half/None buttons |
| `app/child/[id]/prayer.tsx` | **Year view**: 4×3 month grid, tap month → daily log |

#### Prayer Screen Design ← Updated from original plan
- Original plan: 30-day list. Implemented: full year (12 months, 365 days)
- Month selector: 4×3 grid with `done/possible` stats and mini progress bar per month
- Tap a month → shows daily rows for that month only
- Today highlighted purple, Friday highlighted green
- Denominator: `daysElapsed × 5` (year-to-date), not fixed 150

#### Freemium Groundwork
- `store/subscription-store.ts` — isPremium, plan, expiresAt (stub: always free)
- `hooks/use-subscription.ts` — feature gates (all premium locked)
- `hooks/use-children.ts` — MAX_CHILDREN_FREE = 2, dynamic via isPremium
- `components/premium-gate.tsx` — lock overlay + upgrade CTA

#### New Components
- `components/glass-card.tsx` — reusable BlurView card
- `components/category-chip.tsx` — colorful icon chip
- `components/tracker-card.tsx` — dashboard progress row
- `components/progress-bar.tsx` — reusable progress bar
- `components/premium-gate.tsx` — premium lock wrapper

#### Deleted
- `app/child/[id].tsx` — old combined fasting+prayer screen

---

## 5. Phase 2 — Feature Expansion

**Goal:** Build premium tracker screens (Sunat, Quran, Doa), streak system, leaderboard.
All premium screens wrapped in `PremiumGate` — functional, gated until Phase 3 wires real subscription.

### 5.1 Puasa Sunat Tracker (PREMIUM)

**Screen:** `app/child/[id]/sunat.tsx`
- 3 type tabs: **Isnin & Khamis** | **6 Syawal** | **Arafah**
- Isnin & Khamis: all Mondays + Thursdays of year, grouped by month
- Syawal 2026: April 2–30 (any 6 days picked)
- Arafah 2026: June 10 (single day)
- Each date: date label + `[Done]` toggle button
- Stats card: total done, per-type count

**Hook:** `hooks/use-sunat.ts`
- `fetchSunatLogs()` — fetch from `sunat_log` by child_id + year
- `toggleSunat(date, type)` — upsert completed boolean
- `getSunatDates(year)` — generate dated lists per type
- `calculateStats()` — total by type

**Store:** `store/sunat-store.ts` — same pattern as prayer-store

**DB Table:**
```sql
sunat_log
  id        uuid pk
  child_id  uuid → children(id) cascade
  date      date
  type      text  -- 'isnin_khamis' | 'syawal' | 'arafah'
  completed boolean default false
  unique (child_id, date, type)
```

### 5.2 Quran Reading Tracker (PREMIUM)

**Screen:** `app/child/[id]/quran.tsx`
- 4×3 month grid selector (same as prayer)
- Per-day row: date + `[-] [pages] [+]` stepper
- Year summary card: total pages, % of 604 (30 juz), avg per day
- Month summary: total pages for selected month

**Hook:** `hooks/use-quran.ts`
- `fetchQuranLogs()` — fetch from `quran_log`
- `updatePages(date, pages)` — upsert pages_read
- `calculateStats()` — total pages, avg, % of 604

**Store:** `store/quran-store.ts`

**DB Table:**
```sql
quran_log
  id         uuid pk
  child_id   uuid → children(id) cascade
  date       date
  pages_read int default 0
  unique (child_id, date)
```

### 5.3 Doa Harian Checklist (PREMIUM)

**Screen:** `app/child/[id]/doa.tsx`
- 4×3 month grid selector
- Per-day row: 6 doa toggle buttons (Makan / Tidur / Masuk / Keluar / Tandas / Kend.)
- Stats: total doas / possible, % per month

**Hook:** `hooks/use-doa.ts`
- `fetchDoaLogs()`, `updateDoa(date, doaKey, value)`, `calculateStats()`

**Store:** `store/doa-store.ts`

**DB Table:**
```sql
doa_log
  id               uuid pk
  child_id         uuid → children(id) cascade
  date             date
  doa_makan        boolean default false
  doa_tidur        boolean default false
  doa_masuk_rumah  boolean default false
  doa_keluar_rumah boolean default false
  doa_tandas       boolean default false
  doa_kenderaan    boolean default false
  unique (child_id, date)
```

### 5.4 Streak System (PREMIUM)

**Hook:** `hooks/use-streak.ts`
- A "perfect prayer day" = all 5 prayers completed
- `currentStreak`: consecutive days backward from today with 5/5 prayers
- `longestStreak`: max consecutive run in all time
- Shown on child dashboard as a 🔥 streak chip

### 5.5 Family Leaderboard (PREMIUM)

**Screen:** `app/(tabs)/leaderboard.tsx`
- New 4th tab (Trophy icon)
- Score formula: full fast × 10 + half fast × 5 + each prayer × 2
- Fetch all children's fasting + prayer data from Supabase
- Podium UI for top 3 (gold / silver / bronze)
- Full ranked list below
- This Ramadan period scope (March 2026)

### 5.6 Phase 2 New Files

| File | Type | Purpose |
|------|------|---------|
| `app/child/[id]/sunat.tsx` | Screen | Puasa sunat tracker |
| `app/child/[id]/quran.tsx` | Screen | Quran reading tracker |
| `app/child/[id]/doa.tsx` | Screen | Doa harian checklist |
| `app/(tabs)/leaderboard.tsx` | Screen | Family leaderboard (4th tab) |
| `hooks/use-sunat.ts` | Hook | Sunat CRUD + stats |
| `hooks/use-quran.ts` | Hook | Quran CRUD + stats |
| `hooks/use-doa.ts` | Hook | Doa CRUD + stats |
| `hooks/use-streak.ts` | Hook | Prayer streak calculation |
| `store/sunat-store.ts` | Store | Sunat logs state |
| `store/quran-store.ts` | Store | Quran logs state |
| `store/doa-store.ts` | Store | Doa logs state |

### 5.7 Phase 2 Updates to Existing Files

| File | Change |
|------|--------|
| `types/index.ts` | Add SunatLog, QuranLog, DoaLog types |
| `app/child/[id]/index.tsx` | Add streak chip, unlock Phase 2 navigation |
| `app/(tabs)/_layout.tsx` | Add 4th tab: Leaderboard |
| `app/_layout.tsx` | Register sunat, quran, doa routes |

---

## 6. Phase 3 — Premium Payment (ToyyibPay)

### 6.1 System Design — ToyyibPay Integration

**Payment Gateway:** ToyyibPay (Malaysian, bill-based)
**Sandbox:** `https://dev.toyyibpay.com`
**Production:** `https://toyyibpay.com`

#### Plans
| Plan | Price | Amount (sen) |
|------|-------|-------------|
| Monthly | RM9.90/month | 990 |
| Yearly | RM49.90/year | 4990 (save 58%) |

#### Payment Flow
```
User taps "Subscribe" (upgrade.tsx)
    ↓
POST /functions/v1/create-payment  { plan: 'monthly' | 'yearly' }
    ↓
Edge Function: calls ToyyibPay createBill API
    → stores pending row in subscriptions table
    → returns { billCode, paymentUrl }
    ↓
App opens paymentUrl in expo-web-browser
    ↓
User pays on ToyyibPay website
    ↓
ToyyibPay POSTs to /functions/v1/payment-callback
    → verifies order_id exists in subscriptions table
    → if status=1 (success): updates status='active', sets expires_at
    ↓
App: user taps "Check Payment Status" → queries subscriptions table
    → if active + not expired: setPremium(true) in store
```

#### ToyyibPay API
- **Create bill:** `POST {base}/index.php/api/createBill`
- **Key params:** `userSecretKey`, `categoryCode`, `billAmount` (sen), `billCallbackUrl`, `billExternalReferenceNo` (our order_id)
- **Response:** `[{ BillCode: "xxx" }]`
- **Callback fields:** `refno`, `status` (1=success, 2=pending, 3=fail), `billcode`, `order_id`, `amount`
- **Bill URL:** `{base}/{billCode}`

#### Secrets (set via `supabase secrets set`)
```
TOYYIBPAY_SECRET_KEY=<from sandbox dashboard>
TOYYIBPAY_CATEGORY_CODE=<from sandbox dashboard>
TOYYIBPAY_SANDBOX=true
PAYMENT_CALLBACK_URL=https://<project>.supabase.co/functions/v1/payment-callback
PAYMENT_RETURN_URL=https://<project>.supabase.co/functions/v1/payment-return
```

### 6.2 New Files (Phase 3)

| File | Purpose |
|------|---------|
| `supabase/migrations/004_subscriptions.sql` | subscriptions table + RLS |
| `supabase/functions/create-payment/index.ts` | Edge Function: create ToyyibPay bill |
| `supabase/functions/payment-callback/index.ts` | Edge Function: receive callback, activate sub |
| `supabase/functions/payment-return/index.ts` | Edge Function: browser return page |
| `services/toyyibpay.ts` | Client-side plan config + types |
| `app/premium/upgrade.tsx` | Paywall screen |

### 6.3 Updated Files (Phase 3)

| File | Change |
|------|--------|
| `store/subscription-store.ts` | Add `checkSubscription()`, `createPayment()` |
| `hooks/use-subscription.ts` | Read real Supabase subscriptions table |
| `components/premium-gate.tsx` | Wire onUpgrade → navigate to upgrade screen |
| `app/_layout.tsx` | Register premium/upgrade route, check sub on login |
| `app/(tabs)/profile.tsx` | Wire upgrade button, show expiry date |

### 6.4 DB Schema — subscriptions table
```sql
create table subscriptions (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  plan       text check (plan in ('monthly','yearly')) not null,
  status     text check (status in ('pending','active','expired')) default 'pending',
  bill_code  text,
  order_id   text unique,
  amount_rm  numeric(8,2),
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- RLS: users can only SELECT their own rows
-- INSERT/UPDATE done via service_role in Edge Functions
```

### 6.5 Phase 3 Future (Post-Payment)
- `hooks/use-ads.ts` — AdMob banner + interstitial (free users)
- `hooks/use-notifications.ts` — prayer time push reminders
- `hooks/use-report.ts` + `app/child/[id]/report.tsx` — PDF export

---

## 7. File Structure — Current vs Target

### After Phase 2 (current target)
```
app/
├── _layout.tsx                  ← loads theme preference, registers all routes
├── (auth)/
│   ├── _layout.tsx
│   ├── login.tsx                ✅ MyLittleMuslim branding
│   └── register.tsx             ✅
├── (tabs)/
│   ├── _layout.tsx              ✅ 4 tabs: Home / Rewards / Leaderboard / Profile
│   ├── index.tsx                ✅ white bg, glass cards, 2-child free limit
│   ├── rewards.tsx              ✅ FREE badge, glass cards
│   ├── leaderboard.tsx          🆕 Phase 2 — sibling ranking (premium gated)
│   └── profile.tsx              ✅ plan badge, Appearance toggle, logout
└── child/[id]/
    ├── index.tsx                ✅ dashboard: reward card + TrackerCards + streak
    ├── fasting.tsx              ✅ 30-day Ramadan log
    ├── prayer.tsx               ✅ year view, month-grid selector
    ├── sunat.tsx                🆕 Phase 2 — Puasa Sunat (premium gated)
    ├── quran.tsx                🆕 Phase 2 — Quran reading (premium gated)
    └── doa.tsx                  🆕 Phase 2 — Doa harian (premium gated)

hooks/
├── use-auth.ts                  ✅
├── use-children.ts              ✅ dynamic limit via isPremium
├── use-fasting.ts               ✅
├── use-prayer.ts                ✅
├── use-rewards.ts               ✅
├── use-theme.ts                 ✅ light/dark/system from store
├── use-subscription.ts          ✅ feature gates stub (Phase 3: wire RevenueCat)
├── use-sunat.ts                 🆕 Phase 2
├── use-quran.ts                 🆕 Phase 2
├── use-doa.ts                   🆕 Phase 2
└── use-streak.ts                🆕 Phase 2

store/
├── auth-store.ts                ✅
├── children-store.ts            ✅
├── fasting-store.ts             ✅
├── prayer-store.ts              ✅
├── rewards-store.ts             ✅
├── subscription-store.ts        ✅ stub
├── theme-store.ts               ✅ persisted light/dark/system
├── sunat-store.ts               🆕 Phase 2
├── quran-store.ts               🆕 Phase 2
└── doa-store.ts                 🆕 Phase 2

components/
├── glass-card.tsx               ✅
├── category-chip.tsx            ✅
├── progress-bar.tsx             ✅
├── tracker-card.tsx             ✅
├── premium-gate.tsx             ✅
└── index.ts                     ✅
```

---

## 8. Supabase DB Schema

### Existing Tables ✅
```sql
children     (id, parent_id, name, created_at)
fasting_log  (id, child_id, date, status)          UNIQUE (child_id, date)
prayer_log   (id, child_id, date, fajr, dhuhr, asr, maghrib, isha)  UNIQUE (child_id, date)
rewards      (id, parent_id, full_day_amount, half_day_amount, reward_type, custom_reward_full, custom_reward_half)
```

### Phase 2 Tables — Run in Supabase SQL Editor
```sql
-- Sunat fasting log
create table if not exists sunat_log (
  id         uuid primary key default uuid_generate_v4(),
  child_id   uuid references children(id) on delete cascade,
  date       date not null,
  type       text check (type in ('isnin_khamis','syawal','arafah')) not null,
  completed  boolean default false,
  unique (child_id, date, type)
);
alter table sunat_log enable row level security;
create policy "Users manage own sunat logs"
  on sunat_log for all using (
    exists (select 1 from children where children.id = sunat_log.child_id
            and children.parent_id = auth.uid())
  );

-- Quran reading log
create table if not exists quran_log (
  id         uuid primary key default uuid_generate_v4(),
  child_id   uuid references children(id) on delete cascade,
  date       date not null,
  pages_read int default 0,
  unique (child_id, date)
);
alter table quran_log enable row level security;
create policy "Users manage own quran logs"
  on quran_log for all using (
    exists (select 1 from children where children.id = quran_log.child_id
            and children.parent_id = auth.uid())
  );

-- Doa harian log
create table if not exists doa_log (
  id               uuid primary key default uuid_generate_v4(),
  child_id         uuid references children(id) on delete cascade,
  date             date not null,
  doa_makan        boolean default false,
  doa_tidur        boolean default false,
  doa_masuk_rumah  boolean default false,
  doa_keluar_rumah boolean default false,
  doa_tandas       boolean default false,
  doa_kenderaan    boolean default false,
  unique (child_id, date)
);
alter table doa_log enable row level security;
create policy "Users manage own doa logs"
  on doa_log for all using (
    exists (select 1 from children where children.id = doa_log.child_id
            and children.parent_id = auth.uid())
  );
```

---

## 9. Component Inventory

| Component | File | Status |
|-----------|------|--------|
| GlassCard | `components/glass-card.tsx` | ✅ Phase 1 |
| CategoryChip | `components/category-chip.tsx` | ✅ Phase 1 |
| ProgressBar | `components/progress-bar.tsx` | ✅ Phase 1 |
| TrackerCard | `components/tracker-card.tsx` | ✅ Phase 1 |
| PremiumGate | `components/premium-gate.tsx` | ✅ Phase 1 |

---

## 10. Design System

### Backgrounds
- Light: `LinearGradient ['#FFFFFF','#FFFFFF','#FFFFFF']` (solid white)
- Dark: `LinearGradient ['#0F172A','#1E293B','#0F172A']`
- Theme toggle: Light / Dark / System (stored in `theme-store.ts`)

### Glass Card
```
backgroundColor: 'rgba(255,255,255,0.80)'   (light)
borderColor:     'rgba(255,255,255,0.95)'
shadowColor:     'rgba(0,0,0,0.07)'
borderRadius:    20
BlurView intensity: 60
```

### Category Colors
| Tracker | Hex | Muted |
|---------|-----|-------|
| Puasa Ramadhan | `#22C55E` | `rgba(34,197,94,0.12)` |
| Solat | `#A855F7` | `rgba(168,85,247,0.12)` |
| Rewards | `#F97316` | `rgba(249,115,22,0.12)` |
| Puasa Sunat | `#06B6D4` | `rgba(6,182,212,0.12)` |
| Quran | `#3B82F6` | `rgba(59,130,246,0.12)` |
| Doa | `#EC4899` | `rgba(236,72,153,0.12)` |

---

## 11. Implementation Checklist

### Phase 1 ✅ COMPLETED 2026-03-01
- [x] constants/theme.ts — full color + dark mode tokens
- [x] store/theme-store.ts — persisted light/dark/system preference
- [x] hooks/use-theme.ts — reads from store
- [x] app/_layout.tsx — loads theme on startup
- [x] app/(tabs)/_layout.tsx — Telegram tab bar (3 tabs)
- [x] app/(auth)/login.tsx — MyLittleMuslim branding
- [x] app/(auth)/register.tsx — same
- [x] app/(tabs)/index.tsx — white bg, glass cards, 2-child limit
- [x] app/(tabs)/rewards.tsx — FREE badge, glass cards
- [x] app/(tabs)/profile.tsx — account info, Appearance toggle, logout
- [x] app/child/[id]/index.tsx — dashboard with TrackerCards + year-to-date prayer denominator
- [x] app/child/[id]/fasting.tsx — 30-day Ramadan log
- [x] app/child/[id]/prayer.tsx — year view, 4×3 month grid selector
- [x] store/subscription-store.ts — isPremium stub
- [x] hooks/use-subscription.ts — feature gates
- [x] hooks/use-children.ts — dynamic MAX_CHILDREN_FREE = 2
- [x] components/glass-card.tsx, category-chip.tsx, tracker-card.tsx, progress-bar.tsx, premium-gate.tsx
- [x] Delete app/child/[id].tsx

### Phase 2 🔄 IN PROGRESS 2026-03-01
- [x] types/index.ts — SunatLog, QuranLog, DoaLog
- [x] store/sunat-store.ts
- [x] store/quran-store.ts
- [x] store/doa-store.ts
- [x] hooks/use-sunat.ts
- [x] hooks/use-quran.ts
- [x] hooks/use-doa.ts
- [x] hooks/use-streak.ts
- [x] app/child/[id]/sunat.tsx
- [x] app/child/[id]/quran.tsx
- [x] app/child/[id]/doa.tsx
- [x] app/(tabs)/leaderboard.tsx
- [x] Update app/child/[id]/index.tsx — streak chip + Phase 2 navigation
- [x] Update app/(tabs)/_layout.tsx — 4th tab: Leaderboard
- [x] Update app/_layout.tsx — new routes
- [x] Supabase: run Phase 2 SQL (sunat_log, quran_log, doa_log tables)

### Phase 3 ✅ ToyyibPay Payment — 2026-03-02
- [x] supabase/migrations/004_subscriptions.sql
- [x] supabase/functions/create-payment/index.ts
- [x] supabase/functions/payment-callback/index.ts
- [x] supabase/functions/payment-return/index.ts
- [x] services/toyyibpay.ts
- [x] store/subscription-store.ts — checkSubscription(), createPayment()
- [x] hooks/use-subscription.ts — reads real Supabase subscriptions table
- [x] components/premium-gate.tsx — navigates to /premium/upgrade
- [x] app/premium/upgrade.tsx — paywall screen (plan selector + ToyyibPay browser flow)
- [x] app/_layout.tsx — register premium/upgrade route (modal)
- [x] app/(tabs)/profile.tsx — real upgrade nav + expiry date shown
- [ ] ⚠️ DEPLOY: Run SQL migration in Supabase dashboard
- [ ] ⚠️ DEPLOY: `supabase functions deploy create-payment payment-callback payment-return`
- [ ] ⚠️ SECRETS: `supabase secrets set TOYYIBPAY_SECRET_KEY=... TOYYIBPAY_CATEGORY_CODE=... TOYYIBPAY_SANDBOX=true PAYMENT_CALLBACK_URL=... PAYMENT_RETURN_URL=...`

---

*End of Plans.md — updated 2026-03-02 (Phase 3 ToyyibPay design added)*
