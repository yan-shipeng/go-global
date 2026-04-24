import { useState, useCallback } from "react";

const STORAGE_KEY = "china-outbound-player-name";

export function usePlayerName() {
  const [playerName, setPlayerNameState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? "";
    } catch {
      return "";
    }
  });

  const setPlayerName = useCallback((name: string) => {
    try {
      if (name) {
        localStorage.setItem(STORAGE_KEY, name);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
    setPlayerNameState(name);
  }, []);

  return { playerName, setPlayerName };
}
