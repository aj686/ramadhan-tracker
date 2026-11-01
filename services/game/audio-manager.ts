import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import type { Lang } from '@/data/games/schema';
import { CLIPS } from './media';

// Order of preference: a recorded clip, then text-to-speech if a suitable voice exists,
// then silence. Games stay playable with no audio at all, because some devices have none.

type VoiceCheck = { status: 'yes'; language: string } | { status: 'no' } | { status: 'unknown' };

const DEFAULT_LANGUAGE: Record<Lang, string> = { ms: 'ms-MY', en: 'en-US' };

// Many Android phones have no Malay voice but do have Indonesian, which reads Malay well.
const VOICE_PREFIXES: Record<Lang, string[]> = { ms: ['ms', 'id'], en: ['en'] };

const VOICE_CHECK_TIMEOUT_MS = 1500; // getAvailableVoicesAsync can hang on some browsers
const VOICE_CHECK_ATTEMPTS = 3;
const VOICE_RETRY_DELAY_MS = 1000;
const SPEECH_TIMEOUT_MS = 15000;     // some engines never call onDone
const CLIP_TIMEOUT_MS = 12000;

const voiceChecks = new Map<Lang, Promise<VoiceCheck>>();
const players = new Map<string, AudioPlayer>();

let muted = false;
let generation = 0;
let audioModeReady = false;

const normalise = (tag: string) => tag.replace('_', '-').toLowerCase();

const withTimeout = <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> =>
  Promise.race([promise, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);

const checkVoice = (lang: Lang): Promise<VoiceCheck> => {
  const cached = voiceChecks.get(lang);
  if (cached) return cached;

  const pending = (async (): Promise<VoiceCheck> => {
    const voices = await withTimeout(Speech.getAvailableVoicesAsync(), VOICE_CHECK_TIMEOUT_MS, []);
    // An empty list usually means voices have not loaded yet, not that there are none.
    if (voices.length === 0) {
      voiceChecks.delete(lang);
      return { status: 'unknown' };
    }
    const languages = voices.map((voice) => voice.language);
    const exact = languages.find((tag) => normalise(tag) === normalise(DEFAULT_LANGUAGE[lang]));
    if (exact) return { status: 'yes', language: exact };
    for (const prefix of VOICE_PREFIXES[lang]) {
      const match = languages.find((tag) => normalise(tag).startsWith(prefix));
      if (match) return { status: 'yes', language: match };
    }
    return { status: 'no' };
  })().catch((): VoiceCheck => {
    voiceChecks.delete(lang);
    return { status: 'unknown' };
  });

  voiceChecks.set(lang, pending);
  return pending;
};

const playerFor = (key: string): AudioPlayer | null => {
  const source = CLIPS[key];
  if (!source) return null;
  const existing = players.get(key);
  if (existing) return existing;
  const player = createAudioPlayer(source);
  players.set(key, player);
  return player;
};

const prepareAudioMode = () => {
  if (audioModeReady) return;
  audioModeReady = true;
  setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
};

const playClip = async (key: string): Promise<boolean> => {
  try {
    const player = playerFor(key);
    if (!player) return false;
    prepareAudioMode();
    await player.seekTo(0);
    player.play();
    await withTimeout(
      new Promise<void>((resolve) => {
        const subscription = player.addListener('playbackStatusUpdate', (status) => {
          if (status.didJustFinish) {
            subscription.remove();
            resolve();
          }
        });
      }),
      CLIP_TIMEOUT_MS,
      undefined,
    );
    return true;
  } catch {
    return false;
  }
};

const speak = async (text: string, lang: Lang, token: number, rate: number): Promise<void> => {
  const voice = await checkVoice(lang);
  if (voice.status === 'no' || token !== generation || muted) return;
  const language = voice.status === 'yes' ? voice.language : DEFAULT_LANGUAGE[lang];

  await withTimeout(
    new Promise<void>((resolve) => {
      try {
        Speech.speak(text, {
          language,
          rate,
          onDone: () => resolve(),
          onError: () => resolve(),
          onStopped: () => resolve(),
        });
      } catch {
        resolve();
      }
    }),
    SPEECH_TIMEOUT_MS,
    undefined,
  );
};

const stopAll = () => {
  generation++;
  try {
    Promise.resolve(Speech.stop()).catch(() => {});
  } catch {
    // no speech engine on this device
  }
  players.forEach((player, key) => {
    if (key.startsWith('sfx_')) return;
    try {
      player.pause();
    } catch {
      // nothing playing
    }
  });
};

export const audioManager = {
  setMuted(value: boolean) {
    muted = value;
    if (value) stopAll();
  },

  // False when no voice suits this language. The Listen button then hides rather than doing
  // nothing, and listening games show the word. Voices can load late, so an empty list is
  // checked again before it counts as none.
  async canSpeak(lang: Lang): Promise<boolean> {
    try {
      for (let attempt = 0; attempt < VOICE_CHECK_ATTEMPTS; attempt++) {
        const voice = await checkVoice(lang);
        if (voice.status !== 'unknown') return voice.status === 'yes';
        await new Promise((resolve) => setTimeout(resolve, VOICE_RETRY_DELAY_MS));
      }
      return false;
    } catch {
      return false;
    }
  },

  // Interrupts whatever is playing, so a new prompt never queues behind an old one.
  async say(text: string, lang: Lang, options: { clip?: string; rate?: number } = {}) {
    stopAll();
    const token = generation;
    if (muted) return;
    if (options.clip && (await playClip(options.clip))) return;
    if (token !== generation) return;
    await speak(text, lang, token, options.rate ?? 0.85);
  },

  // Short feedback sounds play over speech rather than cutting it off.
  sfx(key: 'sfx_correct' | 'sfx_wrong' | 'sfx_complete') {
    if (muted) return;
    playClip(key).catch(() => {});
  },

  stop: stopAll,
};
