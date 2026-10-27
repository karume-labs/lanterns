import { useAppStore } from "../../app/store";

/** Transient toast stack; driven by the store, auto-dismissing. */
export const Toasts = () => {
  const toasts = useAppStore((state) => state.toasts);
  if (toasts.length === 0) return null;
  return (
    <div aria-live="polite" className="toasts" role="status">
      {toasts.map((toast) => (
        <span className="toast pixel-frame" key={toast.id}>
          {toast.text}
        </span>
      ))}
    </div>
  );
};
