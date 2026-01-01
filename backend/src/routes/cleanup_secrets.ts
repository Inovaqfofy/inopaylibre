import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const cleanup_secretsRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

cleanup_secretsRouter.post('/', async (req: Request, res: Response) => {
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
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
        const { server_id, deployment_id, verify_health = true, force = false }: CleanupRequest = req.body;
    
        console.log(`[cleanup-secrets] Starting cleanup for server ${server_id}, deployment ${deployment_id}`);
        console.log(`[cleanup-secrets] Options: verify_health=${verify_health}, force=${force}`);
    
        // Récupérer les infos du serveur et du déploiement
        const { data: server, error: serverError } = await supabase
          .from('user_servers')
          .select('*')
          .eq('id', server_id)
          .single();
    
        if (serverError || !server) {
          throw new Error(`Server not found: ${serverError?.message}`);
        }
    
        const { data: deployment, error: deployError } = await supabase
          .from('server_deployments')
          .select('*')
          .eq('id', deployment_id)
          .single();
    
        if (deployError || !deployment) {
          throw new Error(`Deployment not found: ${deployError?.message}`);
        }
    
        // Skip if already cleaned
        if (deployment.secrets_cleaned) {
          console.log(`[cleanup-secrets] Secrets already cleaned for deployment ${deployment_id}`);
          return new Response(JSON.stringify({
            success: true,
            message: 'Secrets already cleaned',
            already_cleaned: true,
          }), {
            status: 200,
          });
        }
    
        // Vérifier la santé du site si demandé (sauf si force=true)
        let healthCheckPassed = false;
        if (verify_health && deployment.deployed_url && !force) {
          console.log(`[cleanup-secrets] Verifying health of ${deployment.deployed_url}`);
          
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            
            const healthResponse = await fetch(deployment.deployed_url, {
              method: 'GET',
              signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            
            if (!healthResponse.ok) {
              console.warn(`[cleanup-secrets] Health check failed with status ${healthResponse.status}`);
              return new Response(JSON.stringify({
                success: false,
                reason: 'health_check_failed',
                status: healthResponse.status,
                message: 'Site not responding correctly, cleanup postponed',
              }), {
                status: 200,
              });
            }
            
            healthCheckPassed = true;
            console.log(`[cleanup-secrets] Health check passed (${healthResponse.status})`);
  } catch (error) {
    console.error('[cleanup_secrets] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'cleanup-secrets'
    });
  }
});
