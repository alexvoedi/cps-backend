FROM node:22-alpine AS base

USER root

RUN npm install -g pnpm

RUN mkdir -p /app && chown -R node:node /app

USER node

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=build

WORKDIR /app

COPY src src
COPY prisma prisma
COPY scripts scripts
COPY package.json pnpm-lock.yaml tsconfig.json ./


# ---

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# ---

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

# ---

FROM build AS prisma
RUN pnpm run prisma:generate

# ---

FROM base AS prod

USER node

COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
COPY --from=prisma /app/node_modules/@prisma/client /app/node_modules/@prisma/client

EXPOSE 3000

CMD ["scripts/run.sh"]
