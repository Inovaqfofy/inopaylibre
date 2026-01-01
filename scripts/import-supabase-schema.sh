#!/bin/bash
# Import Schema Supabase - inopay
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_FILE="${SCRIPT_DIR}/../database/migrations/001_schema.sql"

echo "╔════════════════════════════════════════════════════════╗"
echo "║     💾 Import Schéma Supabase - inopay             ║"
echo "╚════════════════════════════════════════════════════════╝"

[ ! -f "$SCHEMA_FILE" ] && { echo "❌ Fichier non trouvé: $SCHEMA_FILE"; exit 1; }
echo "✅ Fichier trouvé"

read -p "Hôte PostgreSQL [localhost]: " DB_HOST; DB_HOST=${DB_HOST:-localhost}
read -p "Port [5432]: " DB_PORT; DB_PORT=${DB_PORT:-5432}
read -p "Base [postgres]: " DB_NAME; DB_NAME=${DB_NAME:-postgres}
read -p "Utilisateur [postgres]: " DB_USER; DB_USER=${DB_USER:-postgres}
read -s -p "Mot de passe: " DB_PASSWORD; echo ""

echo "🔌 Test connexion..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1 || { echo "❌ Connexion échouée"; exit 1; }
echo "✅ Connexion OK"

read -p "Importer le schéma? (oui/non): " CONFIRM
[ "$CONFIRM" != "oui" ] && { echo "Annulé"; exit 0; }

PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCHEMA_FILE"
echo "✅ Schéma importé!"

echo "📋 Tables créées:"
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\dt public.*"
