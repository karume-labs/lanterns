# Working agreement

## Organization guardrails

This repo follows the org guardrails mirrored in [`.agents/rules/`](.agents/rules/):

- `AGENT-USAGE.MD` - load order and task workflow
- `GENERAL.MD` - arrow functions, named exports, absolute imports, 150-line cap
- `NAMING.MD` - kebab-case files/folders, PascalCase components
- `FALLBACKS.MD` - no `??`/`||`/`as` on already-typed values
- `TOOLING.MD` - Biome + typecheck + lefthook as the only gates
- `REACT.MD` - component/hook conventions

Rules from the guardrails that do not apply to this stack (Next.js, Drizzle,
oRPC/Elysia, TanStack Query, nuqs, Mantine/shadcn, React Native, SEO) are
deliberately not mirrored.

Repo-specific adaptations, which override the mirrored defaults where they
would conflict:

- **Imports:** workspace code imports through `@lanterns/domain` or the `@/`
  alias (`apps/*/src`); inside a package, `./` and `../` relative imports are
  allowed, but never multi-level walks like `../../..`.
- **Barrels:** `packages/*/src/index.ts` may be a pure re-export barrel because
  it is the package's public entry point.
- **Tests** are exempt from the 150-line cap; `bun tools/check-file-size.ts`
  enforces the cap on source files and runs in `bun run check`.
- **Validation:** JSON boundaries use hand-written type guards in
  `packages/domain`; no schema library is introduced for this.

## Game rules

- Keep game rules and protocol contracts in `packages/domain`; do not duplicate
  those types in client or server code.
- The server is authoritative. Clients send inputs and intent, never trusted
  positions, damage, currency, or match outcomes.
- Keep frame-rate rendering state in Pixi and low-frequency UI state in React.
- Add a focused test when changing deterministic domain or simulation rules.
- Keep desktop and touch input mapped to the same `InputState` contract.
- Do not add accounts, matchmaking, chat, or progression until the core phases
  explicitly permit them.

## Commits

Commit in batches using conventional commits:
`feat(scope): ...`, `fix(scope): ...`, `docs: ...`, `chore: ...`,
`test(scope): ...`, `refactor(scope): ...`. The commit message hook rejects
non-conventional subjects.

## Verification

Run `bun run check` (Biome check, typecheck, tests, file-size guard) before
considering a phase complete.
