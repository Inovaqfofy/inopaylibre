import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const deploy_directRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

deploy_directRouter.post('/', async (req: Request, res: Response) => {
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
    console.log(`[deploy-direct] Cleanup attempt ${attempt}/${maxRetries}`);
          
          const cleanupResponse = await fetch(
            `${supabaseUrl}/functions/v1/cleanup-secrets`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                server_id: serverId,
                deployment_id: deploymentId,
                verify_health: true,
              }),
            }
          );
          
          const cleanupResult = await cleanupResponse.json();
          console.log(`[deploy-direct] Cleanup result:`, cleanupResult);
          
          if (cleanupResult.success) {
            console.log(`[deploy-direct] Cleanup successful on attempt ${attempt}`);
            return;
          }
          
          // If health check failed, wait and retry
          if (cleanupResult.reason === 'health_check_failed' || cleanupResult.reason === 'health_check_error') {
            console.log(`[deploy-direct] Health check not ready, waiting before retry...`);
            await new Promise(resolve => setTimeout(resolve, 15000 * attempt));
          }
  } catch (error) {
    console.error('[deploy_direct] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'deploy-direct'
    });
  }
});
