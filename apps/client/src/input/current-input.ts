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
