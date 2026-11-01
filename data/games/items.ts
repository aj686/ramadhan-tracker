import type { GameItem, LocalText, PoolId } from './schema';

const named = (id: string, emoji: string, ms: string, en: string): GameItem => ({
  id,
  emoji,
  label: { ms, en },
});

export const LETTERS: GameItem[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => ({
  id: `letter-${letter.toLowerCase()}`,
  glyph: letter,
  label: { ms: letter, en: letter },
}));

const numberWord = (n: number, ms: string, en: string): GameItem => ({
  id: `number-${n}`,
  glyph: String(n),
  label: { ms, en },
});

export const NUMBERS: GameItem[] = [
  numberWord(1, 'satu', 'one'),
  numberWord(2, 'dua', 'two'),
  numberWord(3, 'tiga', 'three'),
  numberWord(4, 'empat', 'four'),
  numberWord(5, 'lima', 'five'),
  numberWord(6, 'enam', 'six'),
  numberWord(7, 'tujuh', 'seven'),
  numberWord(8, 'lapan', 'eight'),
  numberWord(9, 'sembilan', 'nine'),
  numberWord(10, 'sepuluh', 'ten'),
];

const colour = (id: string, color: string, ms: string, en: string): GameItem => ({
  id: `colour-${id}`,
  color,
  label: { ms, en },
});

export const COLOURS: GameItem[] = [
  colour('red', '#EF4444', 'merah', 'red'),
  colour('blue', '#3B82F6', 'biru', 'blue'),
  colour('yellow', '#FACC15', 'kuning', 'yellow'),
  colour('green', '#22C55E', 'hijau', 'green'),
  colour('orange', '#F97316', 'oren', 'orange'),
  colour('purple', '#A855F7', 'ungu', 'purple'),
  colour('pink', '#F472B6', 'merah jambu', 'pink'),
  colour('brown', '#92400E', 'coklat', 'brown'),
  colour('black', '#1F2937', 'hitam', 'black'),
  colour('white', '#F8FAFC', 'putih', 'white'),
];

const shape = (kind: NonNullable<GameItem['shape']>, ms: string, en: string): GameItem => ({
  id: `shape-${kind}`,
  shape: kind,
  label: { ms, en },
});

export const SHAPE_COLORS: Record<NonNullable<GameItem['shape']>, string> = {
  circle: '#EF4444',
  square: '#3B82F6',
  triangle: '#22C55E',
  rectangle: '#F97316',
  oval: '#A855F7',
  star: '#EAB308',
  heart: '#EC4899',
  diamond: '#06B6D4',
};

export const SHAPES: GameItem[] = [
  shape('circle', 'bulatan', 'circle'),
  shape('square', 'segi empat sama', 'square'),
  shape('triangle', 'segi tiga', 'triangle'),
  shape('rectangle', 'segi empat tepat', 'rectangle'),
  shape('oval', 'bujur', 'oval'),
  shape('star', 'bintang', 'star'),
  shape('heart', 'hati', 'heart'),
  shape('diamond', 'berlian', 'diamond'),
];

const animal = (id: string, emoji: string, ms: string, en: string, soundMs: string, soundEn: string): GameItem => ({
  id: `animal-${id}`,
  emoji,
  label: { ms, en },
  sound: { ms: soundMs, en: soundEn },
  audio: `sound_${id}`,
});

export const ANIMALS: GameItem[] = [
  animal('cow', '🐄', 'lembu', 'cow', 'Moo', 'Moo'),
  animal('cat', '🐈', 'kucing', 'cat', 'Meow', 'Meow'),
  animal('duck', '🦆', 'itik', 'duck', 'Kuek kuek', 'Quack'),
  animal('goat', '🐐', 'kambing', 'goat', 'Mbek', 'Maa'),
  animal('sheep', '🐑', 'biri-biri', 'sheep', 'Baa', 'Baa'),
  animal('chicken', '🐔', 'ayam', 'chicken', 'Kok kok', 'Cluck'),
  animal('horse', '🐴', 'kuda', 'horse', 'Hihihi', 'Neigh'),
  animal('bird', '🐦', 'burung', 'bird', 'Cip cip', 'Tweet'),
  animal('frog', '🐸', 'katak', 'frog', 'Kuak kuak', 'Ribbit'),
  animal('lion', '🦁', 'singa', 'lion', 'Aum', 'Roar'),
  animal('elephant', '🐘', 'gajah', 'elephant', 'Preet', 'Toot'),
  animal('monkey', '🐒', 'monyet', 'monkey', 'Uk uk', 'Ooh ooh'),
  animal('bee', '🐝', 'lebah', 'bee', 'Bzzz', 'Buzz'),
  animal('snake', '🐍', 'ular', 'snake', 'Sss', 'Hiss'),
  animal('owl', '🦉', 'burung hantu', 'owl', 'Hu hu', 'Hoot'),
];

export const FRUITS: GameItem[] = [
  named('fruit-apple', '🍎', 'epal', 'apple'),
  named('fruit-banana', '🍌', 'pisang', 'banana'),
  named('fruit-orange', '🍊', 'oren', 'orange'),
  named('fruit-grapes', '🍇', 'anggur', 'grapes'),
  named('fruit-watermelon', '🍉', 'tembikai', 'watermelon'),
  named('fruit-mango', '🥭', 'mangga', 'mango'),
  named('fruit-pineapple', '🍍', 'nanas', 'pineapple'),
  named('fruit-strawberry', '🍓', 'strawberi', 'strawberry'),
  named('fruit-pear', '🍐', 'pear', 'pear'),
  named('fruit-cherry', '🍒', 'ceri', 'cherry'),
  named('fruit-coconut', '🥥', 'kelapa', 'coconut'),
  named('fruit-lemon', '🍋', 'lemon', 'lemon'),
];

export const OCCUPATIONS: GameItem[] = [
  named('job-doctor', '🧑‍⚕️', 'doktor', 'doctor'),
  named('job-teacher', '🧑‍🏫', 'guru', 'teacher'),
  named('job-firefighter', '🧑‍🚒', 'bomba', 'firefighter'),
  named('job-police', '👮', 'polis', 'police'),
  named('job-farmer', '🧑‍🌾', 'petani', 'farmer'),
  named('job-chef', '🧑‍🍳', 'tukang masak', 'chef'),
  named('job-pilot', '🧑‍✈️', 'juruterbang', 'pilot'),
  named('job-mechanic', '🧑‍🔧', 'mekanik', 'mechanic'),
  named('job-scientist', '🧑‍🔬', 'saintis', 'scientist'),
  named('job-artist', '🧑‍🎨', 'pelukis', 'artist'),
  named('job-builder', '👷', 'pembina', 'builder'),
  named('job-judge', '🧑‍⚖️', 'hakim', 'judge'),
];

export const BODY_PARTS: GameItem[] = [
  named('body-eye', '👁️', 'mata', 'eye'),
  named('body-ear', '👂', 'telinga', 'ear'),
  named('body-nose', '👃', 'hidung', 'nose'),
  named('body-mouth', '👄', 'mulut', 'mouth'),
  named('body-hand', '✋', 'tangan', 'hand'),
  named('body-foot', '🦶', 'kaki', 'foot'),
  named('body-arm', '💪', 'lengan', 'arm'),
  named('body-leg', '🦵', 'betis', 'leg'),
  named('body-tooth', '🦷', 'gigi', 'tooth'),
  named('body-tongue', '👅', 'lidah', 'tongue'),
  named('body-finger', '☝️', 'jari', 'finger'),
  named('body-brain', '🧠', 'otak', 'brain'),
];

export const VEHICLES: GameItem[] = [
  named('vehicle-car', '🚗', 'kereta', 'car'),
  named('vehicle-bus', '🚌', 'bas', 'bus'),
  named('vehicle-train', '🚂', 'kereta api', 'train'),
  named('vehicle-plane', '✈️', 'kapal terbang', 'plane'),
  named('vehicle-ship', '🚢', 'kapal', 'ship'),
  named('vehicle-bicycle', '🚲', 'basikal', 'bicycle'),
  named('vehicle-motorcycle', '🏍️', 'motosikal', 'motorcycle'),
  named('vehicle-helicopter', '🚁', 'helikopter', 'helicopter'),
  named('vehicle-taxi', '🚕', 'teksi', 'taxi'),
  named('vehicle-ambulance', '🚑', 'ambulans', 'ambulance'),
  named('vehicle-firetruck', '🚒', 'kereta bomba', 'fire truck'),
  named('vehicle-truck', '🚛', 'lori', 'truck'),
];

export const CLOTHING: GameItem[] = [
  named('clothing-shirt', '👕', 'baju', 'shirt'),
  named('clothing-trousers', '👖', 'seluar', 'trousers'),
  named('clothing-dress', '👗', 'gaun', 'dress'),
  named('clothing-socks', '🧦', 'stoking', 'socks'),
  named('clothing-shoes', '👟', 'kasut', 'shoes'),
  named('clothing-cap', '🧢', 'topi', 'cap'),
  named('clothing-coat', '🧥', 'kot', 'coat'),
  named('clothing-scarf', '🧣', 'selendang', 'scarf'),
  named('clothing-gloves', '🧤', 'sarung tangan', 'gloves'),
  named('clothing-tudung', '🧕', 'tudung', 'headscarf'),
  named('clothing-sandals', '🩴', 'selipar', 'sandals'),
  named('clothing-bag', '🎒', 'beg', 'bag'),
];

export const POOLS: Record<PoolId, GameItem[]> = {
  letters: LETTERS,
  numbers: NUMBERS,
  colours: COLOURS,
  shapes: SHAPES,
  animals: ANIMALS,
  fruits: FRUITS,
  occupations: OCCUPATIONS,
  body: BODY_PARTS,
  vehicles: VEHICLES,
  clothing: CLOTHING,
};

// Words placed before an item's name in "Find ..." prompts.
export const FIND_PREFIX: Record<PoolId, LocalText> = {
  letters: { ms: 'huruf ', en: 'the letter ' },
  numbers: { ms: 'nombor ', en: 'the number ' },
  colours: { ms: 'warna ', en: 'the colour ' },
  shapes: { ms: 'bentuk ', en: 'the ' },
  animals: { ms: '', en: 'the ' },
  fruits: { ms: '', en: 'the ' },
  occupations: { ms: '', en: 'the ' },
  body: { ms: '', en: 'the ' },
  vehicles: { ms: '', en: 'the ' },
  clothing: { ms: '', en: 'the ' },
};

// Match the Correct Item: things that belong together.
export const RELATED_PAIRS: [GameItem, GameItem][] = [
  [named('rel-bee', '🐝', 'lebah', 'bee'), named('rel-honey', '🍯', 'madu', 'honey')],
  [named('rel-cow', '🐄', 'lembu', 'cow'), named('rel-milk', '🥛', 'susu', 'milk')],
  [named('rel-chicken', '🐔', 'ayam', 'chicken'), named('rel-egg', '🥚', 'telur', 'egg')],
  [named('rel-rain', '🌧️', 'hujan', 'rain'), named('rel-umbrella', '☂️', 'payung', 'umbrella')],
  [named('rel-foot', '🦶', 'kaki', 'foot'), named('rel-shoe', '👟', 'kasut', 'shoe')],
  [named('rel-key', '🔑', 'kunci', 'key'), named('rel-lock', '🔒', 'mangga', 'lock')],
  [named('rel-book', '📖', 'buku', 'book'), named('rel-pencil', '✏️', 'pensel', 'pencil')],
  [named('rel-monkey', '🐒', 'monyet', 'monkey'), named('rel-banana', '🍌', 'pisang', 'banana')],
  [named('rel-rabbit', '🐇', 'arnab', 'rabbit'), named('rel-carrot', '🥕', 'lobak', 'carrot')],
  [named('rel-cat', '🐈', 'kucing', 'cat'), named('rel-fish', '🐟', 'ikan', 'fish')],
];

// Short words for Word Tracing. Letter-by-letter, so they stay short.
export const TRACE_WORDS: Record<'ms' | 'en', { word: string; item: GameItem }[]> = {
  ms: [
    { word: 'IBU', item: named('word-ibu', '💗', 'ibu', 'mum') },
    { word: 'AYAH', item: named('word-ayah', '💙', 'ayah', 'dad') },
    { word: 'BOLA', item: named('word-bola', '⚽', 'bola', 'ball') },
    { word: 'IKAN', item: named('word-ikan', '🐟', 'ikan', 'fish') },
    { word: 'BAS', item: named('word-bas', '🚌', 'bas', 'bus') },
    { word: 'NASI', item: named('word-nasi', '🍚', 'nasi', 'rice') },
  ],
  en: [
    { word: 'MUM', item: named('word-mum', '💗', 'ibu', 'mum') },
    { word: 'DAD', item: named('word-dad', '💙', 'ayah', 'dad') },
    { word: 'CAT', item: named('word-cat', '🐈', 'kucing', 'cat') },
    { word: 'SUN', item: named('word-sun', '☀️', 'matahari', 'sun') },
    { word: 'BUS', item: named('word-bus', '🚌', 'bas', 'bus') },
    { word: 'BALL', item: named('word-ball', '⚽', 'bola', 'ball') },
  ],
};
