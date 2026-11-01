// Shapes of all game content. New activities are added as data in activities.ts
// and never need changes to the engine, as long as they use an existing mechanic.

export type Lang = 'ms' | 'en';
export type LocalText = Record<Lang, string>;

export type AgeGroup = 'toddler' | 'preschool';
export type JourneyId = 'fundamentals' | 'activities' | 'kembara' | 'little_step';
export type Difficulty = 1 | 2 | 3;
export type ShapeKind = 'circle' | 'square' | 'triangle' | 'rectangle' | 'oval' | 'star' | 'heart' | 'diamond';
export type TileTint = 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'orange';

export type PoolId =
  | 'letters' | 'numbers' | 'colours' | 'shapes' | 'animals'
  | 'fruits' | 'occupations' | 'body' | 'vehicles' | 'clothing';

export type Mechanic = 'choice' | 'match' | 'sort' | 'arrange' | 'puzzle' | 'trace' | 'dots' | 'fill';

// `image` and `audio` are keys into services/game/media.ts. Until a file is registered there,
// the item falls back to its emoji or text, and to text-to-speech.
export interface GameItem {
  id: string;
  label: LocalText;
  emoji?: string;
  image?: string;
  color?: string;
  shape?: ShapeKind;
  glyph?: string;
  sound?: LocalText;
  audio?: string;
}

interface QuestionBase {
  id: string;
  prompt: LocalText;
  say: LocalText;
  audio?: string;
}

export interface ChoiceQuestion extends QuestionBase {
  kind: 'choice';
  options: GameItem[];
  answerId: string;
  showLabels: boolean;
  listenOnly: boolean;
  scene?: GameItem;
  wordMask?: string;
  revealWord?: string;
}

export interface MatchPair {
  id: string;
  left: GameItem;
  right: GameItem;
  rightSilhouette: boolean;
}

export interface MatchQuestion extends QuestionBase {
  kind: 'match';
  pairs: MatchPair[];
  rightOrder: string[];
}

export interface SortToken {
  id: string;
  item: GameItem;
  binId: string;
}

export interface SortQuestion extends QuestionBase {
  kind: 'sort';
  bins: GameItem[];
  tokens: SortToken[];
}

export interface ArrangeLetter {
  id: string;
  letter: string;
}

export interface ArrangeQuestion extends QuestionBase {
  kind: 'arrange';
  item: GameItem;
  word: string;
  letters: ArrangeLetter[];
}

export interface PuzzleQuestion extends QuestionBase {
  kind: 'puzzle';
  sceneId: string;
  cols: number;
  rows: number;
  pieceOrder: number[];
}

export interface TraceQuestion extends QuestionBase {
  kind: 'trace';
  word: string;
  item?: GameItem;
}

export interface DotsQuestion extends QuestionBase {
  kind: 'dots';
  figureId: string;
}

export interface FillQuestion extends QuestionBase {
  kind: 'fill';
  letter: string;
  palette: GameItem[];
}

export type Question =
  | ChoiceQuestion
  | MatchQuestion
  | SortQuestion
  | ArrangeQuestion
  | PuzzleQuestion
  | TraceQuestion
  | DotsQuestion
  | FillQuestion;

// How questions are generated for an activity. Builders live in services/game/question-builder.ts.
export type ContentSpec =
  | {
      type: 'pick';
      pools: PoolId[];
      rounds: number;
      optionCounts: number[];
      style: 'find' | 'sound' | 'listen';
      hideLabelsFromRound?: number;
      spellingRounds?: number;
    }
  | { type: 'missing'; pools: PoolId[]; rounds: number; optionCount: number; maxLength: number }
  | { type: 'match'; set: 'letter_case' | 'shape_silhouette' | 'related'; rounds: number; pairCount: number }
  | { type: 'sort'; rounds: number; binCount: number; tokenCount: number }
  | { type: 'arrange'; pools: PoolId[]; rounds: number; maxLength: number }
  | { type: 'puzzle'; grids: { cols: number; rows: number }[] }
  | { type: 'trace'; rounds: number }
  | { type: 'dots'; figures: string[] }
  | { type: 'fill'; rounds: number; paletteSize: number };

export interface Activity {
  id: string;
  title: LocalText;
  instructions: LocalText;
  age: AgeGroup;
  journey: JourneyId;
  category: string;
  difficulty: Difficulty;
  emoji: string;
  tint: TileTint;
  mechanic: Mechanic;
  spec: ContentSpec;
}

export interface DotFigure {
  id: string;
  label: LocalText;
  emoji: string;
  points: { x: number; y: number }[];
}

export interface SceneSticker {
  emoji: string;
  x: number;
  y: number;
  size: number;
}

export interface PuzzleScene {
  id: string;
  label: LocalText;
  sky: string;
  ground: string;
  horizon: number;
  stickers: SceneSticker[];
}
