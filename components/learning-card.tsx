import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/hooks/use-theme';
import { useSpeech } from '@/hooks/use-speech';
import { LetterHighlight } from './letter-highlight';
import { borderRadius, spacing, typography } from '@/constants/theme';
import type { LearningItem, AllahName, Prophet, ModuleId } from '@/types';

type LearningCardProps =
  | { moduleId: 'animals' | 'transport' | 'countries'; item: LearningItem }
  | { moduleId: 'allah_names'; item: AllahName }
  | { moduleId: 'prophets'; item: Prophet };

export const LearningCard: React.FC<LearningCardProps> = ({ moduleId, item }) => {
  const { colors, isDark } = useTheme();
  const {
    cardState, activeLetterIndex, stop,
    playWordSequence, playAllahNameSequence, playProphetSequence,
  } = useSpeech();

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (cardState === 'playing_word') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [cardState]);

  useEffect(() => {
    return () => { stop(); };
  }, []);

  const handleTap = () => {
    if (cardState === 'playing_word' || cardState === 'playing_spell') {
      stop();
      return;
    }

    if (moduleId === 'allah_names') {
      const n = item as AllahName;
      playAllahNameSequence(n.transliteration, n.meaning);
    } else if (moduleId === 'prophets') {
      const p = item as Prophet;
      playProphetSequence(p.name, p.description);
    } else {
      const l = item as LearningItem;
      playWordSequence(l.word);
    }
  };

  const renderContent = () => {
    if (moduleId === 'allah_names') {
      const n = item as AllahName;
      return (
        <>
          <Text style={styles.numberBadge}>{n.number}</Text>
          <Animated.Text style={[styles.emoji, { transform: [{ scale: pulseAnim }] }]}>
            📿
          </Animated.Text>
          <Text style={[styles.arabicName, { color: colors.text }]}>{n.arabic}</Text>
          <Text style={[styles.word, { color: colors.text }]}>{n.transliteration}</Text>
          <Text style={[styles.malay, { color: colors.textSecondary }]}>{n.meaning}</Text>
        </>
      );
    }

    if (moduleId === 'prophets') {
      const p = item as Prophet;
      return (
        <>
          <Text style={styles.numberBadge}>{p.order}</Text>
          <Animated.Text style={[styles.emoji, { transform: [{ scale: pulseAnim }] }]}>
            👳
          </Animated.Text>
          <Text style={[styles.arabicName, { color: colors.text }]}>{p.arabicName}</Text>
          <Text style={[styles.word, { color: colors.text }]}>{p.name}</Text>
          <Text style={[styles.malay, { color: colors.textSecondary }]} numberOfLines={2}>
            {p.description}
          </Text>
        </>
      );
    }

    const l = item as LearningItem;
    return (
      <>
        <Animated.Text style={[styles.emoji, { transform: [{ scale: pulseAnim }] }]}>
          {l.emoji}
        </Animated.Text>
        {cardState === 'playing_spell' ? (
          <LetterHighlight word={l.word} activeIndex={activeLetterIndex} />
        ) : (
          <Text style={[styles.word, { color: colors.text }]}>{l.word}</Text>
        )}
        <Text style={[styles.malay, { color: colors.textSecondary }]}>{l.malay}</Text>
      </>
    );
  };

  const isPlaying = cardState === 'playing_word' || cardState === 'playing_spell';

  return (
    <TouchableOpacity onPress={handleTap} activeOpacity={0.8} style={styles.wrapper}>
      <View style={[styles.card, { borderColor: colors.glassBorder, shadowColor: colors.glassShadow }]}>
        <BlurView intensity={60} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
          <View style={[styles.content, { backgroundColor: colors.glass }]}>
            {renderContent()}
            <View style={[styles.actionRow, { borderTopColor: colors.borderLight }]}>
              {cardState === 'done' ? (
                <View style={styles.actionBtn}>
                  <Ionicons name="reload" size={16} color={colors.primary} />
                  <Text style={[styles.actionText, { color: colors.primary }]}>Replay</Text>
                </View>
              ) : isPlaying ? (
                <View style={styles.actionBtn}>
                  <Ionicons name="stop-circle" size={16} color={colors.error} />
                  <Text style={[styles.actionText, { color: colors.error }]}>Stop</Text>
                </View>
              ) : (
                <View style={styles.actionBtn}>
                  <Ionicons name="volume-high" size={16} color={colors.primary} />
                  <Text style={[styles.actionText, { color: colors.primary }]}>Listen</Text>
                </View>
              )}
            </View>
          </View>
        </BlurView>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '48%',
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  blur: { overflow: 'hidden' },
  content: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.sm,
    paddingBottom: 0,
    minHeight: 170,
  },
  numberBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  emoji: {
    fontSize: 44,
    marginBottom: spacing.sm,
  },
  arabicName: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  word: {
    ...typography.headline,
    textAlign: 'center',
  },
  malay: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: 2,
  },
  actionRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    width: '100%',
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    ...typography.caption,
    fontWeight: '600',
  },
});
