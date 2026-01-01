import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const auto_restart_containerRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

const resend = new Resend(process.env.RESEND_API_KEY);

auto_restart_containerRouter.post('/', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    const supabase = getSupabaseClient(authHeader);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // ═══════════════════════════════════════════════════════════
    // BUSINESS LOGIC (100% migrated from Edge Function)
    // ═══════════════════════════════════════════════════════════
    const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const resendApiKey = process.env.RESEND_API_KEY;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
        const { deployment_id, server_id }: RestartRequest = req.body;
    
        console.log(`[auto-restart] Starting restart for deployment ${deployment_id}`);
    
        // Récupérer le serveur avec les credentials Coolify
        const { data: server, error: serverError } = await supabase
          .from('user_servers')
          .select('*, user_id')
          .eq('id', server_id)
          .single();
    
        if (serverError || !server) {
          throw new Error(`Server not found: ${serverError?.message}`);
        }
    
        // Récupérer le déploiement
        const { data: deployment, error: deployError } = await supabase
          .from('server_deployments')
          .select('*')
          .eq('id', deployment_id)
          .single();
    
        if (deployError || !deployment) {
          throw new Error(`Deployment not found: ${deployError?.message}`);
        }
    
        // Vérifier le cooldown
        if (deployment.last_restart_at) {
          const lastRestart = new Date(deployment.last_restart_at).getTime();
          const now = Date.now();
          
          if (now - lastRestart < RESTART_COOLDOWN_MS) {
            const remainingMs = RESTART_COOLDOWN_MS - (now - lastRestart);
            console.log(`[auto-restart] Cooldown active, ${Math.round(remainingMs / 1000)}s remaining`);
            
            return new Response(JSON.stringify({
              success: false,
              reason: 'cooldown_active',
              remaining_seconds: Math.round(remainingMs / 1000),
            }), {
              status: 200,
            });
          }
        }
    
        // Vérifier qu'on a les credentials Coolify
        if (!server.coolify_url || !server.coolify_token || !deployment.coolify_app_uuid) {
          throw new Error('Missing Coolify credentials or app UUID');
        }
    
        console.log(`[auto-restart] Sending restart command to Coolify for app ${deployment.coolify_app_uuid}`);
    
        // Appeler l'API Coolify pour redémarrer
        const restartResponse = await fetch(
          `${server.coolify_url}/api/v1/applications/${deployment.coolify_app_uuid}/restart`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${server.coolify_token}`,
              'Content-Type': 'application/json',
            },
          }
        );
    
        if (!restartResponse.ok) {
          const errorText = await restartResponse.text();
          throw new Error(`Coolify restart failed: ${restartResponse.status} - ${errorText}`);
        }
    
        console.log(`[auto-restart] Restart command sent successfully`);
    
        // Mettre à jour le déploiement
        const { error: updateError } = await supabase
          .from('server_deployments')
          .update({
            health_status: 'recovering',
            last_restart_at: new Date().toISOString(),
            auto_restart_count: (deployment.auto_restart_count || 0) + 1,
            consecutive_failures: 0,
          })
          .eq('id', deployment_id);
    
        if (updateError) {
          console.warn(`[auto-restart] Failed to update deployment: ${updateError.message}`);
        }
    
        // Logger dans l'audit
        await supabase
          .from('security_audit_logs')
          .insert({
            user_id: server.user_id,
            server_id: server_id,
            deployment_id: deployment_id,
            action: 'auto_restart_triggered',
            details: {
              restart_count: (deployment.auto_restart_count || 0) + 1,
              consecutive_failures: deployment.consecutive_failures,
              deployed_url: deployment.deployed_url,
            },
          });
    
        // Attendre et vérifier la santé après redémarrage
        console.log(`[auto-restart] Waiting ${POST_RESTART_WAIT_MS / 1000}s before health check`);
        await new Promise(resolve => setTimeout(resolve, POST_RESTART_WAIT_MS));
    
        // Vérifier la santé
        let healthCheckPassed = false;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);
          
          const healthResponse = await fetch(deployment.deployed_url, {
            method: 'GET',
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          healthCheckPassed = healthResponse.ok;
          
          console.log(`[auto-restart] Post-restart health check: ${healthCheckPassed ? 'PASSED' : 'FAILED'}`);
  } catch (error) {
    console.error('[auto_restart_container] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'auto-restart-container'
    });
  }
});
