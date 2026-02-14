import { useState, useCallback } from 'react';

const STORAGE_KEY = 'shipit-tutorial-mode';

export function useTutorialMode() {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    // Default ON for first-time players (null = never set)
    return stored === null ? true : stored === 'true';
  });

  const toggle = useCallback(() => {
    setIsEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return { isEnabled, toggle } as const;
}
