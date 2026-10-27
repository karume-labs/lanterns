# Lanterns

Lanterns is a four-player cooperative pixel-art survival game. A Bun WebSocket
server owns gameplay state; a React and PixiJS client renders the game.

## Development

```sh
bun install
bun run dev:server
# In another terminal:
bun run dev:client
```

The client runs at `http://localhost:5173` and connects to the server at
`ws://localhost:3000/ws` by default.

## Checks

```sh
bun run check
bun run build
```

## Hosting decision

The production target is Railway: it can run the single Bun process that serves
the built client and maintains WebSocket connections. ChatGPT Sites also
supports WebSockets, but is not required for this standalone authoritative-game
server deployment.
