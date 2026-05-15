FROM node:26-slim AS build-image

LABEL Name=frontend
LABEL Maintainer=kamikaze.is.waiting.you@gmail.com

ARG ENVIRONMENT

WORKDIR /app

# ----------------------------
# Corepack (safe pnpm bootstrap)
# ----------------------------
RUN npm install -g corepack
RUN corepack enable

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g corepack --force && corepack enable

# Copy dependency manifests first (better caching).
# pnpm-workspace.yaml must be present so pnpm 11 honors `allowBuilds` for @swc/core and esbuild.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install deps (cache enabled)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Copy full source
COPY ./ /app

RUN VITE_STAGE="${ENVIRONMENT}" PUBLIC_URL="/" pnpm run build


# ----------------------------
# Runtime image
# ----------------------------
FROM nginx:stable-alpine AS run-image

WORKDIR /usr/share/nginx/html/

COPY --from=build-image /app/dist/ /usr/share/nginx/html/
COPY .docker/nginx/nginx.template /etc/nginx/nginx.template
COPY .docker/nginx/docker-entrypoint.sh /

RUN chmod +x /docker-entrypoint.sh

EXPOSE 8080
CMD ["sh", "/docker-entrypoint.sh"]
