import type { Lang } from '@/data/games/schema';
import type { GameReport } from '@/hooks/use-game-session';

// What every game receives from the shell. A game only reports what happened;
// the shell owns scoring, sound, feedback and moving to the next question.
export interface GameProps<Q> {
  question: Q;
  language: Lang;
  hintLevel: number;
  solved: boolean;
  report: (report: GameReport) => void;
  canHear: boolean;
}

export const NATIVE_DRIVER = process.env.EXPO_OS !== 'web';
export const GAME_MAX_WIDTH = 560;
export const MIN_TOUCH_TARGET = 64;
