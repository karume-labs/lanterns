interface MenuScreenProps {
  name: string;
  code: string;
  canSubmit: boolean;
  onName: (value: string) => void;
  onCode: (value: string) => void;
  onCreate: () => void;
  onJoin: () => void;
}

export const MenuScreen = ({
  name,
  code,
  canSubmit,
  onName,
  onCode,
  onCreate,
  onJoin,
}: MenuScreenProps) => (
  <section className="panel menu" aria-live="polite">
    <h1>Lanterns</h1>
    <p>Gather your crew. Keep the light alive until dawn.</p>
    <label>
      Display name
      <input
        maxLength={16}
        onChange={(event) => onName(event.target.value)}
        value={name}
      />
    </label>
    <button disabled={!canSubmit} onClick={onCreate} type="button">
      Create room
    </button>
    <div className="join-row">
      <input
        aria-label="Room code"
        maxLength={5}
        onChange={(event) => onCode(event.target.value.toUpperCase())}
        placeholder="ROOM CODE"
        value={code}
      />
      <button
        disabled={!canSubmit || code.length !== 5}
        onClick={onJoin}
        type="button"
      >
        Join
      </button>
    </div>
  </section>
);
