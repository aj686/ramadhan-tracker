import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useGameSettings } from '@/hooks/use-game-settings';
import { spacing } from '@/constants/theme';
import { IconCircleButton } from './icon-circle-button';

interface GameHeaderProps {
  onBack: () => void;
  backLabel: string;
  children?: React.ReactNode;
}

// Back on the left, language and sound always in reach on the right.
export const GameHeader: React.FC<GameHeaderProps> = ({ onBack, backLabel, children }) => {
  const { language, muted, t, toggleLanguage, toggleMuted } = useGameSettings();

  return (
    <View style={styles.row}>
      <IconCircleButton icon="chevron-back" label={backLabel} onPress={onBack} />
      <View style={styles.middle}>{children}</View>
      <IconCircleButton
        text={language === 'ms' ? 'BM' : 'EN'}
        label={t.switchLanguage}
        onPress={toggleLanguage}
      />
      <IconCircleButton
        icon={muted ? 'volume-mute' : 'volume-high'}
        label={muted ? t.soundOff : t.soundOn}
        onPress={toggleMuted}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  middle: { flex: 1, alignItems: 'center' },
});
