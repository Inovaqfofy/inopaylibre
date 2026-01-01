# 🔌 Backend API (Converti depuis Edge Functions)

## 📊 Statistiques de conversion

| Métrique | Valeur |
|----------|--------|
| Edge Functions converties | 92 |
| Routes générées | 92 |
| Taux de préservation moyen | 100% |

## 🚀 Démarrage rapide

```bash
cd backend
npm install
npm run dev
```

## 📂 Routes API

- `/api/admin-list-payments`
- `/api/admin-list-subscriptions`
- `/api/admin-list-users`
- `/api/admin-manage-subscription`
- `/api/admin-manage-tester`
- `/api/admin-signout-all`
- `/api/audit`
- `/api/auto-configure-coolify-app`
- `/api/auto-fix-dockerfile`
- `/api/auto-restart-container`
- `/api/check-deployment-status`
- `/api/check-deployment`
- `/api/check-server-status`
- `/api/check-subscription`
- `/api/clean-code`
- `/api/cleanup-coolify-orphans`
- `/api/cleanup-secrets`
- `/api/cleanup-storage`
- `/api/compare-dockerfile`
- `/api/configure-database`
- `/api/convert-edge-to-backend`
- `/api/create-checkout`
- `/api/create-liberation-checkout`
- `/api/customer-portal`
- `/api/decrypt-secret`
- `/api/deploy-coolify`
- `/api/deploy-direct`
- `/api/deploy-ftp`
- `/api/detect-missing-env-vars`
- `/api/diff-clean`
- `/api/download-liberation`
- `/api/encrypt-secrets`
- `/api/estimate-cleaning-cost`
- `/api/export-data`
- `/api/export-schema`
- `/api/export-to-github`
- `/api/export-user-data`
- `/api/extract-rls-policies`
- `/api/fetch-github-repo`
- `/api/fofy-chat`
- `/api/generate-archive`
- `/api/generate-docker-alternatives`
- `/api/get-coolify-app-details`
- `/api/get-user-credits`
- `/api/github-sync-webhook`
- `/api/global-reset`
- `/api/health-monitor`
- `/api/import-data-to-supabase`
- `/api/inspect-github-repo`
- `/api/liberate`
- `/api/list-github-repos`
- `/api/migrate-db-schema`
- `/api/migrate-encrypted-secrets`
- `/api/migrate-schema`
- `/api/network-diagnostic`
- `/api/pipeline-diagnostic`
- `/api/pipeline-health-check`
- `/api/pre-deploy-check`
- `/api/process-project-liberation`
- `/api/provision-hetzner-vps`
- `/api/purge-coolify-cache`
- `/api/purge-server-deployments`
- `/api/rate-limit-newsletter`
- `/api/recover-server-credentials`
- `/api/rolling-update`
- `/api/save-admin-coolify-config`
- `/api/send-email`
- `/api/send-liberation-report`
- `/api/send-liberation-success`
- `/api/send-newsletter-welcome`
- `/api/send-onboarding-reminder`
- `/api/send-otp`
- `/api/send-phone-otp`
- `/api/send-reminder-emails`
- `/api/send-welcome-email`
- `/api/serve-setup-script`
- `/api/setup-callback`
- `/api/setup-database`
- `/api/setup-vps`
- `/api/sovereign-liberation`
- `/api/stripe-webhook`
- `/api/sync-coolify-status`
- `/api/test-coolify-connection`
- `/api/use-credit`
- `/api/validate-api-key`
- `/api/validate-coolify-token`
- `/api/validate-github-repo`
- `/api/validate-supabase-destination`
- `/api/verify-otp`
- `/api/verify-phone-otp`
- `/api/verify-zero-shadow-door`
- `/api/widget-auth`

## 🔧 Structure

```
backend/
├── src/
│   ├── index.ts           # Point d'entrée Express
│   ├── routes/            # Routes converties
│   ├── middleware/        # Auth et autres middlewares
│   └── __tests__/         # Tests unitaires
├── _original-edge-functions/  # Code Deno original (référence)
├── package.json
├── tsconfig.json
└── Dockerfile
```

## ⚠️ Points à vérifier

1. **Environnement**: Copiez `.env.example` vers `.env` et remplissez les valeurs
2. **Base de données**: Vérifiez que `DATABASE_URL` pointe vers votre PostgreSQL
3. **Secrets**: Assurez-vous que tous les secrets sont configurés

## 📝 TODOs manuels

Certaines conversions peuvent nécessiter des ajustements manuels. 
Recherchez `// TODO` dans les fichiers de routes.

---
*Généré automatiquement par InoPay Liberation Pack*
