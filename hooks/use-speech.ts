import { useCallback, useRef, useState } from 'react';
import * as Speech from 'expo-speech';
import type { CardState } from '@/types';

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function speak(text: string, lang = 'en-US', rate = 0.9): Promise<void> {
  return new Promise((resolve, reject) => {
    Speech.speak(text, {
      language: lang,
      rate,
      onDone: resolve,
      onError: reject,
      onStopped: resolve,
    });
  });
}

export function useSpeech() {
  const [cardState, setCardState] = useState<CardState>('idle');
  const [activeLetterIndex, setActiveLetterIndex] = useState(-1);
  const cancelledRef = useRef(false);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    Speech.stop();
    setCardState('idle');
    setActiveLetterIndex(-1);
  }, []);

  const isCancelled = () => cancelledRef.current;

  const playWordSequence = useCallback(async (word: string) => {
    cancelledRef.current = false;
    setCardState('playing_word');
    setActiveLetterIndex(-1);

    for (let i = 0; i < 3; i++) {
      if (isCancelled()) return;
      await speak(word);
      await delay(300);
    }

    if (isCancelled()) return;
    setCardState('playing_spell');

    const letters = word.toUpperCase().split('');
    for (let i = 0; i < letters.length; i++) {
      if (isCancelled()) return;
      setActiveLetterIndex(i);
      await speak(letters[i], 'en-US', 0.8);
      await delay(200);
    }
    setActiveLetterIndex(-1);

    if (isCancelled()) return;
    setCardState('playing_word');
    await speak(word);

    if (!isCancelled()) setCardState('done');
  }, []);

  const playAllahNameSequence = useCallback(async (transliteration: string, meaning: string) => {
    cancelledRef.current = false;
    setCardState('playing_word');
    setActiveLetterIndex(-1);

    for (let i = 0; i < 2; i++) {
      if (isCancelled()) return;
      await speak(transliteration, 'ar-SA', 0.75);
      await delay(400);
    }

    if (isCancelled()) return;
    await speak(meaning, 'en-US', 0.85);

    if (!isCancelled()) setCardState('done');
  }, []);

  const playProphetSequence = useCallback(async (name: string, description: string) => {
    cancelledRef.current = false;
    setCardState('playing_word');
    setActiveLetterIndex(-1);

    if (isCancelled()) return;
    await speak(name, 'en-US', 0.85);
    await delay(400);

    if (isCancelled()) return;
    await speak(description, 'en-US', 0.85);

    if (!isCancelled()) setCardState('done');
  }, []);

  return {
    cardState,
    activeLetterIndex,
    stop,
    playWordSequence,
    playAllahNameSequence,
    playProphetSequence,
  };
}
