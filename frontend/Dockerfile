# Étape 1 : Construction
FROM node:20-alpine AS builder
WORKDIR /app

# On copie les fichiers de dépendances
COPY package*.json ./

# On utilise install au lieu de ci
RUN npm install

# On copie tout le reste (assurez-vous que index.html est bien là)
COPY . .

# Injection des variables Supabase pour le build Vite
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npx vite build

# Étape 2 : Serveur léger (Caddy)
FROM caddy:2-alpine
# On copie le résultat du build vers le dossier que Caddy sert par défaut
COPY --from=builder /app/dist /usr/share/caddy
EXPOSE 80
