# syntax=docker/dockerfile:1

# ---- Build: install the workspace from the lockfile, build domain + client.
FROM oven/bun:1.4.4 AS build
WORKDIR /app
COPY package.json bun.lock turbo.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
# --ignore-scripts: the root "prepare" hook runs `lefthook install`, which needs
# git and a .git checkout that deliberately do not exist in this build context.
RUN bun install --frozen-lockfile --ignore-scripts
RUN bun run build
# Drop dev dependencies so the runtime image stays small.
RUN bun install --production --frozen-lockfile --ignore-scripts

# ---- Runtime: Bun + server sources + the prebuilt client, running as non-root.
FROM oven/bun:1.4.4-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/bun.lock ./
COPY --from=build /app/apps/server/package.json ./apps/server/package.json
COPY --from=build /app/apps/client/package.json ./apps/client/package.json
COPY --from=build /app/packages/domain/package.json ./packages/domain/package.json
COPY --from=build /app/apps/server/src ./apps/server/src
COPY --from=build /app/apps/client/dist ./apps/client/dist
COPY --from=build /app/packages/domain/src ./packages/domain/src
COPY --from=build /app/node_modules ./node_modules
# bun's isolated linker puts the @lanterns/domain workspace link here, not in
# the root node_modules - without it the server cannot resolve the package.
COPY --from=build /app/apps/server/node_modules ./apps/server/node_modules
# The oven/bun images ship a `bun` user (uid 1000); never run the game as root.
USER bun
EXPOSE 3000
CMD ["bun", "apps/server/src/index.ts"]
