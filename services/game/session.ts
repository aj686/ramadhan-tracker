// Game rules with no React or audio, so every game shares them and tests can run them directly.

export type SessionStatus = 'intro' | 'playing' | 'complete';

export interface SessionState {
  status: SessionStatus;
  index: number;
  total: number;
  solved: boolean;
  mistakes: number;
  hints: number;
  attempts: number;
  correct: number;
  firstTry: number;
  stars: number;
}

export type SessionAction =
  | { type: 'start' }
  | { type: 'attempt'; correct: boolean }
  | { type: 'solve' }
  | { type: 'hint' }
  | { type: 'next' }
  | { type: 'restart' };

export const createSession = (total: number): SessionState => ({
  status: 'intro',
  index: 0,
  total,
  solved: false,
  mistakes: 0,
  hints: 0,
  attempts: 0,
  correct: 0,
  firstTry: 0,
  stars: 0,
});

// Every finished game earns at least one star: young children should never see a failure screen.
export const starsFor = (firstTry: number, total: number): number => {
  if (total <= 0) return 1;
  const ratio = firstTry / total;
  if (ratio >= 0.85) return 3;
  if (ratio >= 0.5) return 2;
  return 1;
};

export const sessionReducer = (state: SessionState, action: SessionAction): SessionState => {
  switch (action.type) {
    case 'start':
      return { ...createSession(state.total), status: 'playing' };

    case 'restart':
      return createSession(state.total);

    case 'attempt':
      // Taps after a question is solved must not change the score.
      if (state.status !== 'playing' || state.solved) return state;
      return {
        ...state,
        attempts: state.attempts + 1,
        correct: state.correct + (action.correct ? 1 : 0),
        mistakes: state.mistakes + (action.correct ? 0 : 1),
      };

    case 'hint':
      if (state.status !== 'playing' || state.solved) return state;
      return { ...state, hints: state.hints + 1 };

    case 'solve':
      if (state.status !== 'playing' || state.solved) return state;
      return {
        ...state,
        solved: true,
        firstTry: state.firstTry + (state.mistakes === 0 && state.hints === 0 ? 1 : 0),
      };

    case 'next': {
      if (state.status !== 'playing' || !state.solved) return state;
      if (state.index + 1 >= state.total) {
        return { ...state, status: 'complete', stars: starsFor(state.firstTry, state.total) };
      }
      return { ...state, index: state.index + 1, solved: false, mistakes: 0, hints: 0 };
    }
  }
};
