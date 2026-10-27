import { EMPTY_INPUT, type InputState } from "@lanterns/domain";

/**
 * Latest input produced by any control scheme. The socket forwards it and the
 * local-player prediction reads it, so both always agree on what the player
 * is doing.
 */
export const currentInput = {
  value: EMPTY_INPUT as InputState,
};

export const setCurrentInput = (input: InputState): void => {
  currentInput.value = input;
};

type InputSink = (input: InputState) => void;
let sink: InputSink | null = null;

/** App registers the socket sender here; control schemes just dispatch. */
export const setInputSink = (next: InputSink | null): void => {
  sink = next;
};

export const dispatchInput = (input: InputState): void => {
  setCurrentInput(input);
  sink?.(input);
};
