import React, { useEffect, useRef, useState } from 'react';
import { PanResponder, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface TouchCanvasProps {
  size: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  label: string;
  // Finger position on the 100 x 100 content box. `isStart` is true for the first touch only.
  onTouch: (point: { x: number; y: number }, isStart: boolean) => void;
}

// A drawing surface. `pointerEvents: box-only` makes the canvas itself the touch target,
// so locationX and locationY are always relative to it, on Android and on web.
// On web, `userSelect: none` matters: dragging over text selects it, and a selection
// makes react-native-web cancel the gesture part-way through.
export const TouchCanvas: React.FC<TouchCanvasProps> = ({ size, children, style, label, onTouch }) => {
  const latest = useRef({ onTouch, size });

  useEffect(() => {
    latest.current = { onTouch, size };
  });

  const [responder] = useState(() => {
    const emit = (locationX: number, locationY: number, isStart: boolean) => {
      const { onTouch: handler, size: currentSize } = latest.current;
      handler({ x: (locationX / currentSize) * 100, y: (locationY / currentSize) * 100 }, isStart);
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => emit(event.nativeEvent.locationX, event.nativeEvent.locationY, true),
      onPanResponderMove: (event) => emit(event.nativeEvent.locationX, event.nativeEvent.locationY, false),
    });
  });

  return (
    <View
      {...responder.panHandlers}
      accessibilityLabel={label}
      style={[styles.canvas, { width: size, height: size }, style]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  canvas: { pointerEvents: 'box-only', touchAction: 'none', userSelect: 'none' },
});
