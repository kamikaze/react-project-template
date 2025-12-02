FROM node:25-slim AS build-image

LABEL Name=frontend
LABEL Maintainer=kamikaze.is.waiting.you@gmail.com

ARG ENVIRONMENT

WORKDIR /app

# Corepack is not available in Node.js 25.x images; install pnpm explicitly
# and configure a dedicated store directory to leverage BuildKit cache mounts.
ENV PNPM_STORE_DIR="/pnpm/store"
RUN npm i -g pnpm@10

COPY ./ /app

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN VITE_STAGE="${ENVIRONMENT}" PUBLIC_URL="/" pnpm run build

FROM nginx:stable-alpine AS run-image

WORKDIR /usr/share/nginx/html/

COPY --from=build-image /app/dist/ /usr/share/nginx/html/
COPY .docker/nginx.template /etc/nginx/nginx.template
COPY .docker/docker-entrypoint.sh /

RUN ["chmod", "+x", "/docker-entrypoint.sh"]
CMD ["sh", "/docker-entrypoint.sh"]
EXPOSE 8080
