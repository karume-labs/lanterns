/** Player-facing room error with a stable machine code. */
export class RoomError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
