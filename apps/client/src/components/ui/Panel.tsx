import type { ReactNode } from "react";

interface PanelProps {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}

/** 9-slice framed overlay surface used by every non-hud screen. */
export const Panel = ({ children, className = "", labelledBy }: PanelProps) => (
  <section
    aria-labelledby={labelledBy}
    className={`panel pixel-frame screen-enter ${className}`.trim()}
  >
    {children}
  </section>
);
