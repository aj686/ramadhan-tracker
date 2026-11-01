import type { Activity, AgeGroup, JourneyId } from './schema';

// Every activity in the brief. Add a new one here; the engine picks it up from `mechanic` and `spec`.
export const ACTIVITIES: Activity[] = [
  // ── Ages 2–3: Learning Fundamentals ──────────────────────────────────────
  {
    id: 't-abc',
    title: { ms: 'Kenal ABC', en: 'ABC Recognition' },
    instructions: { ms: 'Dengar dan tekan huruf yang betul.', en: 'Listen and tap the right letter.' },
    age: 'toddler', journey: 'fundamentals', category: 'letters', difficulty: 1,
    emoji: '🔤', tint: 'yellow', mechanic: 'choice',
    spec: { type: 'pick', pools: ['letters'], rounds: 5, optionCounts: [2, 2, 3, 3, 3], style: 'find' },
  },
  {
    id: 't-numbers',
    title: { ms: 'Kenal Nombor 1–10', en: 'Numbers 1–10' },
    instructions: { ms: 'Dengar dan tekan nombor yang betul.', en: 'Listen and tap the right number.' },
    age: 'toddler', journey: 'fundamentals', category: 'numbers', difficulty: 1,
    emoji: '🔢', tint: 'blue', mechanic: 'choice',
    spec: { type: 'pick', pools: ['numbers'], rounds: 5, optionCounts: [2, 2, 3, 3, 3], style: 'find' },
  },
  {
    id: 't-colours',
    title: { ms: 'Kenal Warna', en: 'Colours' },
    instructions: { ms: 'Dengar dan tekan warna yang betul.', en: 'Listen and tap the right colour.' },
    age: 'toddler', journey: 'fundamentals', category: 'colours', difficulty: 1,
    emoji: '🎨', tint: 'pink', mechanic: 'choice',
    spec: { type: 'pick', pools: ['colours'], rounds: 5, optionCounts: [2, 2, 3, 3, 3], style: 'find' },
  },
  {
    id: 't-animals',
    title: { ms: 'Kenal Haiwan', en: 'Animals' },
    instructions: { ms: 'Dengar dan tekan haiwan yang betul.', en: 'Listen and tap the right animal.' },
    age: 'toddler', journey: 'fundamentals', category: 'animals', difficulty: 1,
    emoji: '🐈', tint: 'green', mechanic: 'choice',
    spec: { type: 'pick', pools: ['animals'], rounds: 5, optionCounts: [2, 2, 3, 3, 3], style: 'find' },
  },
  {
    id: 't-sounds',
    title: { ms: 'Bunyi Haiwan', en: 'Animal Sounds' },
    instructions: { ms: 'Dengar bunyi. Tekan haiwan itu.', en: 'Listen to the sound. Tap the animal.' },
    age: 'toddler', journey: 'fundamentals', category: 'animals', difficulty: 1,
    emoji: '🐄', tint: 'orange', mechanic: 'choice',
    spec: { type: 'pick', pools: ['animals'], rounds: 5, optionCounts: [2, 2, 3, 3, 3], style: 'sound' },
  },
  {
    id: 't-fruits',
    title: { ms: 'Kenal Buah', en: 'Fruits' },
    instructions: { ms: 'Dengar dan tekan buah yang betul.', en: 'Listen and tap the right fruit.' },
    age: 'toddler', journey: 'fundamentals', category: 'fruits', difficulty: 1,
    emoji: '🍎', tint: 'green', mechanic: 'choice',
    spec: { type: 'pick', pools: ['fruits'], rounds: 5, optionCounts: [2, 2, 3, 3, 3], style: 'find' },
  },
  {
    id: 't-shapes',
    title: { ms: 'Kenal Bentuk', en: 'Shapes' },
    instructions: { ms: 'Dengar dan tekan bentuk yang betul.', en: 'Listen and tap the right shape.' },
    age: 'toddler', journey: 'fundamentals', category: 'shapes', difficulty: 1,
    emoji: '🔺', tint: 'purple', mechanic: 'choice',
    spec: { type: 'pick', pools: ['shapes'], rounds: 5, optionCounts: [2, 2, 3, 3, 3], style: 'find' },
  },

  // ── Ages 2–3: Interactive Activities ─────────────────────────────────────
  {
    id: 't-colour-letters',
    title: { ms: 'Warnakan Huruf', en: 'Colour the Letters' },
    instructions: { ms: 'Pilih warna. Sentuh huruf sehingga penuh.', en: 'Pick a colour. Touch the letter until it is full.' },
    age: 'toddler', journey: 'activities', category: 'letters', difficulty: 1,
    emoji: '🖍️', tint: 'pink', mechanic: 'fill',
    spec: { type: 'fill', rounds: 4, paletteSize: 5 },
  },
  {
    id: 't-match-letters',
    title: { ms: 'Padan Huruf', en: 'Match the Letters' },
    instructions: { ms: 'Tekan huruf besar, kemudian huruf kecil yang sama.', en: 'Tap a big letter, then the same small letter.' },
    age: 'toddler', journey: 'activities', category: 'letters', difficulty: 1,
    emoji: '🔠', tint: 'yellow', mechanic: 'match',
    spec: { type: 'match', set: 'letter_case', rounds: 3, pairCount: 3 },
  },
  {
    id: 't-trace',
    title: { ms: 'Surih Perkataan', en: 'Word Tracing' },
    instructions: { ms: 'Ikut garisan dengan jari anda.', en: 'Follow the line with your finger.' },
    age: 'toddler', journey: 'activities', category: 'letters', difficulty: 1,
    emoji: '✍️', tint: 'blue', mechanic: 'trace',
    spec: { type: 'trace', rounds: 3 },
  },
  {
    id: 't-sort',
    title: { ms: 'Asingkan Warna', en: 'Colour Sorting' },
    instructions: { ms: 'Seret bola ke bakul warna yang sama.', en: 'Drag each ball to the basket of the same colour.' },
    age: 'toddler', journey: 'activities', category: 'colours', difficulty: 1,
    emoji: '🧺', tint: 'orange', mechanic: 'sort',
    spec: { type: 'sort', rounds: 3, binCount: 2, tokenCount: 4 },
  },
  {
    id: 't-match-shapes',
    title: { ms: 'Padan Bentuk', en: 'Match the Shapes' },
    instructions: { ms: 'Tekan bentuk, kemudian bayang-bayangnya.', en: 'Tap a shape, then its shadow.' },
    age: 'toddler', journey: 'activities', category: 'shapes', difficulty: 1,
    emoji: '🔷', tint: 'purple', mechanic: 'match',
    spec: { type: 'match', set: 'shape_silhouette', rounds: 3, pairCount: 3 },
  },

  // ── Ages 4–6: Kembara Play & Explore ─────────────────────────────────────
  {
    id: 'k-puzzle',
    title: { ms: 'Teka Silang Gambar', en: 'Puzzle' },
    instructions: { ms: 'Seret kepingan ke tempat yang betul.', en: 'Drag each piece to the right place.' },
    age: 'preschool', journey: 'kembara', category: 'problem_solving', difficulty: 2,
    emoji: '🧩', tint: 'purple', mechanic: 'puzzle',
    spec: { type: 'puzzle', grids: [{ cols: 2, rows: 2 }, { cols: 2, rows: 2 }, { cols: 3, rows: 2 }, { cols: 3, rows: 3 }] },
  },
  {
    id: 'k-dots',
    title: { ms: 'Sambung Titik', en: 'Connect the Dots' },
    instructions: { ms: 'Sambung titik mengikut nombor.', en: 'Connect the dots in number order.' },
    age: 'preschool', journey: 'kembara', category: 'numbers', difficulty: 2,
    emoji: '✏️', tint: 'blue', mechanic: 'dots',
    spec: { type: 'dots', figures: ['kite', 'house', 'mosque', 'boat', 'fish', 'star'] },
  },
  {
    id: 'k-missing',
    title: { ms: 'Cari Huruf Hilang', en: 'Find Missing Letters' },
    instructions: { ms: 'Pilih huruf untuk melengkapkan perkataan.', en: 'Pick the letter that completes the word.' },
    age: 'preschool', journey: 'kembara', category: 'spelling', difficulty: 2,
    emoji: '🔍', tint: 'yellow', mechanic: 'choice',
    spec: { type: 'missing', pools: ['animals', 'fruits', 'vehicles', 'clothing'], rounds: 6, optionCount: 3, maxLength: 7 },
  },
  {
    id: 'k-match',
    title: { ms: 'Padan Yang Betul', en: 'Match the Correct Item' },
    instructions: { ms: 'Tekan dua gambar yang berkaitan.', en: 'Tap two pictures that go together.' },
    age: 'preschool', journey: 'kembara', category: 'problem_solving', difficulty: 2,
    emoji: '🤝', tint: 'green', mechanic: 'match',
    spec: { type: 'match', set: 'related', rounds: 3, pairCount: 4 },
  },
  {
    id: 'k-listen',
    title: { ms: 'Dengar & Fokus', en: 'Listen & Focus' },
    instructions: { ms: 'Dengar baik-baik, kemudian pilih gambar yang betul.', en: 'Listen carefully, then pick the right picture.' },
    age: 'preschool', journey: 'kembara', category: 'listening', difficulty: 2,
    emoji: '👂', tint: 'orange', mechanic: 'choice',
    spec: { type: 'pick', pools: ['animals', 'fruits', 'vehicles', 'clothing'], rounds: 6, optionCounts: [3, 3, 4, 4, 4, 4], style: 'listen' },
  },
  {
    id: 'k-arrange',
    title: { ms: 'Susun Huruf', en: 'Arrange Letters' },
    instructions: { ms: 'Tekan huruf mengikut susunan untuk membentuk perkataan.', en: 'Tap the letters in order to make the word.' },
    age: 'preschool', journey: 'kembara', category: 'spelling', difficulty: 3,
    emoji: '🔡', tint: 'pink', mechanic: 'arrange',
    spec: { type: 'arrange', pools: ['animals', 'fruits', 'vehicles', 'body'], rounds: 5, maxLength: 6 },
  },

  // ── Ages 4–6: Little Step Journey ────────────────────────────────────────
  {
    id: 's-abc-mix',
    title: { ms: 'ABC, Nombor & Warna', en: 'ABC, Numbers & Colours' },
    instructions: { ms: 'Dengar dan pilih jawapan yang betul.', en: 'Listen and pick the right answer.' },
    age: 'preschool', journey: 'little_step', category: 'fundamentals', difficulty: 1,
    emoji: '🌈', tint: 'yellow', mechanic: 'choice',
    spec: { type: 'pick', pools: ['letters', 'numbers', 'colours'], rounds: 8, optionCounts: [3, 3, 3, 4, 4, 4, 4, 4], style: 'find', hideLabelsFromRound: 0 },
  },
  {
    id: 's-sounds',
    title: { ms: 'Bunyi Haiwan', en: 'Animal Sounds' },
    instructions: { ms: 'Haiwan mana yang berbunyi begini?', en: 'Which animal makes this sound?' },
    age: 'preschool', journey: 'little_step', category: 'animals', difficulty: 2,
    emoji: '🦁', tint: 'orange', mechanic: 'choice',
    spec: { type: 'pick', pools: ['animals'], rounds: 8, optionCounts: [3, 3, 3, 4, 4, 4, 4, 4], style: 'sound', hideLabelsFromRound: 5, spellingRounds: 2 },
  },
  {
    id: 's-fruits',
    title: { ms: 'Kenal Buah', en: 'Fruits' },
    instructions: { ms: 'Pilih buah yang betul. Kemudian eja namanya.', en: 'Pick the right fruit. Then spell its name.' },
    age: 'preschool', journey: 'little_step', category: 'fruits', difficulty: 2,
    emoji: '🍇', tint: 'green', mechanic: 'choice',
    spec: { type: 'pick', pools: ['fruits'], rounds: 8, optionCounts: [3, 3, 3, 4, 4, 4, 4, 4], style: 'find', hideLabelsFromRound: 3, spellingRounds: 2 },
  },
  {
    id: 's-occupations',
    title: { ms: 'Pekerjaan', en: 'Occupations' },
    instructions: { ms: 'Siapakah dia? Pilih yang betul.', en: 'Who is it? Pick the right one.' },
    age: 'preschool', journey: 'little_step', category: 'vocabulary', difficulty: 2,
    emoji: '🧑‍⚕️', tint: 'blue', mechanic: 'choice',
    spec: { type: 'pick', pools: ['occupations'], rounds: 8, optionCounts: [3, 3, 3, 4, 4, 4, 4, 4], style: 'find', hideLabelsFromRound: 3, spellingRounds: 2 },
  },
  {
    id: 's-body',
    title: { ms: 'Anggota Badan', en: 'Body Parts' },
    instructions: { ms: 'Pilih anggota badan yang betul.', en: 'Pick the right body part.' },
    age: 'preschool', journey: 'little_step', category: 'vocabulary', difficulty: 2,
    emoji: '👂', tint: 'pink', mechanic: 'choice',
    spec: { type: 'pick', pools: ['body'], rounds: 8, optionCounts: [3, 3, 3, 4, 4, 4, 4, 4], style: 'find', hideLabelsFromRound: 3, spellingRounds: 2 },
  },
  {
    id: 's-vehicles',
    title: { ms: 'Kenderaan', en: 'Vehicles' },
    instructions: { ms: 'Pilih kenderaan yang betul.', en: 'Pick the right vehicle.' },
    age: 'preschool', journey: 'little_step', category: 'vocabulary', difficulty: 2,
    emoji: '🚌', tint: 'blue', mechanic: 'choice',
    spec: { type: 'pick', pools: ['vehicles'], rounds: 8, optionCounts: [3, 3, 3, 4, 4, 4, 4, 4], style: 'find', hideLabelsFromRound: 3, spellingRounds: 2 },
  },
  {
    id: 's-shapes',
    title: { ms: 'Bentuk', en: 'Shapes' },
    instructions: { ms: 'Pilih bentuk yang betul.', en: 'Pick the right shape.' },
    age: 'preschool', journey: 'little_step', category: 'shapes', difficulty: 2,
    emoji: '⭐', tint: 'purple', mechanic: 'choice',
    spec: { type: 'pick', pools: ['shapes'], rounds: 8, optionCounts: [3, 3, 3, 4, 4, 4, 4, 4], style: 'find', hideLabelsFromRound: 3 },
  },
  {
    id: 's-clothing',
    title: { ms: 'Pakaian', en: 'Clothing' },
    instructions: { ms: 'Pilih pakaian yang betul.', en: 'Pick the right clothing.' },
    age: 'preschool', journey: 'little_step', category: 'vocabulary', difficulty: 2,
    emoji: '👕', tint: 'green', mechanic: 'choice',
    spec: { type: 'pick', pools: ['clothing'], rounds: 8, optionCounts: [3, 3, 3, 4, 4, 4, 4, 4], style: 'find', hideLabelsFromRound: 3, spellingRounds: 2 },
  },
];

export const JOURNEYS_BY_AGE: Record<AgeGroup, JourneyId[]> = {
  toddler: ['fundamentals', 'activities'],
  preschool: ['kembara', 'little_step'],
};

export const getActivity = (id: string): Activity | undefined =>
  ACTIVITIES.find((activity) => activity.id === id);

export const getJourneyActivities = (journey: JourneyId): Activity[] =>
  ACTIVITIES.filter((activity) => activity.journey === journey);
