import { useCallback, useEffect } from 'react';
import { applySessionResult, ProfileProgress, SessionResult } from '@/services/game/progress';
import { loadProfileProgress, saveProfileProgress } from '@/services/game/progress-storage';
import { useAuthStore } from '@/store/auth-store';
import { useChildrenStore } from '@/store/children-store';
import { useGameProgressStore } from '@/store/game-progress-store';
import { useGameSettingsStore } from '@/store/game-settings-store';

const EMPTY_PROGRESS: ProfileProgress = {};

// Progress belongs to the chosen child. With no child chosen it belongs to the signed-in parent,
// so a second account on the same phone never sees someone else's stars.
export const useGameProfileId = (): string => {
  const activeChildId = useGameSettingsStore((state) => state.activeChildId);
  const children = useChildrenStore((state) => state.children);
  const userId = useAuthStore((state) => state.user?.id);

  if (activeChildId && children.some((child) => child.id === activeChildId)) return activeChildId;
  return `parent-${userId ?? 'none'}`;
};

export const useGameProgress = () => {
  const profileId = useGameProfileId();
  const stored = useGameProgressStore((state) => state.profiles[profileId]);
  const isLoaded = stored !== undefined;

  useEffect(() => {
    if (isLoaded) return;
    let active = true;
    loadProfileProgress(profileId).then((progress) => {
      if (active) useGameProgressStore.getState().setProfile(profileId, progress);
    });
    return () => {
      active = false;
    };
  }, [isLoaded, profileId]);

  const recordSession = useCallback(
    (activityId: string, result: SessionResult) => {
      const { profiles, setProfile } = useGameProgressStore.getState();
      const next = applySessionResult(profiles[profileId] ?? EMPTY_PROGRESS, activityId, result, new Date());
      setProfile(profileId, next);
      saveProfileProgress(profileId, next).catch(() => {});
    },
    [profileId],
  );

  return { profile: stored ?? EMPTY_PROGRESS, isLoaded, recordSession };
};
