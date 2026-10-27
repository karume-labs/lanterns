import { useRef } from "react";

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
}

const ALPHABET = /^[A-Z0-9]$/;
const CELL_KEYS = [
  "cell-0",
  "cell-1",
  "cell-2",
  "cell-3",
  "cell-4",
  "cell-5",
  "cell-6",
  "cell-7",
] as const;

/** Large one-character cells with auto-uppercase and whole-code paste. */
export const CodeInput = ({ value, onChange, length = 5 }: CodeInputProps) => {
  const cells = useRef<(HTMLInputElement | null)[]>([]);
  const chars = value.padEnd(length, " ").slice(0, length).split("");

  const put = (index: number, char: string): void => {
    const next = value.padEnd(length, " ").split("");
    next[index] = char;
    onChange(next.join("").replace(/\s+$/, "").toUpperCase());
  };

  const handleKey = (
    event: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ): void => {
    if (event.key === "Backspace") {
      event.preventDefault();
      const current = value[index] ?? "";
      put(index, current ? " " : "");
      if (current && index > 0) cells.current[index - 1]?.focus();
      return;
    }
    if (event.key === "ArrowLeft" && index > 0)
      cells.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < length - 1)
      cells.current[index + 1]?.focus();
    if (event.key.length === 1 && ALPHABET.test(event.key)) {
      event.preventDefault();
      put(index, event.key);
      if (index < length - 1) cells.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent): void => {
    const text = event.clipboardData
      .getData("text")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, length);
    if (!text) return;
    event.preventDefault();
    onChange(text);
    cells.current[Math.min(text.length, length - 1)]?.focus();
  };

  return (
    <div className="code-cells" onPaste={handlePaste}>
      {chars.map((char, index) => (
        <input
          aria-label={`Code character ${index + 1}`}
          className="code-cell num"
          inputMode="text"
          key={CELL_KEYS[index]}
          maxLength={1}
          onChange={(event) => {
            const next = event.target.value.toUpperCase().slice(-1);
            if (ALPHABET.test(next)) put(index, next);
            if (index < length - 1) cells.current[index + 1]?.focus();
          }}
          onKeyDown={(event) => handleKey(event, index)}
          ref={(element) => {
            cells.current[index] = element;
          }}
          value={char.trim()}
        />
      ))}
    </div>
  );
};
