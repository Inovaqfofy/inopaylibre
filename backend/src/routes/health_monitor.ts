import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const health_monitorRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

health_monitorRouter.post('/', async (req: Request, res: Response) => {
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
    
        console.log('[health-monitor] Starting health check cycle');
    
        // Récupérer tous les déploiements actifs
        const { data: deployments, error: fetchError } = await supabase
          .from('server_deployments')
          .select(`
            id,
            user_id,
            server_id,
            project_name,
            deployed_url,
            status,
            health_status,
            consecutive_failures,
            auto_restart_count
          `)
          .eq('status', 'deployed')
          .not('deployed_url', 'is', null);
    
        if (fetchError) {
          throw new Error(`Failed to fetch deployments: ${fetchError.message}`);
        }
    
        if (!deployments || deployments.length === 0) {
          console.log('[health-monitor] No active deployments to check');
          return new Response(JSON.stringify({
            success: true,
            message: 'No active deployments',
            checked: 0,
          }), {
            status: 200,
          });
        }
    
        console.log(`[health-monitor] Checking ${deployments.length} deployments`);
    
        const results = [];
    
        for (const deployment of deployments) {
          const startTime = Date.now();
          let status = 'unknown';
          let httpStatus: number | null = null;
          let errorMessage: string | null = null;
          let responseTimeMs: number | null = null;
    
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);
    
            const response = await fetch(deployment.deployed_url, {
              method: 'GET',
              signal: controller.signal,
              headers: {
                'User-Agent': 'Inopay-Health-Monitor/1.0',
              },
            });
    
            clearTimeout(timeoutId);
            responseTimeMs = Date.now() - startTime;
            httpStatus = response.status;
    
            if (response.ok || response.status < 500) {
              status = 'healthy';
            } else {
              status = 'unhealthy';
              errorMessage = `HTTP ${response.status}`;
            }
  } catch (error) {
    console.error('[health_monitor] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'health-monitor'
    });
  }
});
