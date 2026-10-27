FROM oven/bun:1.4.4 AS build
WORKDIR /app
COPY package.json bun.lock* turbo.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
RUN bun install --frozen-lockfile
RUN bun run build

FROM oven/bun:1.4.4
WORKDIR /app
COPY --from=build /app /app
ENV NODE_ENV=production
EXPOSE 3000
CMD ["bun", "apps/server/src/index.ts"]
