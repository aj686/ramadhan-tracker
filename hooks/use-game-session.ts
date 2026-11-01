import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { Activity, LocalText, Question } from '@/data/games/schema';
import { GAME_STRINGS } from '@/i18n/games';
import { buildQuestions, roundCount } from '@/services/game/question-builder';
import { newSeed } from '@/services/game/random';
import { createSession, sessionReducer } from '@/services/game/session';
import { useGameAudio } from './use-game-audio';
import { useGameProgress } from './use-game-progress';
import { useGameSettings } from './use-game-settings';

export interface GameReport {
  correct: boolean;
  solved?: boolean;
  speak?: LocalText | string;
}

export type FeedbackState = { kind: 'none' } | { kind: 'correct'; text: string } | { kind: 'wrong'; text: string };

// Toddlers get a gentle nudge on their own after two wrong tries. Older children ask for hints.
const AUTO_HINT_AFTER_MISTAKES = 2;

export const useGameSession = (activity: Activity) => {
  const { language, t } = useGameSettings();
  const audio = useGameAudio();
  const { say, feedback: playFeedback } = audio;
  const { recordSession } = useGameProgress();

  const [seed, setSeed] = useState(newSeed);
  const [state, dispatch] = useReducer(sessionReducer, roundCount(activity.spec), createSession);
  const [feedback, setFeedback] = useState<FeedbackState>({ kind: 'none' });
  const recordedRef = useRef(false);

  // Same seed in either language, so switching language keeps the same round.
  const questions = useMemo(() => buildQuestions(activity, language, seed), [activity, language, seed]);
  const question: Question | undefined = questions[state.index];

  const spokenText = useCallback(
    (text: LocalText | string | undefined) =>
      text === undefined ? '' : typeof text === 'string' ? text : text[language],
    [language],
  );

  useEffect(() => {
    if (state.status === 'playing' && question) say(question.say, question.audio);
  }, [state.status, question, say]);

  const start = useCallback(() => {
    setFeedback({ kind: 'none' });
    dispatch({ type: 'start' });
  }, []);

  const report = useCallback(
    ({ correct, solved, speak }: GameReport) => {
      dispatch({ type: 'attempt', correct });
      const praises = GAME_STRINGS[language].praise;

      if (correct && solved) {
        dispatch({ type: 'solve' });
        const praise = praises[Math.floor(Math.random() * praises.length)];
        setFeedback({ kind: 'correct', text: praise });
        playFeedback('correct');
        say(`${spokenText(speak)} ${praise}`.trim());
      } else if (correct) {
        setFeedback({ kind: 'none' });
        playFeedback('correct');
        if (speak) say(speak);
      } else {
        const tryAgain = GAME_STRINGS[language].tryAgain;
        setFeedback({ kind: 'wrong', text: tryAgain });
        playFeedback('wrong');
        say(`${spokenText(speak)} ${tryAgain}`.trim());
      }
    },
    [language, playFeedback, say, spokenText],
  );

  const requestHint = useCallback(() => {
    dispatch({ type: 'hint' });
  }, []);

  const next = useCallback(() => {
    const upcoming = sessionReducer(state, { type: 'next' });
    dispatch({ type: 'next' });
    setFeedback({ kind: 'none' });

    if (upcoming.status === 'complete' && !recordedRef.current) {
      recordedRef.current = true;
      recordSession(activity.id, {
        stars: upcoming.stars,
        correct: upcoming.correct,
        attempts: upcoming.attempts,
      });
      playFeedback('complete');
      say(GAME_STRINGS[language].completeTitle(upcoming.stars));
    }
  }, [activity.id, language, playFeedback, recordSession, say, state]);

  const replay = useCallback(() => {
    recordedRef.current = false;
    setSeed(newSeed());
    setFeedback({ kind: 'none' });
    dispatch({ type: 'restart' });
    dispatch({ type: 'start' });
  }, []);

  const hintLevel =
    state.hints + (activity.age === 'toddler' && state.mistakes >= AUTO_HINT_AFTER_MISTAKES ? 1 : 0);

  return {
    state,
    question,
    feedback,
    hintLevel,
    language,
    t,
    audio,
    start,
    report,
    requestHint,
    next,
    replay,
  };
};
