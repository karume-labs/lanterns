import { EMPTY_INPUT, type InputState } from "@lanterns/domain";

/**
 * Latest input produced by any control scheme. The socket forwards it and the
 * local-player prediction reads it, so both always agree on what the player
 * is doing.
 *
 * Outgoing sends are capped at ~30 Hz so mouse and joystick streams cannot
 * flood the socket, but one-shot edges (build, cast, interact, first shot)
 * always flush immediately so a press is never dropped or delayed.
 */
export const currentInput = {
  value: EMPTY_INPUT as InputState,
};

const SEND_MS = 33;

export const setCurrentInput = (input: InputState): void => {
  currentInput.value = input;
};

type InputSink = (input: InputState) => void;
let sink: InputSink | null = null;
let sent: InputState = EMPTY_INPUT;
let lastFlush = 0;
let trailingTimer: number | null = null;

const flush = (input: InputState): void => {
  sent = input;
  lastFlush = performance.now();
  sink?.(input);
};

/** App registers the socket sender here; control schemes just dispatch. */
export const setInputSink = (next: InputSink | null): void => {
  sink = next;
  sent = EMPTY_INPUT;
  lastFlush = 0;
  if (trailingTimer !== null) {
    window.clearTimeout(trailingTimer);
    trailingTimer = null;
  }
};

export const dispatchInput = (input: InputState): void => {
  setCurrentInput(input);
  if (!sink) return;
  const edge =
    (input.placeConstruct && !sent.placeConstruct) ||
    (input.useRoleAbility && !sent.useRoleAbility) ||
    (input.interact && !sent.interact) ||
    (input.shooting && !sent.shooting);
  const elapsed = performance.now() - lastFlush;
  if (edge || elapsed >= SEND_MS) {
    if (trailingTimer !== null) {
      window.clearTimeout(trailingTimer);
      trailingTimer = null;
    }
    flush(input);
    return;
  }
  // Trailing send: the newest state always lands shortly after.
  if (trailingTimer === null)
    trailingTimer = window.setTimeout(() => {
      trailingTimer = null;
      flush(currentInput.value);
    }, SEND_MS - elapsed);
};
