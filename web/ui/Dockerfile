# ── Build stage ────────────────────────────────────────────────────
#
# This is a *static* Astro build: it reads web/api during `npm run build` and
# bakes the result into HTML. The API must therefore be running and populated
# before this image is built — see the header of docker-compose.yml for the
# order. A build against an unreachable API fails loudly rather than
# publishing an empty site, which is the intended behaviour.

FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

ARG PUBLIC_API_BASE_URL=http://localhost:8001
ENV PUBLIC_API_BASE_URL=${PUBLIC_API_BASE_URL}

# Astro only exposes PUBLIC_-prefixed variables to the client bundle; a
# VITE_-prefixed name (as crm/ui uses) silently yields undefined here.
ARG PUBLIC_API_FORMS_ENABLED=false
ENV PUBLIC_API_FORMS_ENABLED=${PUBLIC_API_FORMS_ENABLED}

RUN npm run build

# ── Production stage ──────────────────────────────────────────────
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
