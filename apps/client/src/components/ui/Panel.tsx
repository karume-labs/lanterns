import type { ReactNode } from "react";

interface PanelProps {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
  /** Shows a top-right × button when set. */
  onClose?: () => void;
}

/** 9-slice framed overlay surface used by every non-hud screen. */
export const Panel = ({
  children,
  className = "",
  labelledBy,
  onClose,
}: PanelProps) => (
  <section
    aria-labelledby={labelledBy}
    className={`panel pixel-frame screen-enter ${className}`.trim()}
  >
    {onClose && (
      <div className="panel-close-bar">
        <button
          aria-label="Close"
          className="panel-close"
          onClick={onClose}
          type="button"
        >
          ×
        </button>
      </div>
    )}
    {children}
  </section>
);
