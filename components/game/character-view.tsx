import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import type { GameItem } from '@/data/games/schema';
import { type CharacterClip, nextClip } from '@/services/game/character-motion';
import { buildCat, type BuildCharacter } from './cat-model';
import { Character3D, type LookTarget } from './character-3d';
import { ItemVisual } from './item-visual';
import { NATIVE_DRIVER } from './types';

// Characters with a 3D model, by item id. Anything else is its emoji, animated in code.
const MODELS: Record<string, BuildCharacter> = { 'animal-cat': buildCat };

interface CharacterViewProps {
  item: GameItem;
  clip: CharacterClip;
  // Changes on every request, so the same clip can play twice in a row.
  playId: number;
  size: number;
  lookTarget: React.RefObject<LookTarget | null>;
  onClipChange: (clip: CharacterClip) => void;
}

// Shows the emoji at once, then swaps to 3D when its first frame has drawn.
// If 3D can't run, the emoji simply stays, so the game always works.
export const CharacterView: React.FC<CharacterViewProps> = ({
  item,
  clip,
  playId,
  size,
  lookTarget,
  onClipChange,
}) => {
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const build = MODELS[item.id];

  return (
    <View style={{ width: size, height: size }}>
      {status !== 'ready' && (
        <EmojiPlayer item={item} clip={clip} playId={playId} size={size} onClipChange={onClipChange} />
      )}
      {build && status !== 'failed' && (
        <View style={[styles.layer, { opacity: status === 'ready' ? 1 : 0 }]}>
          <ThreeDBoundary onFail={() => setStatus('failed')}>
            <Character3D
              build={build}
              clip={clip}
              playId={playId}
              size={size}
              lookTarget={lookTarget}
              onClipChange={onClipChange}
              onReady={() => setStatus('ready')}
              onFail={() => setStatus('failed')}
            />
          </ThreeDBoundary>
        </View>
      )}
    </View>
  );
};

// expo-gl throws while mounting when a browser has no WebGL.
class ThreeDBoundary extends React.Component<{ onFail: () => void; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFail();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

type EmojiPlayerProps = Pick<CharacterViewProps, 'item' | 'clip' | 'playId' | 'size' | 'onClipChange'>;

const EmojiPlayer: React.FC<EmojiPlayerProps> = ({ item, clip, playId, size, onClipChange }) => {
  const [lift] = useState(() => new Animated.Value(0));
  const [tilt] = useState(() => new Animated.Value(0));
  const [squash] = useState(() => new Animated.Value(1));
  const onChange = useRef(onClipChange);

  useEffect(() => {
    onChange.current = onClipChange;
  });

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
  }, [clip, playId, lift, tilt, squash]);

  const translateY = Animated.multiply(lift, size);
  const rotate = tilt.interpolate({ inputRange: [-1, 1], outputRange: ['-13deg', '13deg'] });

  return (
    <Animated.View style={{ width: size, height: size, transform: [{ translateY }, { rotate }, { scale: squash }] }}>
      <ItemVisual item={item} size={size} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFillObject, pointerEvents: 'none' },
});
