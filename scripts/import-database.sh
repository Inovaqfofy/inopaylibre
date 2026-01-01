#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# IMPORT DATABASE - inopay
# ═══════════════════════════════════════════════════════════════
# Ce script importe le schéma ET les données dans votre base PostgreSQL
# ═══════════════════════════════════════════════════════════════

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  IMPORT BASE DE DONNÉES - inopay${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Configuration (à personnaliser)
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_NAME=${DB_NAME:-inopay}
DB_PASSWORD=${DB_PASSWORD:-}

# Chemin des fichiers
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_DIR="$SCRIPT_DIR/../database"

# Vérification des fichiers
echo -e "${YELLOW}[1/5] Vérification des fichiers...${NC}"
if [ -f "$DB_DIR/FULL_DATABASE_EXPORT.sql" ]; then
    echo -e "${GREEN}  ✓ FULL_DATABASE_EXPORT.sql trouvé${NC}"
    USE_FULL_EXPORT=true
elif [ -f "$DB_DIR/migrations/001_schema.sql" ]; then
    echo -e "${GREEN}  ✓ 001_schema.sql trouvé${NC}"
    USE_FULL_EXPORT=false
else
    echo -e "${RED}  ✗ Aucun fichier SQL trouvé!${NC}"
    exit 1
fi

# Test de connexion
echo -e "${YELLOW}[2/5] Test de connexion à PostgreSQL...${NC}"
if [ -n "$DB_PASSWORD" ]; then
    export PGPASSWORD="$DB_PASSWORD"
fi

if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Connexion réussie${NC}"
else
    echo -e "${RED}  ✗ Impossible de se connecter à PostgreSQL${NC}"
    echo -e "  Vérifiez: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD"
    exit 1
fi

# Création de la base si nécessaire
echo -e "${YELLOW}[3/5] Vérification/création de la base...${NC}"
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo -e "${GREEN}  ✓ Base '$DB_NAME' existe déjà${NC}"
else
    echo -e "  Création de la base '$DB_NAME'..."
    createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
    echo -e "${GREEN}  ✓ Base créée${NC}"
fi

# Import
echo -e "${YELLOW}[4/5] Import des données...${NC}"
if [ "$USE_FULL_EXPORT" = true ]; then
    echo -e "  Import de FULL_DATABASE_EXPORT.sql (schéma + données)..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$DB_DIR/FULL_DATABASE_EXPORT.sql"
else
    echo -e "  Import de 001_schema.sql..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$DB_DIR/migrations/001_schema.sql"
    
    if [ -f "$DB_DIR/migrations/003_data_export.sql" ]; then
        echo -e "  Import de 003_data_export.sql..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$DB_DIR/migrations/003_data_export.sql"
    fi
fi
echo -e "${GREEN}  ✓ Import terminé${NC}"

# Statistiques
echo -e "${YELLOW}[5/5] Vérification...${NC}"
TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'")
echo -e "${GREEN}  ✓ $TABLE_COUNT tables importées${NC}"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ IMPORT TERMINÉ AVEC SUCCÈS!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Votre base de données est prête: ${BLUE}$DB_NAME${NC}"
echo ""
