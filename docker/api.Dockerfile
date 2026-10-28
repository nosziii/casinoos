FROM node:24-bookworm-slim AS build
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
WORKDIR /app
COPY --from=build --chown=node:node /app /app
USER node
EXPOSE 3000
CMD ["pnpm", "--filter", "@casino-ops/api", "start"]

