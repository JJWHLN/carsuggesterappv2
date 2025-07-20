import { useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';

export const useMemoryOptimization = () => {
  const cleanupFunctions = useRef<Array<() => void>>([]);

  const addCleanupFunction = useCallback((fn: () => void) => {
    cleanupFunctions.current.push(fn);
  }, []);

  const performCleanup = useCallback(() => {
    cleanupFunctions.current.forEach(fn => {
      try {
        fn();
      } catch (error) {
        logger.warn('Cleanup function failed:', error);
      }
    });
    cleanupFunctions.current = [];
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'background') {
        performCleanup();
      }
    });

    return () => {
      subscription?.remove();
      performCleanup();
    };
  }, [performCleanup]);

  return { addCleanupFunction, performCleanup };
};
