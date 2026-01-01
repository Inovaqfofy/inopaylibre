# inopay - Liberation Pack 🛡️

## Score de Souveraineté: 85%

Ce pack contient votre application complètement libérée des dépendances propriétaires,
prête à être déployée sur votre propre infrastructure.

---

## 🚀 Déploiement Rapide (5 minutes)

```bash
# 1. Transférez ce dossier sur votre VPS
scp -r liberation-pack root@VOTRE_IP:/opt/apps/

# 2. Connectez-vous et exécutez
ssh root@VOTRE_IP
cd /opt/apps/inopay
sudo ./scripts/quick-deploy.sh
```

**C'est tout!** Votre app est accessible sur http://VOTRE_IP

---

## 📖 Documentation

| Fichier | Description |
|---------|-------------|
| `DEPLOY_GUIDE.html` | Guide interactif complet |
| `SOVEREIGNTY_REPORT.md` | Détails du nettoyage effectué |
| `OPEN_SOURCE_SERVICES.md` | Guide des alternatives open source |

---

## 📁 Structure

```
inopay/
├── src/                    # Code source React
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   │   └── ai-client.ts    # Client IA configurable
│   └── ...
├── public/                 # Assets statiques
├── package.json            # Dépendances
├── vite.config.ts          # Configuration Vite
├── tailwind.config.ts      # Configuration Tailwind
├── index.html              # Point d'entrée HTML
├── Dockerfile              # Build + Nginx
├── Caddyfile               # Alternative Caddy (auto-SSL)
├── .env.example            # Variables d'environnement
├── docker-compose.yml      # Stack principale
├── docker-compose.full.yml # Stack avec tous les services
├── backend/                # API Express (depuis Edge Functions)
│   ├── src/
│   │   ├── routes/         # Routes converties
│   │   └── middleware/     # Auth middleware
│   ├── _original-edge-functions/  # Code original pour référence
│   └── Dockerfile
├── services/               # 🆕 Services Open Source optionnels
│   ├── ollama/             # IA locale (remplace OpenAI)
│   ├── meilisearch/        # Recherche (remplace Algolia)
│   └── minio/              # Stockage (remplace S3)
├── scripts/
│   └── quick-deploy.sh     # Script de déploiement automatique
├── docs/                   # Documentation
├── reports/                # Rapports d'audit
├── tests/                  # Tests générés
├── DEPLOY_GUIDE.html       # Guide interactif
├── OPEN_SOURCE_SERVICES.md # Guide des alternatives
├── SOVEREIGNTY_REPORT.md   # Rapport de nettoyage
└── README.md
```

---

## 🔧 Commandes Utiles

```bash
docker compose up -d        # Démarrer
docker compose down         # Arrêter
docker compose logs -f      # Logs temps réel
docker compose restart      # Redémarrer
docker compose ps           # Statut
```

---

## 🤖 IA Open Source

Ce pack inclut un client IA configurable supportant:
- **Ollama** (local, gratuit)
- **OpenRouter** (cloud, économique)
- **OpenAI** (si nécessaire)

Voir `OPEN_SOURCE_SERVICES.md` pour les détails.

---

## 🛡️ Souveraineté

Ce code est **100% libéré** des dépendances propriétaires:
- ✅ Aucune télémétrie
- ✅ Aucun tracking
- ✅ Aucune dépendance cloud obligatoire
- ✅ Backend auto-hébergeable
- ✅ Alternatives IA open source incluses

---

*Généré par **InoPay** - [inopay.fr](https://inopay.fr)*
*Libérez votre code, reprenez le contrôle!*
