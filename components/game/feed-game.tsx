import React, { useRef, useState } from 'react';
import { Animated, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { FeedQuestion, GameItem } from '@/data/games/schema';
import { useTheme } from '@/hooks/use-theme';
import type { CharacterClip } from '@/services/game/sprite';
import { borderRadius, spacing, typography } from '@/constants/theme';
import { CharacterSprite } from './character-sprite';
import { Draggable } from './draggable';
import { ItemVisual } from './item-visual';
import { GAME_MAX_WIDTH, GameProps, NATIVE_DRIVER } from './types';

const SIDE_PADDING = spacing.xl;
const MAX_CHARACTER_SIZE = 170; // the sprite is 256 px a frame, so any larger starts to look soft
const MOUTH_HEIGHT = 0.55; // how far down the character its mouth sits, shared with the artwork

type Rect = { x: number; y: number; width: number; height: number };

// Feed the character: drag the fruit it asks for to its mouth, or just tap the fruit.
export const FeedGame: React.FC<GameProps<FeedQuestion>> = ({ question, language, hintLevel, solved, report }) => {
  const { game } = useTheme();
  const { width, height } = useWindowDimensions();
  const [clip, setClip] = useState<{ name: CharacterClip; id: number }>({ name: 'idle', id: 0 });
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [bite] = useState(() => new Animated.Value(0));
  const [biting, setBiting] = useState<GameItem | null>(null);
  const characterRef = useRef<View | null>(null);
  const characterRect = useRef<Rect | null>(null);

  const contentWidth = Math.min(width, GAME_MAX_WIDTH) - SIDE_PADDING * 2;
  const characterSize = Math.min(MAX_CHARACTER_SIZE, contentWidth * 0.6, height * 0.26);
  const tokenSize = Math.min(104, (contentWidth - spacing.md * 2) / 3);
  const visualSize = tokenSize * 0.56;

  const play = (name: CharacterClip) => setClip((current) => ({ name, id: current.id + 1 }));

  const measureCharacter = () => {
    characterRef.current?.measureInWindow((x, y, w, h) => {
      characterRect.current = { x, y, width: w, height: h };
    });
  };

  // A hint takes wrong fruit away one at a time, as in the picture-choice games.
  const hiddenIds = question.options
    .filter((option) => option.id !== question.answerId && !wrongIds.includes(option.id))
    .slice(0, hintLevel)
    .map((option) => option.id);

  const feed = (option: GameItem) => {
    if (solved || wrongIds.includes(option.id)) return;

    if (option.id === question.answerId) {
      setBiting(option);
      bite.setValue(1);
      Animated.timing(bite, { toValue: 0, duration: 420, useNativeDriver: NATIVE_DRIVER }).start(() => setBiting(null));
      play('eat');
      report({ correct: true, solved: true, speak: option.label });
    } else {
      setWrongIds((ids) => [...ids, option.id]);
      play('no');
      report({ correct: false, speak: option.label });
    }
  };

  const handleDrop = (option: GameItem, pageX: number, pageY: number) => {
    const rect = characterRect.current;
    const isOnCharacter =
      rect !== null &&
      pageX >= rect.x &&
      pageX <= rect.x + rect.width &&
      pageY >= rect.y &&
      pageY <= rect.y + rect.height;
    if (isOnCharacter) feed(option);
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
          <CharacterSprite
            item={question.character}
            clip={clip.name}
            playId={clip.id}
            size={characterSize}
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
                onDragStart={measureCharacter}
                onDrop={(x, y) => handleDrop(option, x, y)}
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
    </View>
  );
};

const styles = StyleSheet.create({
  // Anchored to the top, so the cat stays still when the shell's Next button appears.
  container: { flex: 1, paddingHorizontal: SIDE_PADDING, paddingTop: spacing.lg, gap: spacing.lg },
  scene: { borderRadius: borderRadius.xl, alignItems: 'center', paddingVertical: spacing.xl },
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
