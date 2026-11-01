import type { AudioSource } from 'expo-audio';
import type { ImageSourcePropType } from 'react-native';
import type { SpriteSheet } from './sprite';

// Register recorded audio and illustrations here. Content refers to them by key,
// so adding a file needs no change to a game: an item with a registered `audio` or `image`
// uses it, and anything else falls back to text-to-speech and its emoji.
//
// Expected keys when the recordings arrive:
//   sound_cow, sound_cat, sound_duck, sound_goat, sound_sheep, sound_chicken, sound_horse, sound_bird,
//   sound_frog, sound_lion, sound_elephant, sound_monkey, sound_bee, sound_snake, sound_owl
export const CLIPS: Record<string, AudioSource> = {
  sfx_correct: require('@/assets/audio/correct.wav'),
  sfx_wrong: require('@/assets/audio/try-again.wav'),
  sfx_complete: require('@/assets/audio/complete.wav'),
};

export const IMAGES: Record<string, ImageSourcePropType> = {};

// Animated characters, keyed by item id. Without an entry, the character is its emoji, animated in code.
// When the artwork exists, add one line:
//   'animal-cat': { source: require('@/assets/games/sprites/cat.webp'), sheet: CHARACTER_SHEET },
export const SPRITES: Record<string, { source: ImageSourcePropType; sheet: SpriteSheet }> = {};
