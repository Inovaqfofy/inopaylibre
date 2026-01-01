# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Accept build args for Vite env vars (Coolify compatible)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_SUPABASE_PROJECT_ID
ARG VITE_APP_URL

# Set as env vars for build
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
ENV VITE_SUPABASE_PROJECT_ID=${VITE_SUPABASE_PROJECT_ID}
ENV VITE_APP_URL=${VITE_APP_URL}

# Install dependencies (with fallback if no lockfile)
COPY package*.json ./
RUN npm install --legacy-peer-deps || npm install

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Production avec Caddy (meilleur support HTTPS automatique)
FROM caddy:2-alpine
COPY --from=builder /app/dist /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 80 443
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
