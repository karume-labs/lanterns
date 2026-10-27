interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

/** Pixel-styled range row used across settings. */
export const Slider = ({ label, value, onChange }: SliderProps) => (
  <label className="setting-row">
    {label}
    <input
      max={1}
      min={0}
      onChange={(event) => onChange(Number(event.target.value))}
      step={0.05}
      type="range"
      value={value}
    />
  </label>
);

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** Checkbox row styled as a pixel switch. */
export const Toggle = ({ label, checked, onChange }: ToggleProps) => (
  <label className="setting-row toggle">
    <input
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      type="checkbox"
    />
    {label}
  </label>
);
