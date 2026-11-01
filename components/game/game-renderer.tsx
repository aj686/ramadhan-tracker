import React from 'react';
import type { Lang, Question } from '@/data/games/schema';
import type { GameReport } from '@/hooks/use-game-session';
import { ArrangeGame } from './arrange-game';
import { ChoiceGame } from './choice-game';
import { DotsGame } from './dots-game';
import { FillGame } from './fill-game';
import { MatchingGame } from './matching-game';
import { PuzzleGame } from './puzzle-game';
import { SortGame } from './sort-game';
import { TracingGame } from './tracing-game';

interface GameRendererProps {
  question: Question;
  language: Lang;
  hintLevel: number;
  solved: boolean;
  report: (report: GameReport) => void;
  canHear: boolean;
}

// Maps a question to its game. Language is in the key because a word's letters change with language,
// so switching mid-question restarts that question rather than mixing two spellings.
export const GameRenderer: React.FC<GameRendererProps> = ({ question, language, ...shared }) => {
  const key = `${question.id}-${language}`;
  const props = { language, ...shared };

  switch (question.kind) {
    case 'choice':
      return <ChoiceGame key={key} question={question} {...props} />;
    case 'match':
      return <MatchingGame key={key} question={question} {...props} />;
    case 'sort':
      return <SortGame key={key} question={question} {...props} />;
    case 'arrange':
      return <ArrangeGame key={key} question={question} {...props} />;
    case 'puzzle':
      return <PuzzleGame key={key} question={question} {...props} />;
    case 'trace':
      return <TracingGame key={key} question={question} {...props} />;
    case 'dots':
      return <DotsGame key={key} question={question} {...props} />;
    case 'fill':
      return <FillGame key={key} question={question} {...props} />;
  }
};
