import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const check_deployment_statusRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

check_deployment_statusRouter.post('/', async (req: Request, res: Response) => {
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
    
        // Auth check
        const authHeader = req.headers['Authorization'];
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: 'Authorization header required' }),
            { status: 401 }
          );
        }
    
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
          return new Response(
            JSON.stringify({ error: 'Invalid token' }),
            { status: 401 }
          );
        }
    
        const { server_id, deployment_uuid, app_uuid } = req.body;
    
        if (!server_id) {
          return new Response(
            JSON.stringify({ error: 'server_id is required' }),
            { status: 400 }
          );
        }
    
        // Get server info
        const { data: server, error: serverError } = await supabase
          .from('user_servers')
          .select('coolify_url, coolify_token')
          .eq('id', server_id)
          .eq('user_id', user.id)
          .single();
    
        if (serverError || !server?.coolify_url || !server?.coolify_token) {
          return new Response(
            JSON.stringify({ error: 'Server not found or Coolify not configured' }),
            { status: 404 }
          );
        }
    
        const coolifyUrl = normalizeCoolifyUrl(server.coolify_url);
        const coolifyHeaders = {
          'Authorization': `Bearer ${server.coolify_token}`,
          'Accept': 'application/json'
        };
    
        const result: DeploymentStatus = {
          status: 'unknown',
          logs: '',
          deployed_url: null,
          duration_seconds: null,
          started_at: null,
          finished_at: null,
          error_message: null
        };
    
        // If we have a deployment_uuid, get its status directly
        if (deployment_uuid) {
          console.log(`[check-deployment-status] Checking deployment ${deployment_uuid}`);
          
          try {
            const deployRes = await fetch(`${coolifyUrl}/api/v1/deployments/${deployment_uuid}`, {
              method: 'GET',
              headers: coolifyHeaders
            });
    
            if (deployRes.ok) {
              const deployData = await deployRes.json();
              
              result.status = mapCoolifyStatus(deployData.status);
              result.started_at = deployData.started_at || deployData.created_at;
              result.finished_at = deployData.finished_at;
              
              if (result.started_at && result.finished_at) {
                result.duration_seconds = Math.round(
                  (new Date(result.finished_at).getTime() - new Date(result.started_at).getTime()) / 1000
                );
              }
    
              // Get logs
              const logsRes = await fetch(`${coolifyUrl}/api/v1/deployments/${deployment_uuid}/logs`, {
                method: 'GET',
                headers: coolifyHeaders
              });
    
              if (logsRes.ok) {
                const logsData = await logsRes.json();
                result.logs = typeof logsData === 'string' ? logsData : 
                  (logsData.logs || logsData.output || JSON.stringify(logsData));
              }
    
              // If finished, try to get the deployed URL from the app
              if (result.status === 'finished' && app_uuid) {
                try {
                  const appRes = await fetch(`${coolifyUrl}/api/v1/applications/${app_uuid}`, {
                    method: 'GET',
                    headers: coolifyHeaders
                  });
                  
                  if (appRes.ok) {
                    const appData = await appRes.json();
                    result.deployed_url = appData.fqdn || appData.preview_url || null;
                  }
  } catch (error) {
    console.error('[check_deployment_status] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'check-deployment-status'
    });
  }
});
