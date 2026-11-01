import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

export const useRefetchOnForeground = (refetch: () => void) => {
  const latestRefetch = useRef(refetch);

  useEffect(() => {
    latestRefetch.current = refetch;
  });

  useEffect(() => {
    let previousState = AppState.currentState;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (previousState !== 'active' && nextState === 'active') {
        latestRefetch.current();
      }
      previousState = nextState;
    });
    return () => subscription.remove();
  }, []);
};
