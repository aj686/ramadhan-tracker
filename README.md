# MyLittleMuslim

Islamic habit tracker and learning games for Malaysian Muslim parents and their children.
React Native (Expo SDK 54), Expo Router, Supabase, Zustand. Android first, iOS, and web as a PWA.

## Run it

```bash
npm install
cp .env.example .env   # then fill in your Supabase project URL and anon key
npm start
```

The app uses native modules, so Android and iOS need a development build rather than Expo Go.

## Check your work

```bash
npm test             # logic tests (Node 22.18+)
npx tsc --noEmit     # types
npm run lint         # lint
npm run web:build    # production web build
```

## Where things are

- [CLAUDE.md](CLAUDE.md): architecture, conventions, security rules and current status.
- [Plans.md](Plans.md): roadmap. §13 has the current stages and the list of steps only the owner can do.
