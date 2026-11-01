import { DOT_FIGURES, PUZZLE_SCENES } from '../../data/games/figures';
import { COLOURS, FIND_PREFIX, LETTERS, POOLS, RELATED_PAIRS, SHAPES, TRACE_WORDS } from '../../data/games/items';
import type {
  Activity,
  ChoiceQuestion,
  ContentSpec,
  FeedQuestion,
  GameItem,
  Lang,
  LocalText,
  MatchPair,
  PoolId,
  Question,
} from '../../data/games/schema';
import { createRng, type Rng, shuffle } from './random';

const text = (ms: string, en: string): LocalText => ({ ms, en });

// Only plain single words can be spelled letter by letter, in the language being played.
const spellable = (item: GameItem, lang: Lang, maxLength: number): boolean =>
  /^[a-zA-Z]+$/.test(item.label[lang]) && item.label[lang].length >= 3 && item.label[lang].length <= maxLength;

// Repeats the shuffled pool if an activity has more rounds than items.
const takeRounds = <T>(pool: readonly T[], rounds: number, rng: Rng): T[] => {
  const picked: T[] = [];
  let bag: T[] = [];
  while (picked.length < rounds && pool.length > 0) {
    if (bag.length === 0) bag = shuffle(pool, rng);
    picked.push(bag.pop() as T);
  }
  return picked;
};

const optionsFor = (answer: GameItem, pool: readonly GameItem[], count: number, rng: Rng): GameItem[] => {
  const distractors = shuffle(pool.filter((item) => item.id !== answer.id), rng).slice(0, count - 1);
  return shuffle([answer, ...distractors], rng);
};

const poolFor = (pools: PoolId[]) =>
  pools.flatMap((pool) => POOLS[pool].map((item) => ({ item, pool })));

const missingLetterQuestion = (
  id: string,
  item: GameItem,
  lang: Lang,
  optionCount: number,
  rng: Rng,
): ChoiceQuestion => {
  const word = item.label[lang].toUpperCase();
  const blank = Math.floor(rng() * word.length);
  const letter = word[blank];
  const answer = LETTERS.find((l) => l.glyph === letter) as GameItem;
  return {
    kind: 'choice',
    id,
    prompt: text('Huruf apa yang hilang?', 'Which letter is missing?'),
    say: { ms: item.label.ms, en: item.label.en },
    options: optionsFor(answer, LETTERS, optionCount, rng),
    answerId: answer.id,
    showLabels: false,
    listenOnly: false,
    scene: item,
    wordMask: `${word.slice(0, blank)}_${word.slice(blank + 1)}`,
    revealWord: word,
  };
};

const buildPick = (
  activity: Activity,
  spec: Extract<ContentSpec, { type: 'pick' }>,
  lang: Lang,
  rng: Rng,
): Question[] => {
  const spellingRounds = spec.spellingRounds ?? 0;
  const pickRounds = spec.rounds - spellingRounds;
  const entries = poolFor(spec.pools);
  const picked = takeRounds(entries, pickRounds, rng);

  const questions: Question[] = picked.map(({ item, pool }, round) => {
    const siblings = POOLS[pool];
    const optionCount = spec.optionCounts[Math.min(round, spec.optionCounts.length - 1)];
    const id = `${activity.id}-${round}`;
    const showLabels = spec.hideLabelsFromRound === undefined || round < spec.hideLabelsFromRound;

    if (spec.style === 'sound' && item.sound) {
      const sound = item.sound;
      return {
        kind: 'choice',
        id,
        prompt: text(`Haiwan mana berbunyi “${sound.ms}”?`, `Which animal says “${sound.en}”?`),
        say: sound,
        audio: item.audio,
        options: optionsFor(item, siblings, optionCount, rng),
        answerId: item.id,
        showLabels,
        listenOnly: false,
      };
    }

    if (spec.style === 'listen') {
      return {
        kind: 'choice',
        id,
        prompt: text('Dengar baik-baik. Mana satu?', 'Listen carefully. Which one?'),
        say: item.label,
        options: optionsFor(item, siblings, optionCount, rng),
        answerId: item.id,
        showLabels: false,
        listenOnly: true,
      };
    }

    const prefix = FIND_PREFIX[pool];
    return {
      kind: 'choice',
      id,
      prompt: text(`Cari ${prefix.ms}${item.label.ms}`, `Find ${prefix.en}${item.label.en}`),
      say: text(`Cari ${prefix.ms}${item.label.ms}`, `Find ${prefix.en}${item.label.en}`),
      options: optionsFor(item, siblings, optionCount, rng),
      answerId: item.id,
      showLabels,
      listenOnly: false,
    };
  });

  if (spellingRounds > 0) {
    const words = poolFor(spec.pools).map((entry) => entry.item).filter((item) => spellable(item, lang, 8));
    takeRounds(words, spellingRounds, rng).forEach((item, i) => {
      questions.push(missingLetterQuestion(`${activity.id}-spell-${i}`, item, lang, 4, rng));
    });
  }

  return questions;
};

const buildMatch = (
  activity: Activity,
  spec: Extract<ContentSpec, { type: 'match' }>,
  rng: Rng,
): Question[] => {
  const pairsFor = (round: number): MatchPair[] => {
    if (spec.set === 'letter_case') {
      return shuffle(LETTERS, rng).slice(0, spec.pairCount).map((letter) => ({
        id: `${letter.id}-${round}`,
        left: letter,
        right: { ...letter, id: `${letter.id}-small`, glyph: letter.glyph?.toLowerCase() },
        rightSilhouette: false,
      }));
    }
    if (spec.set === 'shape_silhouette') {
      return shuffle(SHAPES, rng).slice(0, spec.pairCount).map((shape) => ({
        id: `${shape.id}-${round}`,
        left: shape,
        right: { ...shape, id: `${shape.id}-shadow` },
        rightSilhouette: true,
      }));
    }
    return shuffle(RELATED_PAIRS, rng).slice(0, spec.pairCount).map(([left, right]) => ({
      id: `${left.id}-${round}`,
      left,
      right,
      rightSilhouette: false,
    }));
  };

  return Array.from({ length: spec.rounds }, (_, round) => {
    const pairs = pairsFor(round);
    const prompt =
      spec.set === 'letter_case' ? text('Padankan huruf besar dan kecil', 'Match the big and small letters')
      : spec.set === 'shape_silhouette' ? text('Padankan bentuk dengan bayang-bayangnya', 'Match each shape to its shadow')
      : text('Padankan yang berkaitan', 'Match the ones that go together');
    return {
      kind: 'match' as const,
      id: `${activity.id}-${round}`,
      prompt,
      say: prompt,
      pairs,
      rightOrder: shuffle(pairs.map((pair) => pair.id), rng),
    };
  });
};

const buildSort = (activity: Activity, spec: Extract<ContentSpec, { type: 'sort' }>, rng: Rng): Question[] => {
  const usable = COLOURS.filter((colour) => colour.id !== 'colour-white');
  return Array.from({ length: spec.rounds }, (_, round) => {
    const bins = shuffle(usable, rng).slice(0, spec.binCount);
    const tokens = shuffle(
      Array.from({ length: spec.tokenCount }, (_, i) => {
        const bin = bins[i % bins.length];
        return { id: `token-${round}-${i}`, item: bin, binId: bin.id };
      }),
      rng,
    );
    const prompt = text('Seret bola ke bakul warna yang sama', 'Drag each ball to the matching basket');
    return { kind: 'sort' as const, id: `${activity.id}-${round}`, prompt, say: prompt, bins, tokens };
  });
};

const buildArrange = (
  activity: Activity,
  spec: Extract<ContentSpec, { type: 'arrange' }>,
  lang: Lang,
  rng: Rng,
): Question[] => {
  const words = poolFor(spec.pools).map((entry) => entry.item).filter((item) => spellable(item, lang, spec.maxLength));
  // Shorter words first, so difficulty rises through the game.
  const picked = takeRounds(words, spec.rounds, rng).sort((a, b) => a.label[lang].length - b.label[lang].length);
  return picked.map((item, round) => {
    const word = item.label[lang].toUpperCase();
    const letters = word.split('').map((letter, i) => ({ id: `${round}-${i}`, letter }));
    let scrambled = shuffle(letters, rng);
    // A scramble that already spells the word would solve itself. Words with repeated letters
    // shuffle back often (BEE has only 3 orders), so rotate rather than reshuffle and hope.
    for (let i = 0; i < word.length && scrambled.map((l) => l.letter).join('') === word; i++) {
      scrambled = [...scrambled.slice(1), scrambled[0]];
    }
    return {
      kind: 'arrange' as const,
      id: `${activity.id}-${round}`,
      prompt: text('Susun huruf menjadi perkataan', 'Put the letters in order'),
      say: item.label,
      item,
      word,
      letters: scrambled,
    };
  });
};

const buildPuzzle = (activity: Activity, spec: Extract<ContentSpec, { type: 'puzzle' }>, rng: Rng): Question[] => {
  const scenes = takeRounds(PUZZLE_SCENES, spec.grids.length, rng);
  return spec.grids.map((grid, round) => {
    const scene = scenes[round];
    const count = grid.cols * grid.rows;
    const prompt = text('Lengkapkan gambar', 'Complete the picture');
    return {
      kind: 'puzzle' as const,
      id: `${activity.id}-${round}`,
      prompt,
      say: prompt,
      sceneId: scene.id,
      cols: grid.cols,
      rows: grid.rows,
      pieceOrder: shuffle(Array.from({ length: count }, (_, i) => i), rng),
    };
  });
};

const buildTrace = (activity: Activity, spec: Extract<ContentSpec, { type: 'trace' }>, lang: Lang, rng: Rng): Question[] =>
  takeRounds(TRACE_WORDS[lang], spec.rounds, rng).map(({ word, item }, round) => ({
    kind: 'trace' as const,
    id: `${activity.id}-${round}`,
    prompt: text(`Surih perkataan ${item.label.ms}`, `Trace the word ${item.label.en}`),
    say: item.label,
    word,
    item,
  }));

const buildDots = (activity: Activity, spec: Extract<ContentSpec, { type: 'dots' }>): Question[] =>
  spec.figures.map((figureId, round) => {
    const prompt = text('Sambung titik mengikut nombor', 'Connect the dots in order');
    if (!DOT_FIGURES[figureId]) throw new Error(`Unknown figure ${figureId}`);
    return { kind: 'dots' as const, id: `${activity.id}-${round}`, prompt, say: prompt, figureId };
  });

const buildFill = (activity: Activity, spec: Extract<ContentSpec, { type: 'fill' }>, rng: Rng): Question[] => {
  const usable = COLOURS.filter((colour) => colour.id !== 'colour-white' && colour.id !== 'colour-black');
  return takeRounds(LETTERS, spec.rounds, rng).map((letter, round) => {
    const prompt = text(`Warnakan huruf ${letter.glyph}`, `Colour the letter ${letter.glyph}`);
    return {
      kind: 'fill' as const,
      id: `${activity.id}-${round}`,
      prompt,
      say: prompt,
      letter: letter.glyph as string,
      palette: shuffle(usable, rng).slice(0, spec.paletteSize),
    };
  });
};

const buildFeed = (
  activity: Activity,
  spec: Extract<ContentSpec, { type: 'feed' }>,
  rng: Rng,
): FeedQuestion[] => {
  const character = POOLS.animals.find((item) => item.id === spec.characterId);
  if (!character) throw new Error(`Unknown character ${spec.characterId}`);

  const pool = poolFor(spec.pools);
  const items = pool.map((entry) => entry.item);
  const { ms: name, en: nameEn } = character.label;

  return takeRounds(pool, spec.rounds, rng).map(({ item, pool: poolId }, round) => {
    const prefix = FIND_PREFIX[poolId];
    const wants = text(
      `${name.charAt(0).toUpperCase()}${name.slice(1)} mahu ${prefix.ms}${item.label.ms}`,
      `The ${nameEn} wants ${prefix.en}${item.label.en}`,
    );
    const optionCount = spec.optionCounts[Math.min(round, spec.optionCounts.length - 1)];
    return {
      kind: 'feed',
      id: `${activity.id}-${round}`,
      prompt: wants,
      say: wants,
      character,
      options: optionsFor(item, items, optionCount, rng),
      answerId: item.id,
    };
  });
};

export const buildQuestions = (activity: Activity, lang: Lang, seed: number): Question[] => {
  const rng = createRng(seed);
  const spec = activity.spec;

  switch (spec.type) {
    case 'pick':
      return buildPick(activity, spec, lang, rng);
    case 'missing': {
      const words = poolFor(spec.pools).map((entry) => entry.item).filter((item) => spellable(item, lang, spec.maxLength));
      return takeRounds(words, spec.rounds, rng).map((item, round) =>
        missingLetterQuestion(`${activity.id}-${round}`, item, lang, spec.optionCount, rng),
      );
    }
    case 'match':
      return buildMatch(activity, spec, rng);
    case 'sort':
      return buildSort(activity, spec, rng);
    case 'arrange':
      return buildArrange(activity, spec, lang, rng);
    case 'puzzle':
      return buildPuzzle(activity, spec, rng);
    case 'trace':
      return buildTrace(activity, spec, lang, rng);
    case 'dots':
      return buildDots(activity, spec);
    case 'fill':
      return buildFill(activity, spec, rng);
    case 'feed':
      return buildFeed(activity, spec, rng);
  }
};

// Round count without building, so the session can be created before a language is known.
export const roundCount = (spec: ContentSpec): number => {
  switch (spec.type) {
    case 'puzzle':
      return spec.grids.length;
    case 'dots':
      return spec.figures.length;
    default:
      return spec.rounds;
  }
};
