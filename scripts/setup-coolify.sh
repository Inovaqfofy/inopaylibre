#!/bin/bash
# Setup Coolify - inopay
set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║     🚀 Configuration Coolify - inopay              ║"
echo "╚════════════════════════════════════════════════════════╝"

command -v curl &> /dev/null || { echo "❌ curl requis"; exit 1; }
command -v docker &> /dev/null || { echo "❌ Docker requis"; exit 1; }
echo "✅ Prérequis OK"

read -p "URL Coolify (ex: https://coolify.domaine.com): " COOLIFY_URL
read -p "Token API Coolify: " COOLIFY_TOKEN
read -p "URL dépôt GitHub: " GITHUB_REPO

echo "🚀 Création du projet..."
curl -s -X POST "${COOLIFY_URL}/api/v1/projects" \
    -H "Authorization: Bearer ${COOLIFY_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"name": "inopay", "description": "Libéré par InoPay"}'

echo "✅ Projet créé! Configurez les env vars dans Coolify."
