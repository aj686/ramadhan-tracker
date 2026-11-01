import React, { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, StyleProp, ViewStyle } from 'react-native';

const TAP_DISTANCE = 8;

interface DraggableProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  label: string;
  disabled?: boolean;
  onDragStart?: () => void;
  // Screen coordinates of the finger, on every move. Keep this cheap: it must not cause a render.
  onDragMove?: (pageX: number, pageY: number) => void;
  onDragEnd?: () => void;
  // Screen coordinates of the release point.
  onDrop: (pageX: number, pageY: number) => void;
  onTap: () => void;
}

// Built on PanResponder, so it works on Android and web with no native gesture library.
// A tap is also accepted: tap a piece, then tap where it goes.
export const Draggable: React.FC<DraggableProps> = ({
  children,
  style,
  label,
  disabled = false,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDrop,
  onTap,
}) => {
  const [pan] = useState(() => new Animated.ValueXY());
  const [isDragging, setIsDragging] = useState(false);
  const latest = useRef({ onDragStart, onDragMove, onDragEnd, onDrop, onTap, disabled });

  useEffect(() => {
    latest.current = { onDragStart, onDragMove, onDragEnd, onDrop, onTap, disabled };
  });

  const [responder] = useState(() => {
    const returnHome = () => {
      Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false, speed: 24 }).start();
    };

    const followFinger = Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false });

    return PanResponder.create({
      onStartShouldSetPanResponder: () => !latest.current.disabled,
      onMoveShouldSetPanResponder: () => !latest.current.disabled,
      onPanResponderGrant: () => {
        setIsDragging(true);
        latest.current.onDragStart?.();
      },
      onPanResponderMove: (event, gesture) => {
        followFinger(event, gesture);
        latest.current.onDragMove?.(gesture.moveX, gesture.moveY);
      },
      onPanResponderRelease: (_, gesture) => {
        setIsDragging(false);
        latest.current.onDragEnd?.();
        if (Math.hypot(gesture.dx, gesture.dy) < TAP_DISTANCE) {
          pan.setValue({ x: 0, y: 0 });
          latest.current.onTap();
        } else {
          latest.current.onDrop(gesture.moveX, gesture.moveY);
          returnHome();
        }
      },
      onPanResponderTerminate: () => {
        setIsDragging(false);
        latest.current.onDragEnd?.();
        returnHome();
      },
    });
  });

  return (
    <Animated.View
      {...responder.panHandlers}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        style,
        // userSelect: a text selection on web would cancel the drag part-way through.
        { touchAction: 'none', userSelect: 'none', transform: pan.getTranslateTransform(), zIndex: isDragging ? 50 : 1 },
        isDragging && { elevation: 8 },
      ]}
    >
      {children}
    </Animated.View>
  );
};
