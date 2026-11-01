import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useGameSettings } from '@/hooks/use-game-settings';
import { useTheme } from '@/hooks/use-theme';
import { borderRadius, spacing, typography } from '@/constants/theme';
import { PillButton } from './pill-button';

const randomBetween = (low: number, high: number) => low + Math.floor(Math.random() * (high - low + 1));

const createChallenge = () => {
  const a = randomBetween(6, 9);
  const b = randomBetween(3, 9);
  const answer = a * b;
  const options = new Set<number>([answer]);
  while (options.size < 3) {
    options.add(answer + randomBetween(-9, 9) || answer + 10);
  }
  return { a, b, answer, options: [...options].sort(() => Math.random() - 0.5) };
};

interface ParentalGateProps {
  visible: boolean;
  onPass: () => void;
  onCancel: () => void;
}

// Keeps young children inside the games: leaving needs a sum they cannot do yet.
export const ParentalGate: React.FC<ParentalGateProps> = ({ visible, onPass, onCancel }) => {
  const { game } = useTheme();
  const { t } = useGameSettings();
  const [challenge, setChallenge] = useState(createChallenge);
  const [isWrong, setIsWrong] = useState(false);

  const handleAnswer = (value: number) => {
    if (value === challenge.answer) {
      setIsWrong(false);
      setChallenge(createChallenge());
      onPass();
    } else {
      setIsWrong(true);
      setChallenge(createChallenge());
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: game.surface }]}>
          <Text style={[styles.title, { color: game.text }]} accessibilityRole="header">
            {t.parentCheck}
          </Text>
          <Text style={[styles.body, { color: game.textSecondary }]}>{t.parentCheckBody}</Text>
          <Text style={[styles.sum, { color: game.primary }]}>
            {challenge.a} × {challenge.b} = ?
          </Text>
          {isWrong && <Text style={[styles.wrong, { color: game.gentle }]}>{t.parentCheckWrong}</Text>}

          <View style={styles.options}>
            {challenge.options.map((value) => (
              <Pressable
                key={value}
                onPress={() => handleAnswer(value)}
                accessibilityRole="button"
                accessibilityLabel={String(value)}
                style={[styles.option, { backgroundColor: game.primaryMuted }]}
              >
                <Text style={[styles.optionText, { color: game.text }]}>{value}</Text>
              </Pressable>
            ))}
          </View>

          <PillButton label={t.cancel} variant="light" onPress={onCancel} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 17, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: { width: '100%', maxWidth: 420, borderRadius: borderRadius.xxl, padding: spacing.xl, gap: spacing.md },
  title: { ...typography.title2, textAlign: 'center' },
  body: { ...typography.subhead, textAlign: 'center' },
  sum: { ...typography.title1, textAlign: 'center' },
  wrong: { ...typography.footnote, textAlign: 'center', fontWeight: '600' },
  options: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  option: { flex: 1, minHeight: 60, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  optionText: { ...typography.title3, fontWeight: '800' },
});
