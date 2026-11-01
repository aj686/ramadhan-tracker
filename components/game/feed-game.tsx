import React, { useRef, useState } from 'react';
import { Animated, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { FeedQuestion, GameItem } from '@/data/games/schema';
import { useTheme } from '@/hooks/use-theme';
import type { CharacterClip } from '@/services/game/character-motion';
import { borderRadius, spacing, typography } from '@/constants/theme';
import type { LookTarget } from './character-3d';
import { CharacterView } from './character-view';
import { Draggable } from './draggable';
import { ItemVisual } from './item-visual';
import { GAME_MAX_WIDTH, GameProps, NATIVE_DRIVER } from './types';

const SIDE_PADDING = spacing.xl;
const MAX_CHARACTER_SIZE = 230;
const MOUTH_HEIGHT = 0.43; // how far down the character's mouth sits

const clamp = (value: number) => Math.max(-1, Math.min(1, value));

type Rect = { x: number; y: number; width: number; height: number };

// Feed the character: drag the fruit it asks for to its mouth, or just tap the fruit.
// The character stays mounted across rounds, because rebuilding a 3D scene for every question
// would stutter. Only FeedRound restarts with each question.
export const FeedGame: React.FC<GameProps<FeedQuestion>> = ({ question, language, hintLevel, solved, report }) => {
  const { game } = useTheme();
  const { width, height } = useWindowDimensions();
  const [clip, setClip] = useState<{ name: CharacterClip; id: number }>({ name: 'idle', id: 0 });
  const [bite] = useState(() => new Animated.Value(0));
  const [biting, setBiting] = useState<GameItem | null>(null);
  const characterRef = useRef<View | null>(null);
  const characterRect = useRef<Rect | null>(null);
  const lookTarget = useRef<LookTarget | null>(null);

  const contentWidth = Math.min(width, GAME_MAX_WIDTH) - SIDE_PADDING * 2;
  const characterSize = Math.min(MAX_CHARACTER_SIZE, contentWidth * 0.72, height * 0.3);
  const tokenSize = Math.min(104, (contentWidth - spacing.md * 2) / 3);
  const visualSize = tokenSize * 0.56;

  const play = (name: CharacterClip) => setClip((current) => ({ name, id: current.id + 1 }));

  const measureCharacter = () => {
    characterRef.current?.measureInWindow((x, y, w, h) => {
      characterRect.current = { x, y, width: w, height: h };
    });
  };

  const isOnCharacter = (pageX: number, pageY: number) => {
    const rect = characterRect.current;
    return (
      rect !== null &&
      pageX >= rect.x &&
      pageX <= rect.x + rect.width &&
      pageY >= rect.y &&
      pageY <= rect.y + rect.height
    );
  };

  // The head follows the fruit: -1 to 1 either side of the character's centre.
  const lookAt = (pageX: number, pageY: number) => {
    const rect = characterRect.current;
    if (!rect) return;
    lookTarget.current = {
      x: clamp((pageX - (rect.x + rect.width / 2)) / rect.width),
      y: clamp((pageY - (rect.y + rect.height * MOUTH_HEIGHT)) / rect.height),
    };
  };

  const eat = (item: GameItem) => {
    setBiting(item);
    bite.setValue(1);
    Animated.timing(bite, { toValue: 0, duration: 420, useNativeDriver: NATIVE_DRIVER }).start(() => setBiting(null));
    play('eat');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={game.sceneGradient} style={styles.scene}>
        <View
          ref={characterRef}
          onLayout={measureCharacter}
          accessibilityLabel={question.character.label[language]}
          style={{ width: characterSize, height: characterSize }}
        >
          <CharacterView
            item={question.character}
            clip={clip.name}
            playId={clip.id}
            size={characterSize}
            lookTarget={lookTarget}
            onClipChange={play}
          />
          {biting && (
            <Animated.View
              style={[
                styles.bite,
                {
                  top: characterSize * MOUTH_HEIGHT - visualSize / 2,
                  left: characterSize / 2 - visualSize / 2,
                  opacity: bite,
                  transform: [{ scale: bite }],
                },
              ]}
            >
              <ItemVisual item={biting} size={visualSize} />
            </Animated.View>
          )}
        </View>
      </LinearGradient>

      <FeedRound
        key={`${question.id}-${language}`}
        question={question}
        language={language}
        hintLevel={hintLevel}
        solved={solved}
        report={report}
        tokenSize={tokenSize}
        visualSize={visualSize}
        onEat={eat}
        onRefuse={() => play('no')}
        onDragStart={measureCharacter}
        onDragMove={lookAt}
        onDragEnd={() => {
          lookTarget.current = null;
        }}
        isOnCharacter={isOnCharacter}
      />
    </View>
  );
};

interface FeedRoundProps extends Omit<GameProps<FeedQuestion>, 'canHear'> {
  tokenSize: number;
  visualSize: number;
  onEat: (item: GameItem) => void;
  onRefuse: () => void;
  onDragStart: () => void;
  onDragMove: (pageX: number, pageY: number) => void;
  onDragEnd: () => void;
  isOnCharacter: (pageX: number, pageY: number) => boolean;
}

const FeedRound: React.FC<FeedRoundProps> = ({
  question,
  language,
  hintLevel,
  solved,
  report,
  tokenSize,
  visualSize,
  onEat,
  onRefuse,
  onDragStart,
  onDragMove,
  onDragEnd,
  isOnCharacter,
}) => {
  const { game } = useTheme();
  const [wrongIds, setWrongIds] = useState<string[]>([]);

  // A hint takes wrong fruit away one at a time, as in the picture-choice games.
  const hiddenIds = question.options
    .filter((option) => option.id !== question.answerId && !wrongIds.includes(option.id))
    .slice(0, hintLevel)
    .map((option) => option.id);

  const feed = (option: GameItem) => {
    if (solved || wrongIds.includes(option.id)) return;

    if (option.id === question.answerId) {
      onEat(option);
      report({ correct: true, solved: true, speak: option.label });
    } else {
      setWrongIds((ids) => [...ids, option.id]);
      onRefuse();
      report({ correct: false, speak: option.label });
    }
  };

  return (
    <View style={styles.tokens}>
      {question.options.map((option) => {
        const isEaten = solved && option.id === question.answerId;
        const isOut = wrongIds.includes(option.id) || (solved && !isEaten);

        if (isEaten || hiddenIds.includes(option.id)) {
          return <View key={option.id} style={{ width: tokenSize, height: tokenSize + spacing.xl }} />;
        }

        return (
          <View key={option.id} style={[styles.token, { width: tokenSize, opacity: isOut ? 0.45 : 1 }]}>
            <Draggable
              label={option.label[language]}
              disabled={isOut}
              onDragStart={onDragStart}
              onDragMove={onDragMove}
              onDragEnd={onDragEnd}
              onDrop={(x, y) => {
                if (isOnCharacter(x, y)) feed(option);
              }}
              onTap={() => feed(option)}
              style={[
                styles.tokenCard,
                { width: tokenSize, height: tokenSize, backgroundColor: game.surface, shadowColor: game.shadow },
              ]}
            >
              <ItemVisual item={option} size={visualSize} />
            </Draggable>
            <Text style={[styles.label, { color: game.text }]} numberOfLines={1}>
              {option.label[language]}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  // Anchored to the top, so the cat stays still when the shell's Next button appears.
  container: { flex: 1, paddingHorizontal: SIDE_PADDING, paddingTop: spacing.lg, gap: spacing.lg },
  scene: { borderRadius: borderRadius.xl, alignItems: 'center', paddingVertical: spacing.lg },
  bite: { position: 'absolute', pointerEvents: 'none' },
  tokens: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md },
  token: { alignItems: 'center', gap: spacing.xs },
  tokenCard: {
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  label: { ...typography.subhead, fontWeight: '700' },
});
