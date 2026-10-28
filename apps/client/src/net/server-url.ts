/**
 * Where the game server lives: same origin in prod (the Bun process serves
 * the client too), port 3000 next to Vite's 5173 in dev.
 */
export const serverUrl = (): string => {
  const configured = import.meta.env.VITE_SERVER_URL;
  if (configured) return configured;
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const host =
    location.port === "5173" ? `${location.hostname}:3000` : location.host;
  return `${protocol}//${host}/ws`;
};
