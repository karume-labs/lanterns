const MODES = ["auto", "on", "off"] as const;

export type TouchMode = (typeof MODES)[number];

export const nextTouchMode = (mode: TouchMode): TouchMode =>
  MODES[(MODES.indexOf(mode) + 1) % MODES.length];

interface SettingsButtonProps {
  mode: TouchMode;
  onChange: (mode: TouchMode) => void;
}

/** Cycles how touch controls activate: follow device, always on, or off. */
export const SettingsButton = ({ mode, onChange }: SettingsButtonProps) => (
  <button
    aria-label="Toggle touch controls"
    className="settings-btn"
    onClick={() => onChange(nextTouchMode(mode))}
    type="button"
  >
    Touch: {mode}
  </button>
);
