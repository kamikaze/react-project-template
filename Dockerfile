FROM node:24-slim AS build-image

LABEL Name=frontend
LABEL Maintainer=kamikaze.is.waiting.you@gmail.com

ARG ENVIRONMENT

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

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
