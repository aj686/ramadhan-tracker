import type { DotFigure, PuzzleScene } from './schema';

// Connect the Dots. Points sit on a 100 x 100 box, in the order the child connects them.
export const DOT_FIGURES: Record<string, DotFigure> = {
  kite: {
    id: 'kite',
    label: { ms: 'wau', en: 'kite' },
    emoji: '🔷',
    points: [{ x: 50, y: 5 }, { x: 85, y: 45 }, { x: 50, y: 95 }, { x: 15, y: 45 }],
  },
  house: {
    id: 'house',
    label: { ms: 'rumah', en: 'house' },
    emoji: '🏠',
    points: [{ x: 20, y: 90 }, { x: 20, y: 45 }, { x: 50, y: 15 }, { x: 80, y: 45 }, { x: 80, y: 90 }],
  },
  mosque: {
    id: 'mosque',
    label: { ms: 'masjid', en: 'mosque' },
    emoji: '🕌',
    points: [
      { x: 20, y: 90 }, { x: 20, y: 55 }, { x: 35, y: 35 }, { x: 50, y: 15 },
      { x: 65, y: 35 }, { x: 80, y: 55 }, { x: 80, y: 90 },
    ],
  },
  boat: {
    id: 'boat',
    label: { ms: 'bot', en: 'boat' },
    emoji: '⛵',
    points: [
      { x: 50, y: 8 }, { x: 80, y: 55 }, { x: 95, y: 60 }, { x: 75, y: 90 },
      { x: 25, y: 90 }, { x: 5, y: 60 }, { x: 20, y: 55 },
    ],
  },
  fish: {
    id: 'fish',
    label: { ms: 'ikan', en: 'fish' },
    emoji: '🐟',
    points: [
      { x: 8, y: 50 }, { x: 30, y: 30 }, { x: 60, y: 28 }, { x: 78, y: 45 }, { x: 95, y: 28 },
      { x: 95, y: 72 }, { x: 78, y: 55 }, { x: 60, y: 72 }, { x: 30, y: 70 },
    ],
  },
  star: {
    id: 'star',
    label: { ms: 'bintang', en: 'star' },
    emoji: '⭐',
    points: [
      { x: 50, y: 5 }, { x: 61, y: 38 }, { x: 95, y: 38 }, { x: 67, y: 58 }, { x: 78, y: 92 },
      { x: 50, y: 71 }, { x: 22, y: 92 }, { x: 33, y: 58 }, { x: 5, y: 38 }, { x: 39, y: 38 },
    ],
  },
  moon: {
    id: 'moon',
    label: { ms: 'bulan', en: 'moon' },
    emoji: '🌙',
    points: [
      { x: 65, y: 8 }, { x: 40, y: 18 }, { x: 25, y: 40 }, { x: 25, y: 62 }, { x: 40, y: 84 },
      { x: 65, y: 92 }, { x: 50, y: 75 }, { x: 44, y: 60 }, { x: 44, y: 40 }, { x: 50, y: 25 },
    ],
  },
  tree: {
    id: 'tree',
    label: { ms: 'pokok', en: 'tree' },
    emoji: '🌳',
    points: [
      { x: 50, y: 5 }, { x: 72, y: 35 }, { x: 60, y: 35 }, { x: 80, y: 62 }, { x: 58, y: 62 }, { x: 58, y: 92 },
      { x: 42, y: 92 }, { x: 42, y: 62 }, { x: 20, y: 62 }, { x: 40, y: 35 }, { x: 28, y: 35 },
    ],
  },
};

// Puzzle pictures, composed from code until illustrated scenes arrive.
export const PUZZLE_SCENES: PuzzleScene[] = [
  {
    id: 'farm',
    label: { ms: 'ladang', en: 'farm' },
    sky: '#BFE8FF',
    ground: '#A6E36E',
    horizon: 58,
    stickers: [
      { emoji: '☀️', x: 82, y: 14, size: 18 },
      { emoji: '🌳', x: 22, y: 38, size: 28 },
      { emoji: '🐄', x: 62, y: 66, size: 30 },
      { emoji: '🐔', x: 24, y: 80, size: 18 },
    ],
  },
  {
    id: 'mosque',
    label: { ms: 'masjid', en: 'mosque' },
    sky: '#3B2F7A',
    ground: '#5E8C61',
    horizon: 72,
    stickers: [
      { emoji: '🌙', x: 80, y: 16, size: 20 },
      { emoji: '⭐', x: 24, y: 14, size: 12 },
      { emoji: '🕌', x: 50, y: 52, size: 44 },
      { emoji: '🌴', x: 14, y: 70, size: 22 },
    ],
  },
  {
    id: 'sea',
    label: { ms: 'laut', en: 'sea' },
    sky: '#CDEFFF',
    ground: '#3FA9F5',
    horizon: 44,
    stickers: [
      { emoji: '⛵', x: 28, y: 32, size: 26 },
      { emoji: '☀️', x: 80, y: 14, size: 18 },
      { emoji: '🐬', x: 66, y: 62, size: 26 },
      { emoji: '🐟', x: 26, y: 78, size: 16 },
    ],
  },
  {
    id: 'garden',
    label: { ms: 'taman', en: 'garden' },
    sky: '#FFF1C9',
    ground: '#8CD867',
    horizon: 50,
    stickers: [
      { emoji: '🦋', x: 72, y: 20, size: 18 },
      { emoji: '🌻', x: 22, y: 56, size: 30 },
      { emoji: '🌷', x: 54, y: 72, size: 22 },
      { emoji: '🐝', x: 42, y: 26, size: 14 },
      { emoji: '🐇', x: 80, y: 74, size: 22 },
    ],
  },
];
