import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { LocalText } from '@/data/games/schema';
import { audioManager } from '@/services/game/audio-manager';
import { useGameSettingsStore } from '@/store/game-settings-store';

export const useGameAudio = () => {
  const language = useGameSettingsStore((state) => state.language);
  const muted = useGameSettingsStore((state) => state.muted);
  const [canSpeak, setCanSpeak] = useState(true);

  useEffect(() => {
    audioManager.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    let active = true;
    audioManager.canSpeak(language).then((available) => {
      if (active) setCanSpeak(available);
    });
    return () => {
      active = false;
    };
  }, [language]);

  useEffect(() => () => audioManager.stop(), []);

  const say = useCallback(
    (text: LocalText | string, clip?: string) => {
      const spoken = typeof text === 'string' ? text : text[language];
      audioManager.say(spoken, language, { clip });
    },
    [language],
  );

  const feedback = useCallback((kind: 'correct' | 'wrong' | 'complete') => {
    audioManager.sfx(kind === 'correct' ? 'sfx_correct' : kind === 'wrong' ? 'sfx_wrong' : 'sfx_complete');
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(
        kind === 'wrong' ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
    }
  }, []);

  return { say, feedback, canSpeak, muted, language, stop: audioManager.stop };
};
