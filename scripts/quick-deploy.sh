#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════════
# InoPay Liberation Pack - Script de Déploiement Automatique
# Projet: inopay
# ═══════════════════════════════════════════════════════════════

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   🚀 InoPay Liberation Pack - inopay"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Vérification root
if [ "\$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Ce script doit être exécuté en tant que root${NC}"
  echo -e "   Utilisez: ${YELLOW}sudo ./quick-deploy.sh${NC}"
  exit 1
fi

# ─────────────────────────────────────────────────────────────
# 1. Installation Docker
# ─────────────────────────────────────────────────────────────
echo -e "${YELLOW}📦 Vérification de Docker...${NC}"

if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}📥 Installation de Docker...${NC}"
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  echo -e "${GREEN}✓ Docker installé avec succès${NC}"
else
  echo -e "${GREEN}✓ Docker est déjà installé ($(docker --version))${NC}"
fi

# Docker Compose (inclus dans Docker récent)
if ! docker compose version &> /dev/null; then
  echo -e "${RED}❌ Docker Compose non disponible${NC}"
  exit 1
fi

# ─────────────────────────────────────────────────────────────
# 2. Configuration des variables d'environnement
# ─────────────────────────────────────────────────────────────
echo -e "${YELLOW}⚙️  Configuration de l'environnement...${NC}"

if [ ! -f .env ]; then
  cp .env.example .env
  
  # Génération automatique des secrets
  JWT_SECRET=$(openssl rand -base64 32)
  sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
  echo -e "${GREEN}✓ JWT_SECRET généré${NC}"
  


  echo -e "${GREEN}✓ Fichier .env créé${NC}"
else
  echo -e "${GREEN}✓ Fichier .env existant conservé${NC}"
fi

# ─────────────────────────────────────────────────────────────
# 3. Configuration du firewall
# ─────────────────────────────────────────────────────────────
echo -e "${YELLOW}🔥 Configuration du firewall...${NC}"

if command -v ufw &> /dev/null; then
  ufw allow 22/tcp   # SSH
  ufw allow 80/tcp   # HTTP
  ufw allow 443/tcp  # HTTPS
  echo -e "${GREEN}✓ Ports 80 et 443 ouverts${NC}"
fi

# ─────────────────────────────────────────────────────────────
# 4. Build et démarrage
# ─────────────────────────────────────────────────────────────
echo -e "${YELLOW}🐳 Construction et démarrage des containers...${NC}"

docker compose pull 2>/dev/null || true
docker compose build --no-cache
docker compose up -d

# ─────────────────────────────────────────────────────────────
# 5. Attente et vérification
# ─────────────────────────────────────────────────────────────
echo -e "${YELLOW}⏳ Attente du démarrage des services...${NC}"
sleep 15

# Vérification des containers
echo ""
docker compose ps

# Test de santé
HEALTH_CHECK=$(curl -s http://localhost 2>/dev/null | head -c 100 || echo "")

echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║          🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !             ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Récupérer l'IP publique
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "VOTRE_IP")

echo -e "${BLUE}📍 Accès à votre application:${NC}"
echo -e "   Frontend:  ${GREEN}http://$PUBLIC_IP${NC}"
echo -e "   API:       ${GREEN}http://$PUBLIC_IP/api/health${NC}"

echo -e "   Ollama:    ${GREEN}http://$PUBLIC_IP:11434${NC} (si activé)"

echo ""
echo -e "${YELLOW}📋 Commandes utiles:${NC}"
echo "   docker compose logs -f          # Voir les logs"
echo "   docker compose restart          # Redémarrer"
echo "   docker compose down             # Arrêter"
echo ""
echo -e "${BLUE}📖 Guide complet: ouvrez DEPLOY_GUIDE.html${NC}"
echo ""
