import React from 'react';
import { View } from 'react-native';
import { Point, segmentStyle } from '@/services/game/geometry';

interface LineSegmentProps {
  from: Point;
  to: Point;
  scale: number;
  thickness: number;
  color: string;
}

// `from` and `to` are in the 100 x 100 content box. `scale` converts to screen points.
export const LineSegment: React.FC<LineSegmentProps> = ({ from, to, scale, thickness, color }) => {
  const a = { x: from.x * scale, y: from.y * scale };
  const b = { x: to.x * scale, y: to.y * scale };
  const { left, top, width, height, angleDeg } = segmentStyle(a, b, thickness);

  return (
    <View
      style={{
        position: 'absolute',
        left,
        top,
        // Slightly longer than the gap, so joints at a corner have no visible break.
        width: width + thickness * 0.4,
        marginLeft: -thickness * 0.2,
        height,
        borderRadius: thickness / 2,
        backgroundColor: color,
        transform: [{ rotate: `${angleDeg}deg` }],
      }}
    />
  );
};
