interface StatBarProps {
  label: string;
  /** 0..1 fill ratio */
  ratio: number;
  tone?: "amber" | "green" | "red" | "blue" | "rose";
  caption?: string;
  pulse?: boolean;
}

/** Labeled pixel progress bar; `pulse` marks critical values (low fuel). */
export const StatBar = ({
  label,
  ratio,
  tone = "amber",
  caption,
  pulse = false,
}: StatBarProps) => (
  <div className={`stat-bar ${pulse ? "pulse" : ""}`}>
    <span className="stat-bar-label">{label}</span>
    <div
      aria-label={label}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(ratio * 100)}
      className={`stat-bar-track tone-${tone}`}
      role="progressbar"
    >
      <span
        className="stat-bar-fill"
        style={{ width: `${Math.max(0, Math.min(1, ratio)) * 100}%` }}
      />
    </div>
    {caption !== undefined && (
      <span className="stat-bar-caption num">{caption}</span>
    )}
  </div>
);
