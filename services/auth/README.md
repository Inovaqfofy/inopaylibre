# 🔐 Service d'Authentification Autonome

Remplacement direct de Supabase Auth, compatible avec les JWT existants.

## Démarrage rapide

```bash
# Créer le schéma
psql -d votre_db -f schema.sql

# Démarrer
docker compose up -d
```

## Endpoints

| Endpoint | Description |
|----------|-------------|
| POST /auth/v1/signup | Inscription |
| POST /auth/v1/token | Connexion / Refresh |
| GET /auth/v1/user | Utilisateur courant |
| POST /auth/v1/logout | Déconnexion |

## Variables d'environnement

- `JWT_SECRET`: Clé secrète JWT (requise)
- `DATABASE_URL`: URL PostgreSQL
- `JWT_EXPIRY`: Durée token (défaut: 7d)
- `REFRESH_TOKEN_EXPIRY`: Durée refresh (défaut: 30d)
