# 🚀 Guide Coolify Pas-à-Pas - inopay

## 📋 Table des matières
1. [Prérequis](#prérequis)
2. [Installation Coolify](#installation-coolify)
3. [Configuration GitHub](#configuration-github)
4. [Déploiement](#déploiement)
5. [Troubleshooting](#troubleshooting)

---

## Prérequis

### Serveur VPS
- **Minimum**: 2 vCPU, 4GB RAM, 40GB SSD
- **OS**: Ubuntu 22.04 LTS

```bash
ssh root@VOTRE_IP
free -h && df -h
```

---

## Installation Coolify

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Accès: `https://VOTRE_IP:8000`

---

## Configuration GitHub

```bash
cd inopay
git init && git add . && git commit -m "🚀 Liberation"
git remote add origin https://github.com/USER/inopay.git
git push -u origin main
```

Dans Coolify: Settings → Git Sources → + Add GitHub App

---

## Déploiement

1. **New Project** → Nom: `inopay`
2. **+ New Resource** → Docker Compose → GitHub
3. Configurez les variables d'environnement
4. Cliquez **Deploy**

---

## Troubleshooting

### Build qui échoue
```bash
echo "node_modules/" >> .gitignore
git rm -r --cached node_modules
git commit -m "Fix" && git push
```

### SSL ne fonctionne pas
- Vérifiez DNS: `nslookup domaine.com`
- Ports ouverts: `ufw allow 80 && ufw allow 443`

### Container restart en boucle
- Vérifiez les logs dans Coolify
- Testez le Dockerfile localement

---

*Généré par InoPay Liberation Pack*
