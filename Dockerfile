# Two stages: Node builds the static site, nginx serves it. The running
# container has no Node and no source code — only the built files.

# ---- build ----------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

# Manifests first, so this layer stays cached until a dependency changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines VITE_* values into the JavaScript at build time. They are build
# arguments, not runtime environment variables: changing one means rebuilding.
# All three are public by design — never pass the Supabase secret key here.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY \
    VITE_API_URL=$VITE_API_URL

# Without Supabase settings the app only renders a "not connected" notice, so
# refuse to build an image like that rather than ship it.
RUN if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_PUBLISHABLE_KEY" ]; then \
      echo "Missing build args: pass --build-arg VITE_SUPABASE_URL=... and --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=..." >&2; \
      exit 1; \
    fi \
 && npm run build

# ---- serve ----------------------------------------------------------------
FROM nginx:1.30-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
