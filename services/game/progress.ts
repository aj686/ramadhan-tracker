import type { Activity, JourneyId } from '../../data/games/schema';

export interface ActivityProgress {
  plays: number;
  completions: number;
  bestStars: number;
  correct: number;
  attempts: number;
  lastPlayedAt: string;
}

export type ProfileProgress = Record<string, ActivityProgress>;

export interface SessionResult {
  stars: number;
  correct: number;
  attempts: number;
}

export const applySessionResult = (
  profile: ProfileProgress,
  activityId: string,
  result: SessionResult,
  now: Date,
): ProfileProgress => {
  const previous = profile[activityId];
  return {
    ...profile,
    [activityId]: {
      plays: (previous?.plays ?? 0) + 1,
      completions: (previous?.completions ?? 0) + 1,
      bestStars: Math.max(previous?.bestStars ?? 0, result.stars),
      correct: (previous?.correct ?? 0) + result.correct,
      attempts: (previous?.attempts ?? 0) + result.attempts,
      lastPlayedAt: now.toISOString(),
    },
  };
};

export interface ProgressSummary {
  completed: number;
  total: number;
  stars: number;
  maxStars: number;
  correct: number;
  attempts: number;
}

export const summarizeProgress = (profile: ProfileProgress, activities: Activity[]): ProgressSummary =>
  activities.reduce<ProgressSummary>(
    (summary, activity) => {
      const entry = profile[activity.id];
      return {
        completed: summary.completed + (entry && entry.completions > 0 ? 1 : 0),
        total: summary.total + 1,
        stars: summary.stars + (entry?.bestStars ?? 0),
        maxStars: summary.maxStars + 3,
        correct: summary.correct + (entry?.correct ?? 0),
        attempts: summary.attempts + (entry?.attempts ?? 0),
      };
    },
    { completed: 0, total: 0, stars: 0, maxStars: 0, correct: 0, attempts: 0 },
  );

export const summarizeByJourney = (
  profile: ProfileProgress,
  journeys: JourneyId[],
  activities: Activity[],
): Record<string, ProgressSummary> =>
  Object.fromEntries(
    journeys.map((journey) => [
      journey,
      summarizeProgress(profile, activities.filter((activity) => activity.journey === journey)),
    ]),
  );

// Daily Challenge: the first game this child has not finished, otherwise the lowest-starred one.
export const pickNextActivity = (profile: ProfileProgress, activities: Activity[]): Activity | undefined => {
  const unplayed = activities.find((activity) => !profile[activity.id]?.completions);
  if (unplayed) return unplayed;
  return [...activities].sort(
    (a, b) => (profile[a.id]?.bestStars ?? 0) - (profile[b.id]?.bestStars ?? 0),
  )[0];
};

export const isProfileProgress = (value: unknown): value is ProfileProgress =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
