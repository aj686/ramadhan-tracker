// Pure rules for how an animated character moves. No graphics here, so it can be tested on its own.

export type CharacterClip = 'idle' | 'eat' | 'no' | 'happy';

export interface CharacterPose {
  lift: number;      // height off the ground
  squash: number;    // 1 at rest, above 1 is wider and shorter
  headYaw: number;   // radians, positive turns towards the right of the screen
  headPitch: number; // radians, positive tips the nose down
  headRoll: number;  // radians
  jaw: number;       // 0 closed, 1 wide open
  ears: number;      // 0 at rest, 1 drooped, -1 perked up
  tail: number;      // -1 to 1
  blink: number;     // 0 open, 1 closed
}

const TAU = Math.PI * 2;

const NEUTRAL: CharacterPose = {
  lift: 0,
  squash: 1,
  headYaw: 0,
  headPitch: 0,
  headRoll: 0,
  jaw: 0,
  ears: 0,
  tail: 0,
  blink: 0,
};

// Idle loops over its length. The others play once.
export const CLIP_MS: Record<CharacterClip, number> = { idle: 3200, eat: 1000, no: 800, happy: 900 };

export const clipFinished = (clip: CharacterClip, elapsedMs: number): boolean =>
  clip !== 'idle' && elapsedMs >= CLIP_MS[clip];

// What a character does once a clip ends: eating leads to joy, and everything settles back to idle.
export const nextClip = (clip: CharacterClip): CharacterClip => (clip === 'eat' ? 'happy' : 'idle');

const blinkAt = (progress: number) => {
  const distance = Math.abs(progress - 0.5) / 0.04;
  return distance < 1 ? 1 - distance : 0;
};

export const poseAt = (clip: CharacterClip, elapsedMs: number): CharacterPose => {
  const time = Math.max(0, elapsedMs) / CLIP_MS[clip];

  if (clip === 'idle') {
    const p = time % 1;
    return {
      ...NEUTRAL,
      squash: 1 + 0.012 * Math.sin(TAU * 2 * p),
      headRoll: 0.035 * Math.sin(TAU * p),
      tail: Math.sin(TAU * p),
      blink: blinkAt(p),
    };
  }

  const p = Math.min(1, time);
  // Zero at both ends, so every one-shot clip starts and ends on the neutral pose, with no jump.
  const swell = Math.sin(Math.PI * p);

  switch (clip) {
    case 'eat':
      return {
        ...NEUTRAL,
        jaw: swell * Math.abs(Math.sin(Math.PI * 3 * p)),
        squash: 1 + 0.05 * swell * Math.sin(Math.PI * 6 * p),
        headPitch: 0.1 * swell,
      };
    case 'no':
      return {
        ...NEUTRAL,
        headYaw: 0.5 * swell * Math.sin(Math.PI * 4 * p),
        ears: swell,
      };
    case 'happy':
      return {
        ...NEUTRAL,
        lift: 0.6 * Math.abs(Math.sin(TAU * p)) * (1 - 0.35 * p),
        squash: 1 + 0.08 * swell * Math.cos(Math.PI * 4 * p),
        ears: -swell,
        blink: Math.min(1, swell * 2),
        tail: swell * Math.sin(Math.PI * 6 * p),
      };
  }
};
