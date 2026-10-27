import { useEffect, useMemo, useState } from "react";
import { nextTouchMode, type TouchMode } from "../ui/SettingsButton";

const MODE_KEY = "lanterns-touch-mode";

const storedMode = (): TouchMode => {
  const value = localStorage.getItem(MODE_KEY);
  return value === "on" || value === "off" ? value : "auto";
};

/** Persisted touch preference plus coarse-pointer device detection. */
export const useTouchMode = (): {
  mode: TouchMode;
  coarse: boolean;
  enabled: boolean;
  toggle: () => void;
} => {
  const [mode, setMode] = useState<TouchMode>(storedMode);
  const coarse = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches,
    [],
  );
  useEffect(() => {
    localStorage.setItem(MODE_KEY, mode);
  }, [mode]);
  return {
    mode,
    coarse,
    enabled: mode === "on" || (mode === "auto" && coarse),
    toggle: () => setMode((current) => nextTouchMode(current)),
  };
};
