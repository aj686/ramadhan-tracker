// Pure rules for playing a pre-rendered sprite sheet: one image holding every frame in a grid.
// A sheet needs no native module and no 3D at runtime, so it ships over the air and stays light.

export type CharacterClip = 'idle' | 'eat' | 'no' | 'happy';

export interface SpriteClip {
  start: number; // index of the first frame in the sheet, counted left to right, top to bottom
  frames: number;
  loop: boolean;
}

export interface SpriteSheet {
  columns: number;
  rows: number;
  fps: number;
  clips: Record<CharacterClip, SpriteClip>;
}

// Must match how the artwork is rendered: 30 frames of 256 x 256, in 6 columns and 5 rows.
export const CHARACTER_SHEET: SpriteSheet = {
  columns: 6,
  rows: 5,
  fps: 12,
  clips: {
    idle: { start: 0, frames: 8, loop: true },
    eat: { start: 8, frames: 8, loop: false },
    no: { start: 16, frames: 6, loop: false },
    happy: { start: 22, frames: 8, loop: false },
  },
};

export const frameAt = (elapsedMs: number, clip: SpriteClip, fps: number): number => {
  const step = Math.floor((Math.max(0, elapsedMs) * fps) / 1000);
  const offset = clip.loop ? step % clip.frames : Math.min(step, clip.frames - 1);
  return clip.start + offset;
};

export const clipFinished = (elapsedMs: number, clip: SpriteClip, fps: number): boolean =>
  !clip.loop && (elapsedMs * fps) / 1000 >= clip.frames;

export const framePosition = (frame: number, sheet: SpriteSheet): { column: number; row: number } => ({
  column: frame % sheet.columns,
  row: Math.floor(frame / sheet.columns),
});

// What a character does once a clip ends: eating leads to joy, and everything settles back to idle.
export const nextClip = (clip: CharacterClip): CharacterClip => (clip === 'eat' ? 'happy' : 'idle');
