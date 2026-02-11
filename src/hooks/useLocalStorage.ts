import { useEffect, useState } from "react";

/**
 * A custom hook for synchronizing state with localStorage.
 *
 * @param key The localStorage key to use
 * @param initial The initial value if no value is stored
 * @returns A stateful value and a function to update it
 */
export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initial;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setValue] as const;
}
