import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ACTIVITIES, JOURNEYS_BY_AGE } from '../data/games/activities';
import { DOT_FIGURES, PUZZLE_SCENES } from '../data/games/figures';
import { LETTER_STROKES } from '../data/games/letter-strokes';
import type { Lang } from '../data/games/schema';
import { advanceCheckpoint, samplePolyline, segmentStyle } from '../services/game/geometry';
import { applySessionResult, pickNextActivity, summarizeProgress } from '../services/game/progress';
import { buildQuestions, roundCount } from '../services/game/question-builder';
import { createSession, sessionReducer, type SessionState, starsFor } from '../services/game/session';
import * as THREE from 'three';
import { buildCat } from '../components/game/cat-model';
import { type CharacterClip, CLIP_MS, clipFinished, nextClip, poseAt } from '../services/game/character-motion';

const LANGS: Lang[] = ['ms', 'en'];
const SEEDS = [1, 7, 42, 12345, 987654];

const play = (state: SessionState, ...actions: Parameters<typeof sessionReducer>[1][]) =>
  actions.reduce(sessionReducer, state);

describe('character motion', () => {
  const ONE_SHOTS: CharacterClip[] = ['eat', 'no', 'happy'];
  const samePose = (a: ReturnType<typeof poseAt>, b: ReturnType<typeof poseAt>, label: string) => {
    for (const key of Object.keys(a) as (keyof typeof a)[]) {
      assert.ok(Math.abs(a[key] - b[key]) < 1e-9, `${label}: ${key} ${a[key]} vs ${b[key]}`);
    }
  };

  it('joins the idle loop with no jump, and never finishes it', () => {
    samePose(poseAt('idle', 0), poseAt('idle', CLIP_MS.idle), 'idle loop');
    assert.equal(clipFinished('idle', 1_000_000), false);
  });

  for (const clip of ONE_SHOTS) {
    it(`${clip} starts and ends where idle begins, so nothing jumps`, () => {
      samePose(poseAt(clip, 0), poseAt('idle', 0), `${clip} start`);
      samePose(poseAt(clip, CLIP_MS[clip]), poseAt('idle', 0), `${clip} end`);
      samePose(poseAt(clip, CLIP_MS[clip] * 5), poseAt('idle', 0), `${clip} after the end`);
    });

    it(`${clip} moves part-way through, and stays in range`, () => {
      const moves = new Set<number>();
      for (let ms = 0; ms <= CLIP_MS[clip]; ms += 20) {
        const pose = poseAt(clip, ms);
        moves.add(pose.jaw + pose.lift + pose.headYaw + pose.ears);
        assert.ok(pose.jaw >= 0 && pose.jaw <= 1, 'jaw');
        assert.ok(pose.blink >= 0 && pose.blink <= 1, 'blink');
        assert.ok(pose.lift >= 0 && pose.lift <= 0.7, 'lift');
        assert.ok(pose.squash > 0.8 && pose.squash < 1.2, 'squash');
      }
      assert.ok(moves.size > 5, 'the pose changes');
    });
  }

  it('finishes a one-shot clip at its length', () => {
    assert.equal(clipFinished('no', CLIP_MS.no - 1), false);
    assert.equal(clipFinished('no', CLIP_MS.no), true);
  });

  it('goes from eating to joy, and settles back to idle', () => {
    assert.equal(nextClip('eat'), 'happy');
    assert.equal(nextClip('happy'), 'idle');
    assert.equal(nextClip('no'), 'idle');
  });
});

describe('3D cat', () => {
  const countTriangles = (root: THREE.Object3D) => {
    let triangles = 0;
    root.traverse((node) => {
      const geometry = (node as THREE.Mesh).geometry;
      if (geometry?.index) triangles += geometry.index.count / 3;
    });
    return triangles;
  };

  it('stays under the triangle budget', () => {
    const cat = buildCat(THREE);
    const triangles = countTriangles(cat.root);
    assert.ok(triangles > 1000 && triangles < 12000, `${triangles} triangles`);
    cat.dispose();
  });

  it('applies a pose without error, and the pose moves it', () => {
    const cat = buildCat(THREE);
    const positions = () => {
      cat.root.updateMatrixWorld(true);
      return JSON.stringify(cat.root.children.map((child) => child.matrixWorld.elements));
    };
    cat.apply(poseAt('idle', 0), 0, 0);
    const before = positions();
    cat.apply(poseAt('happy', CLIP_MS.happy / 4), 0.5, -0.5);
    assert.notEqual(positions(), before);
    cat.dispose();
  });
});

describe('activity catalogue', () => {
  it('has the 26 activities from the brief plus Feed the Cat, with unique ids', () => {
    assert.equal(ACTIVITIES.length, 27);
    assert.equal(new Set(ACTIVITIES.map((a) => a.id)).size, 27);
  });

  it('splits them across the four journeys as the brief lists', () => {
    const count = (journey: string) => ACTIVITIES.filter((a) => a.journey === journey).length;
    assert.equal(count('fundamentals'), 7);
    assert.equal(count('activities'), 6);
    assert.equal(count('kembara'), 6);
    assert.equal(count('little_step'), 8);
  });

  it('places every journey under the right age group', () => {
    for (const activity of ACTIVITIES) {
      assert.ok(JOURNEYS_BY_AGE[activity.age].includes(activity.journey), activity.id);
    }
  });

  it('has a title and instructions in both languages', () => {
    for (const activity of ACTIVITIES) {
      for (const lang of LANGS) {
        assert.ok(activity.title[lang].length > 0, `${activity.id} title ${lang}`);
        assert.ok(activity.instructions[lang].length > 0, `${activity.id} instructions ${lang}`);
      }
    }
  });
});

describe('question builder', () => {
  for (const activity of ACTIVITIES) {
    for (const lang of LANGS) {
      it(`${activity.id} builds valid questions in ${lang}`, () => {
        for (const seed of SEEDS) {
          const questions = buildQuestions(activity, lang, seed);
          assert.equal(questions.length, roundCount(activity.spec), `round count, seed ${seed}`);

          questions.forEach((question) => {
            assert.ok(question.prompt[lang].length > 0, 'prompt');
            assert.ok(question.say[lang].length > 0, 'say');

            switch (question.kind) {
              case 'choice': {
                const ids = question.options.map((option) => option.id);
                assert.ok(ids.includes(question.answerId), 'the answer is an option');
                assert.equal(new Set(ids).size, ids.length, 'options are unique');
                assert.ok(ids.length >= 2, 'at least two options');
                if (question.wordMask) {
                  assert.equal(question.wordMask.split('_').length, 2, 'exactly one blank');
                  assert.equal(question.wordMask.length, question.revealWord?.length, 'mask matches word');
                }
                break;
              }
              case 'match':
                assert.ok(question.pairs.length >= 2);
                assert.deepEqual([...question.rightOrder].sort(), question.pairs.map((p) => p.id).sort());
                break;
              case 'sort':
                question.tokens.forEach((token) => {
                  assert.ok(question.bins.some((bin) => bin.id === token.binId), 'token has a bin');
                });
                break;
              case 'arrange':
                assert.equal(
                  [...question.letters].map((l) => l.letter).sort().join(''),
                  question.word.split('').sort().join(''),
                  'letters spell the word',
                );
                assert.match(question.word, /^[A-Z]+$/);
                break;
              case 'puzzle':
                assert.deepEqual(
                  [...question.pieceOrder].sort((a, b) => a - b),
                  Array.from({ length: question.cols * question.rows }, (_, i) => i),
                );
                assert.ok(PUZZLE_SCENES.some((scene) => scene.id === question.sceneId));
                break;
              case 'trace':
                for (const letter of question.word) assert.ok(LETTER_STROKES[letter], `strokes for ${letter}`);
                break;
              case 'dots':
                assert.ok(DOT_FIGURES[question.figureId]);
                break;
              case 'fill':
                assert.ok(LETTER_STROKES[question.letter]);
                assert.ok(question.palette.length >= 2);
                break;
              case 'feed': {
                const ids = question.options.map((option) => option.id);
                const answer = question.options.find((option) => option.id === question.answerId);
                assert.ok(answer, 'the answer is an option');
                assert.equal(new Set(ids).size, ids.length, 'options are unique');
                assert.ok(ids.length >= 2, 'at least two options');
                assert.ok(question.prompt[lang].includes(answer.label[lang]), 'the prompt names the fruit');
                assert.ok(question.character.emoji, 'the character can show without artwork');
                break;
              }
            }
          });
        }
      });
    }
  }

  it('rebuilds the same round structure when the language changes mid-game', () => {
    const activity = ACTIVITIES.find((a) => a.id === 't-animals');
    assert.ok(activity);
    const ms = buildQuestions(activity, 'ms', 99);
    const en = buildQuestions(activity, 'en', 99);
    assert.deepEqual(ms.map((q) => q.id), en.map((q) => q.id));
    assert.deepEqual(
      ms.map((q) => (q.kind === 'choice' ? q.answerId : '')),
      en.map((q) => (q.kind === 'choice' ? q.answerId : '')),
    );
  });

  it('never leaves an arrange word already spelled', () => {
    const activity = ACTIVITIES.find((a) => a.id === 'k-arrange');
    assert.ok(activity);
    for (let seed = 0; seed < 200; seed++) {
      for (const question of buildQuestions(activity, 'en', seed)) {
        if (question.kind !== 'arrange') continue;
        assert.notEqual(question.letters.map((l) => l.letter).join(''), question.word, `seed ${seed}`);
      }
    }
  });
});

describe('content data', () => {
  it('has strokes for A to Z, inside the box', () => {
    assert.equal(Object.keys(LETTER_STROKES).length, 26);
    for (const strokes of Object.values(LETTER_STROKES)) {
      for (const stroke of strokes) {
        assert.ok(stroke.length >= 2);
        for (const [x, y] of stroke) {
          assert.ok(x >= 0 && x <= 100 && y >= 0 && y <= 100);
        }
      }
    }
  });

  it('keeps dot figures far enough apart to tap', () => {
    for (const figure of Object.values(DOT_FIGURES)) {
      figure.points.forEach((a, i) => {
        figure.points.slice(i + 1).forEach((b) => {
          assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= 10, `${figure.id} dots overlap`);
        });
      });
    }
  });
});

describe('session rules', () => {
  const started = sessionReducer(createSession(2), { type: 'start' });

  it('scores a first-try answer', () => {
    const state = play(started, { type: 'attempt', correct: true }, { type: 'solve' });
    assert.equal(state.firstTry, 1);
    assert.equal(state.correct, 1);
    assert.equal(state.attempts, 1);
  });

  it('does not count a mistake or a hint as first try', () => {
    assert.equal(
      play(started, { type: 'attempt', correct: false }, { type: 'attempt', correct: true }, { type: 'solve' }).firstTry,
      0,
    );
    assert.equal(play(started, { type: 'hint' }, { type: 'attempt', correct: true }, { type: 'solve' }).firstTry, 0);
  });

  it('ignores taps after a question is solved', () => {
    const solved = play(started, { type: 'attempt', correct: true }, { type: 'solve' });
    const tapped = play(solved, { type: 'attempt', correct: false }, { type: 'solve' }, { type: 'hint' });
    assert.deepEqual(tapped, solved);
  });

  it('will not move on until the question is solved', () => {
    assert.equal(sessionReducer(started, { type: 'next' }).index, 0);
  });

  it('resets per-question counters on next, and completes after the last question', () => {
    const first = play(started, { type: 'attempt', correct: false }, { type: 'attempt', correct: true }, { type: 'solve' }, { type: 'next' });
    assert.equal(first.index, 1);
    assert.equal(first.mistakes, 0);
    assert.equal(first.solved, false);

    const done = play(first, { type: 'attempt', correct: true }, { type: 'solve' }, { type: 'next' });
    assert.equal(done.status, 'complete');
    assert.equal(done.attempts, 3);
    assert.equal(done.stars, 2);
  });

  it('always gives at least one star', () => {
    assert.equal(starsFor(0, 5), 1);
    assert.equal(starsFor(3, 5), 2);
    assert.equal(starsFor(5, 5), 3);
    assert.equal(starsFor(0, 0), 1);
  });

  it('restart returns to the intro with a clean score', () => {
    const played = play(started, { type: 'attempt', correct: true }, { type: 'solve' });
    assert.deepEqual(sessionReducer(played, { type: 'restart' }), createSession(2));
  });
});

describe('tracing geometry', () => {
  const checkpoints = samplePolyline([[0, 0], [0, 100]], 10);

  it('samples a line and keeps both ends', () => {
    assert.deepEqual(checkpoints[0], { x: 0, y: 0 });
    assert.deepEqual(checkpoints[checkpoints.length - 1], { x: 0, y: 100 });
    assert.equal(checkpoints.length, 11);
  });

  it('advances only near the next checkpoints', () => {
    assert.equal(advanceCheckpoint(checkpoints, 0, { x: 0, y: 10 }, 5), 1);
    assert.equal(advanceCheckpoint(checkpoints, 0, { x: 50, y: 10 }, 5), 0);
  });

  it('cannot finish a stroke by touching only its far end', () => {
    assert.equal(advanceCheckpoint(checkpoints, 0, { x: 0, y: 100 }, 5), 0);
  });

  it('places a segment centred between its two points', () => {
    const style = segmentStyle({ x: 0, y: 0 }, { x: 10, y: 0 }, 2);
    assert.equal(style.width, 10);
    assert.equal(style.left, 0);
    assert.equal(style.top, -1);
    assert.equal(style.angleDeg, 0);
  });
});

describe('progress', () => {
  const now = new Date('2026-11-01T00:00:00Z');

  it('accumulates totals and keeps the best stars', () => {
    let profile = applySessionResult({}, 't-abc', { stars: 3, correct: 5, attempts: 6 }, now);
    profile = applySessionResult(profile, 't-abc', { stars: 1, correct: 2, attempts: 9 }, now);
    assert.equal(profile['t-abc'].plays, 2);
    assert.equal(profile['t-abc'].bestStars, 3);
    assert.equal(profile['t-abc'].correct, 7);
    assert.equal(profile['t-abc'].attempts, 15);
  });

  it('summarises completed games and stars', () => {
    const profile = applySessionResult({}, 't-abc', { stars: 2, correct: 5, attempts: 5 }, now);
    const summary = summarizeProgress(profile, ACTIVITIES.filter((a) => a.journey === 'fundamentals'));
    assert.equal(summary.completed, 1);
    assert.equal(summary.total, 7);
    assert.equal(summary.stars, 2);
  });

  it('suggests an unplayed game first, then the weakest', () => {
    const list = ACTIVITIES.filter((a) => a.journey === 'activities');
    assert.equal(pickNextActivity({}, list)?.id, list[0].id);

    let profile = {};
    list.forEach((activity, i) => {
      profile = applySessionResult(profile, activity.id, { stars: i === 2 ? 1 : 3, correct: 1, attempts: 1 }, now);
    });
    assert.equal(pickNextActivity(profile, list)?.id, list[2].id);
  });
});
