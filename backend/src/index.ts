import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';

dotenv.config();

import { admin_list_paymentsRouter } from './routes/admin_list_payments';
import { admin_list_subscriptionsRouter } from './routes/admin_list_subscriptions';
import { admin_list_usersRouter } from './routes/admin_list_users';
import { admin_manage_subscriptionRouter } from './routes/admin_manage_subscription';
import { admin_manage_testerRouter } from './routes/admin_manage_tester';
import { admin_signout_allRouter } from './routes/admin_signout_all';
import { auditRouter } from './routes/audit';
import { auto_configure_coolify_appRouter } from './routes/auto_configure_coolify_app';
import { auto_fix_dockerfileRouter } from './routes/auto_fix_dockerfile';
import { auto_restart_containerRouter } from './routes/auto_restart_container';
import { check_deployment_statusRouter } from './routes/check_deployment_status';
import { check_deploymentRouter } from './routes/check_deployment';
import { check_server_statusRouter } from './routes/check_server_status';
import { check_subscriptionRouter } from './routes/check_subscription';
import { clean_codeRouter } from './routes/clean_code';
import { cleanup_coolify_orphansRouter } from './routes/cleanup_coolify_orphans';
import { cleanup_secretsRouter } from './routes/cleanup_secrets';
import { cleanup_storageRouter } from './routes/cleanup_storage';
import { compare_dockerfileRouter } from './routes/compare_dockerfile';
import { configure_databaseRouter } from './routes/configure_database';
import { convert_edge_to_backendRouter } from './routes/convert_edge_to_backend';
import { create_checkoutRouter } from './routes/create_checkout';
import { create_liberation_checkoutRouter } from './routes/create_liberation_checkout';
import { customer_portalRouter } from './routes/customer_portal';
import { decrypt_secretRouter } from './routes/decrypt_secret';
import { deploy_coolifyRouter } from './routes/deploy_coolify';
import { deploy_directRouter } from './routes/deploy_direct';
import { deploy_ftpRouter } from './routes/deploy_ftp';
import { detect_missing_env_varsRouter } from './routes/detect_missing_env_vars';
import { diff_cleanRouter } from './routes/diff_clean';
import { download_liberationRouter } from './routes/download_liberation';
import { encrypt_secretsRouter } from './routes/encrypt_secrets';
import { estimate_cleaning_costRouter } from './routes/estimate_cleaning_cost';
import { export_dataRouter } from './routes/export_data';
import { export_schemaRouter } from './routes/export_schema';
import { export_to_githubRouter } from './routes/export_to_github';
import { export_user_dataRouter } from './routes/export_user_data';
import { extract_rls_policiesRouter } from './routes/extract_rls_policies';
import { fetch_github_repoRouter } from './routes/fetch_github_repo';
import { fofy_chatRouter } from './routes/fofy_chat';
import { generate_archiveRouter } from './routes/generate_archive';
import { generate_docker_alternativesRouter } from './routes/generate_docker_alternatives';
import { get_coolify_app_detailsRouter } from './routes/get_coolify_app_details';
import { get_user_creditsRouter } from './routes/get_user_credits';
import { github_sync_webhookRouter } from './routes/github_sync_webhook';
import { global_resetRouter } from './routes/global_reset';
import { health_monitorRouter } from './routes/health_monitor';
import { import_data_to_supabaseRouter } from './routes/import_data_to_supabase';
import { inspect_github_repoRouter } from './routes/inspect_github_repo';
import { liberateRouter } from './routes/liberate';
import { list_github_reposRouter } from './routes/list_github_repos';
import { migrate_db_schemaRouter } from './routes/migrate_db_schema';
import { migrate_encrypted_secretsRouter } from './routes/migrate_encrypted_secrets';
import { migrate_schemaRouter } from './routes/migrate_schema';
import { network_diagnosticRouter } from './routes/network_diagnostic';
import { pipeline_diagnosticRouter } from './routes/pipeline_diagnostic';
import { pipeline_health_checkRouter } from './routes/pipeline_health_check';
import { pre_deploy_checkRouter } from './routes/pre_deploy_check';
import { process_project_liberationRouter } from './routes/process_project_liberation';
import { provision_hetzner_vpsRouter } from './routes/provision_hetzner_vps';
import { purge_coolify_cacheRouter } from './routes/purge_coolify_cache';
import { purge_server_deploymentsRouter } from './routes/purge_server_deployments';
import { rate_limit_newsletterRouter } from './routes/rate_limit_newsletter';
import { recover_server_credentialsRouter } from './routes/recover_server_credentials';
import { rolling_updateRouter } from './routes/rolling_update';
import { save_admin_coolify_configRouter } from './routes/save_admin_coolify_config';
import { send_emailRouter } from './routes/send_email';
import { send_liberation_reportRouter } from './routes/send_liberation_report';
import { send_liberation_successRouter } from './routes/send_liberation_success';
import { send_newsletter_welcomeRouter } from './routes/send_newsletter_welcome';
import { send_onboarding_reminderRouter } from './routes/send_onboarding_reminder';
import { send_otpRouter } from './routes/send_otp';
import { send_phone_otpRouter } from './routes/send_phone_otp';
import { send_reminder_emailsRouter } from './routes/send_reminder_emails';
import { send_welcome_emailRouter } from './routes/send_welcome_email';
import { serve_setup_scriptRouter } from './routes/serve_setup_script';
import { setup_callbackRouter } from './routes/setup_callback';
import { setup_databaseRouter } from './routes/setup_database';
import { setup_vpsRouter } from './routes/setup_vps';
import { sovereign_liberationRouter } from './routes/sovereign_liberation';
import { stripe_webhookRouter } from './routes/stripe_webhook';
import { sync_coolify_statusRouter } from './routes/sync_coolify_status';
import { test_coolify_connectionRouter } from './routes/test_coolify_connection';
import { use_creditRouter } from './routes/use_credit';
import { validate_api_keyRouter } from './routes/validate_api_key';
import { validate_coolify_tokenRouter } from './routes/validate_coolify_token';
import { validate_github_repoRouter } from './routes/validate_github_repo';
import { validate_supabase_destinationRouter } from './routes/validate_supabase_destination';
import { verify_otpRouter } from './routes/verify_otp';
import { verify_phone_otpRouter } from './routes/verify_phone_otp';
import { verify_zero_shadow_doorRouter } from './routes/verify_zero_shadow_door';
import { widget_authRouter } from './routes/widget_auth';

const app = express();
const PORT = process.env.PORT || 3000;

// Sécurité
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par fenêtre
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Routes API
app.use('/api/admin-list-payments', admin_list_paymentsRouter);
app.use('/api/admin-list-subscriptions', admin_list_subscriptionsRouter);
app.use('/api/admin-list-users', admin_list_usersRouter);
app.use('/api/admin-manage-subscription', admin_manage_subscriptionRouter);
app.use('/api/admin-manage-tester', admin_manage_testerRouter);
app.use('/api/admin-signout-all', admin_signout_allRouter);
app.use('/api/audit', auditRouter);
app.use('/api/auto-configure-coolify-app', auto_configure_coolify_appRouter);
app.use('/api/auto-fix-dockerfile', auto_fix_dockerfileRouter);
app.use('/api/auto-restart-container', auto_restart_containerRouter);
app.use('/api/check-deployment-status', check_deployment_statusRouter);
app.use('/api/check-deployment', check_deploymentRouter);
app.use('/api/check-server-status', check_server_statusRouter);
app.use('/api/check-subscription', check_subscriptionRouter);
app.use('/api/clean-code', clean_codeRouter);
app.use('/api/cleanup-coolify-orphans', cleanup_coolify_orphansRouter);
app.use('/api/cleanup-secrets', cleanup_secretsRouter);
app.use('/api/cleanup-storage', cleanup_storageRouter);
app.use('/api/compare-dockerfile', compare_dockerfileRouter);
app.use('/api/configure-database', configure_databaseRouter);
app.use('/api/convert-edge-to-backend', convert_edge_to_backendRouter);
app.use('/api/create-checkout', create_checkoutRouter);
app.use('/api/create-liberation-checkout', create_liberation_checkoutRouter);
app.use('/api/customer-portal', customer_portalRouter);
app.use('/api/decrypt-secret', decrypt_secretRouter);
app.use('/api/deploy-coolify', deploy_coolifyRouter);
app.use('/api/deploy-direct', deploy_directRouter);
app.use('/api/deploy-ftp', deploy_ftpRouter);
app.use('/api/detect-missing-env-vars', detect_missing_env_varsRouter);
app.use('/api/diff-clean', diff_cleanRouter);
app.use('/api/download-liberation', download_liberationRouter);
app.use('/api/encrypt-secrets', encrypt_secretsRouter);
app.use('/api/estimate-cleaning-cost', estimate_cleaning_costRouter);
app.use('/api/export-data', export_dataRouter);
app.use('/api/export-schema', export_schemaRouter);
app.use('/api/export-to-github', export_to_githubRouter);
app.use('/api/export-user-data', export_user_dataRouter);
app.use('/api/extract-rls-policies', extract_rls_policiesRouter);
app.use('/api/fetch-github-repo', fetch_github_repoRouter);
app.use('/api/fofy-chat', fofy_chatRouter);
app.use('/api/generate-archive', generate_archiveRouter);
app.use('/api/generate-docker-alternatives', generate_docker_alternativesRouter);
app.use('/api/get-coolify-app-details', get_coolify_app_detailsRouter);
app.use('/api/get-user-credits', get_user_creditsRouter);
app.use('/api/github-sync-webhook', github_sync_webhookRouter);
app.use('/api/global-reset', global_resetRouter);
app.use('/api/health-monitor', health_monitorRouter);
app.use('/api/import-data-to-supabase', import_data_to_supabaseRouter);
app.use('/api/inspect-github-repo', inspect_github_repoRouter);
app.use('/api/liberate', liberateRouter);
app.use('/api/list-github-repos', list_github_reposRouter);
app.use('/api/migrate-db-schema', migrate_db_schemaRouter);
app.use('/api/migrate-encrypted-secrets', migrate_encrypted_secretsRouter);
app.use('/api/migrate-schema', migrate_schemaRouter);
app.use('/api/network-diagnostic', network_diagnosticRouter);
app.use('/api/pipeline-diagnostic', pipeline_diagnosticRouter);
app.use('/api/pipeline-health-check', pipeline_health_checkRouter);
app.use('/api/pre-deploy-check', pre_deploy_checkRouter);
app.use('/api/process-project-liberation', process_project_liberationRouter);
app.use('/api/provision-hetzner-vps', provision_hetzner_vpsRouter);
app.use('/api/purge-coolify-cache', purge_coolify_cacheRouter);
app.use('/api/purge-server-deployments', purge_server_deploymentsRouter);
app.use('/api/rate-limit-newsletter', rate_limit_newsletterRouter);
app.use('/api/recover-server-credentials', recover_server_credentialsRouter);
app.use('/api/rolling-update', rolling_updateRouter);
app.use('/api/save-admin-coolify-config', save_admin_coolify_configRouter);
app.use('/api/send-email', send_emailRouter);
app.use('/api/send-liberation-report', send_liberation_reportRouter);
app.use('/api/send-liberation-success', send_liberation_successRouter);
app.use('/api/send-newsletter-welcome', send_newsletter_welcomeRouter);
app.use('/api/send-onboarding-reminder', send_onboarding_reminderRouter);
app.use('/api/send-otp', send_otpRouter);
app.use('/api/send-phone-otp', send_phone_otpRouter);
app.use('/api/send-reminder-emails', send_reminder_emailsRouter);
app.use('/api/send-welcome-email', send_welcome_emailRouter);
app.use('/api/serve-setup-script', serve_setup_scriptRouter);
app.use('/api/setup-callback', setup_callbackRouter);
app.use('/api/setup-database', setup_databaseRouter);
app.use('/api/setup-vps', setup_vpsRouter);
app.use('/api/sovereign-liberation', sovereign_liberationRouter);
app.use('/api/stripe-webhook', stripe_webhookRouter);
app.use('/api/sync-coolify-status', sync_coolify_statusRouter);
app.use('/api/test-coolify-connection', test_coolify_connectionRouter);
app.use('/api/use-credit', use_creditRouter);
app.use('/api/validate-api-key', validate_api_keyRouter);
app.use('/api/validate-coolify-token', validate_coolify_tokenRouter);
app.use('/api/validate-github-repo', validate_github_repoRouter);
app.use('/api/validate-supabase-destination', validate_supabase_destinationRouter);
app.use('/api/verify-otp', verify_otpRouter);
app.use('/api/verify-phone-otp', verify_phone_otpRouter);
app.use('/api/verify-zero-shadow-door', verify_zero_shadow_doorRouter);
app.use('/api/widget-auth', widget_authRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.path,
    availableRoutes: ['/api/admin-list-payments', '/api/admin-list-subscriptions', '/api/admin-list-users', '/api/admin-manage-subscription', '/api/admin-manage-tester', '/api/admin-signout-all', '/api/audit', '/api/auto-configure-coolify-app', '/api/auto-fix-dockerfile', '/api/auto-restart-container', '/api/check-deployment-status', '/api/check-deployment', '/api/check-server-status', '/api/check-subscription', '/api/clean-code', '/api/cleanup-coolify-orphans', '/api/cleanup-secrets', '/api/cleanup-storage', '/api/compare-dockerfile', '/api/configure-database', '/api/convert-edge-to-backend', '/api/create-checkout', '/api/create-liberation-checkout', '/api/customer-portal', '/api/decrypt-secret', '/api/deploy-coolify', '/api/deploy-direct', '/api/deploy-ftp', '/api/detect-missing-env-vars', '/api/diff-clean', '/api/download-liberation', '/api/encrypt-secrets', '/api/estimate-cleaning-cost', '/api/export-data', '/api/export-schema', '/api/export-to-github', '/api/export-user-data', '/api/extract-rls-policies', '/api/fetch-github-repo', '/api/fofy-chat', '/api/generate-archive', '/api/generate-docker-alternatives', '/api/get-coolify-app-details', '/api/get-user-credits', '/api/github-sync-webhook', '/api/global-reset', '/api/health-monitor', '/api/import-data-to-supabase', '/api/inspect-github-repo', '/api/liberate', '/api/list-github-repos', '/api/migrate-db-schema', '/api/migrate-encrypted-secrets', '/api/migrate-schema', '/api/network-diagnostic', '/api/pipeline-diagnostic', '/api/pipeline-health-check', '/api/pre-deploy-check', '/api/process-project-liberation', '/api/provision-hetzner-vps', '/api/purge-coolify-cache', '/api/purge-server-deployments', '/api/rate-limit-newsletter', '/api/recover-server-credentials', '/api/rolling-update', '/api/save-admin-coolify-config', '/api/send-email', '/api/send-liberation-report', '/api/send-liberation-success', '/api/send-newsletter-welcome', '/api/send-onboarding-reminder', '/api/send-otp', '/api/send-phone-otp', '/api/send-reminder-emails', '/api/send-welcome-email', '/api/serve-setup-script', '/api/setup-callback', '/api/setup-database', '/api/setup-vps', '/api/sovereign-liberation', '/api/stripe-webhook', '/api/sync-coolify-status', '/api/test-coolify-connection', '/api/use-credit', '/api/validate-api-key', '/api/validate-coolify-token', '/api/validate-github-repo', '/api/validate-supabase-destination', '/api/verify-otp', '/api/verify-phone-otp', '/api/verify-zero-shadow-door', '/api/widget-auth']
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📂 Available routes:`);
  console.log(`   - /api/admin-list-payments`);
  console.log(`   - /api/admin-list-subscriptions`);
  console.log(`   - /api/admin-list-users`);
  console.log(`   - /api/admin-manage-subscription`);
  console.log(`   - /api/admin-manage-tester`);
  console.log(`   - /api/admin-signout-all`);
  console.log(`   - /api/audit`);
  console.log(`   - /api/auto-configure-coolify-app`);
  console.log(`   - /api/auto-fix-dockerfile`);
  console.log(`   - /api/auto-restart-container`);
  console.log(`   - /api/check-deployment-status`);
  console.log(`   - /api/check-deployment`);
  console.log(`   - /api/check-server-status`);
  console.log(`   - /api/check-subscription`);
  console.log(`   - /api/clean-code`);
  console.log(`   - /api/cleanup-coolify-orphans`);
  console.log(`   - /api/cleanup-secrets`);
  console.log(`   - /api/cleanup-storage`);
  console.log(`   - /api/compare-dockerfile`);
  console.log(`   - /api/configure-database`);
  console.log(`   - /api/convert-edge-to-backend`);
  console.log(`   - /api/create-checkout`);
  console.log(`   - /api/create-liberation-checkout`);
  console.log(`   - /api/customer-portal`);
  console.log(`   - /api/decrypt-secret`);
  console.log(`   - /api/deploy-coolify`);
  console.log(`   - /api/deploy-direct`);
  console.log(`   - /api/deploy-ftp`);
  console.log(`   - /api/detect-missing-env-vars`);
  console.log(`   - /api/diff-clean`);
  console.log(`   - /api/download-liberation`);
  console.log(`   - /api/encrypt-secrets`);
  console.log(`   - /api/estimate-cleaning-cost`);
  console.log(`   - /api/export-data`);
  console.log(`   - /api/export-schema`);
  console.log(`   - /api/export-to-github`);
  console.log(`   - /api/export-user-data`);
  console.log(`   - /api/extract-rls-policies`);
  console.log(`   - /api/fetch-github-repo`);
  console.log(`   - /api/fofy-chat`);
  console.log(`   - /api/generate-archive`);
  console.log(`   - /api/generate-docker-alternatives`);
  console.log(`   - /api/get-coolify-app-details`);
  console.log(`   - /api/get-user-credits`);
  console.log(`   - /api/github-sync-webhook`);
  console.log(`   - /api/global-reset`);
  console.log(`   - /api/health-monitor`);
  console.log(`   - /api/import-data-to-supabase`);
  console.log(`   - /api/inspect-github-repo`);
  console.log(`   - /api/liberate`);
  console.log(`   - /api/list-github-repos`);
  console.log(`   - /api/migrate-db-schema`);
  console.log(`   - /api/migrate-encrypted-secrets`);
  console.log(`   - /api/migrate-schema`);
  console.log(`   - /api/network-diagnostic`);
  console.log(`   - /api/pipeline-diagnostic`);
  console.log(`   - /api/pipeline-health-check`);
  console.log(`   - /api/pre-deploy-check`);
  console.log(`   - /api/process-project-liberation`);
  console.log(`   - /api/provision-hetzner-vps`);
  console.log(`   - /api/purge-coolify-cache`);
  console.log(`   - /api/purge-server-deployments`);
  console.log(`   - /api/rate-limit-newsletter`);
  console.log(`   - /api/recover-server-credentials`);
  console.log(`   - /api/rolling-update`);
  console.log(`   - /api/save-admin-coolify-config`);
  console.log(`   - /api/send-email`);
  console.log(`   - /api/send-liberation-report`);
  console.log(`   - /api/send-liberation-success`);
  console.log(`   - /api/send-newsletter-welcome`);
  console.log(`   - /api/send-onboarding-reminder`);
  console.log(`   - /api/send-otp`);
  console.log(`   - /api/send-phone-otp`);
  console.log(`   - /api/send-reminder-emails`);
  console.log(`   - /api/send-welcome-email`);
  console.log(`   - /api/serve-setup-script`);
  console.log(`   - /api/setup-callback`);
  console.log(`   - /api/setup-database`);
  console.log(`   - /api/setup-vps`);
  console.log(`   - /api/sovereign-liberation`);
  console.log(`   - /api/stripe-webhook`);
  console.log(`   - /api/sync-coolify-status`);
  console.log(`   - /api/test-coolify-connection`);
  console.log(`   - /api/use-credit`);
  console.log(`   - /api/validate-api-key`);
  console.log(`   - /api/validate-coolify-token`);
  console.log(`   - /api/validate-github-repo`);
  console.log(`   - /api/validate-supabase-destination`);
  console.log(`   - /api/verify-otp`);
  console.log(`   - /api/verify-phone-otp`);
  console.log(`   - /api/verify-zero-shadow-door`);
  console.log(`   - /api/widget-auth`);
});

export default app;
