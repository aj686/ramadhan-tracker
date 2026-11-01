import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, View } from 'react-native';
import type { GameItem } from '@/data/games/schema';
import { SPRITES } from '@/services/game/media';
import { type CharacterClip, clipFinished, frameAt, framePosition, nextClip } from '@/services/game/sprite';
import { ItemVisual } from './item-visual';
import { NATIVE_DRIVER } from './types';

interface CharacterSpriteProps {
  item: GameItem;
  clip: CharacterClip;
  // Changes on every request, so the same clip can play twice in a row.
  playId: number;
  size: number;
  onClipChange: (clip: CharacterClip) => void;
}

// Plays the character's sprite sheet when one is registered, otherwise animates its emoji,
// so the game looks alive before any artwork exists.
export const CharacterSprite: React.FC<CharacterSpriteProps> = ({ item, ...props }) => {
  const sprite = SPRITES[item.id];
  return sprite ? (
    <SheetPlayer sprite={sprite} {...props} />
  ) : (
    <EmojiPlayer item={item} {...props} />
  );
};

type PlayerProps = Omit<CharacterSpriteProps, 'item'>;

const useLatest = <T,>(value: T) => {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
};

const SheetPlayer: React.FC<PlayerProps & { sprite: (typeof SPRITES)[string] }> = ({
  sprite,
  clip,
  playId,
  size,
  onClipChange,
}) => {
  const { source, sheet } = sprite;
  const [frame, setFrame] = useState(sheet.clips[clip].start);
  const onChange = useLatest(onClipChange);

  useEffect(() => {
    const definition = sheet.clips[clip];
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      if (clipFinished(elapsed, definition, sheet.fps)) {
        clearInterval(timer);
        onChange.current(nextClip(clip));
      } else {
        setFrame(frameAt(elapsed, definition, sheet.fps));
      }
    }, 1000 / sheet.fps);
    return () => clearInterval(timer);
  }, [clip, playId, sheet, onChange]);

  const { column, row } = framePosition(frame, sheet);

  return (
    <View style={{ width: size, height: size, overflow: 'hidden' }}>
      <Image
        source={source}
        style={{
          position: 'absolute',
          width: size * sheet.columns,
          height: size * sheet.rows,
          left: -column * size,
          top: -row * size,
        }}
      />
    </View>
  );
};

const EmojiPlayer: React.FC<PlayerProps & { item: GameItem }> = ({ item, clip, playId, size, onClipChange }) => {
  const [lift] = useState(() => new Animated.Value(0));
  const [tilt] = useState(() => new Animated.Value(0));
  const [squash] = useState(() => new Animated.Value(1));
  const onChange = useLatest(onClipChange);

  useEffect(() => {
    // A clip can interrupt another part-way, so each one starts from the neutral pose.
    lift.setValue(0);
    tilt.setValue(0);
    squash.setValue(1);

    const timing = (value: Animated.Value, toValue: number, duration: number) =>
      Animated.timing(value, { toValue, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: NATIVE_DRIVER });

    const clips: Record<CharacterClip, Animated.CompositeAnimation> = {
      idle: Animated.loop(
        Animated.sequence([
          Animated.parallel([timing(lift, -0.03, 800), timing(squash, 1.03, 800)]),
          Animated.parallel([timing(lift, 0, 800), timing(squash, 1, 800)]),
        ]),
      ),
      eat: Animated.sequence([
        timing(squash, 1.14, 130),
        timing(squash, 0.94, 130),
        timing(squash, 1.08, 110),
        timing(squash, 0.97, 110),
        timing(squash, 1, 100),
      ]),
      no: Animated.sequence([
        timing(tilt, 1, 90),
        timing(tilt, -1, 150),
        timing(tilt, 1, 150),
        timing(tilt, -1, 150),
        timing(tilt, 0, 90),
      ]),
      happy: Animated.sequence([
        timing(lift, -0.24, 180),
        timing(lift, 0, 170),
        timing(lift, -0.13, 130),
        timing(lift, 0, 120),
      ]),
    };

    const animation = clips[clip];
    animation.start(({ finished }) => {
      if (finished && clip !== 'idle') onChange.current(nextClip(clip));
    });
    return () => animation.stop();
  }, [clip, playId, lift, tilt, squash, onChange]);

  const translateY = Animated.multiply(lift, size);
  const rotate = tilt.interpolate({ inputRange: [-1, 1], outputRange: ['-13deg', '13deg'] });

  return (
    <Animated.View
      style={{ width: size, height: size, transform: [{ translateY }, { rotate }, { scale: squash }] }}
    >
      <ItemVisual item={item} size={size} />
    </Animated.View>
  );
};
