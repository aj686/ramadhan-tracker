import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';
import { GAME_MAX_WIDTH } from './types';

interface GameLayoutProps {
  children: React.ReactNode;
}

export const GameLayout: React.FC<GameLayoutProps> = ({ children }) => {
  const { game } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.outer, { backgroundColor: game.background }]}>
      <View style={[styles.inner, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: { flex: 1 },
  inner: { flex: 1, width: '100%', maxWidth: GAME_MAX_WIDTH, alignSelf: 'center' },
});
