import { useCallback } from 'react';
import { useRouter, type Href } from 'expo-router';

export const useGoBack = (fallback: Href) => {
  const router = useRouter();

  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallback);
    }
  }, [router, fallback]);
};
