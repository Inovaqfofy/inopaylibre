import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const rolling_updateRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

rolling_updateRouter.post('/', async (req: Request, res: Response) => {
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
    const supabaseAdmin = createClient(
          process.env.SUPABASE_URL ?? '',
          process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
        );
    
        const { deployment_id, sync_config_id, history_id } = req.body;
    
        console.log(`[rolling-update] Starting deployment for ${deployment_id}`);
    
        // Fetch deployment details
        const { data: deployment, error: deploymentError } = await supabaseAdmin
          .from('server_deployments')
          .select('*, user_servers(*)')
          .eq('id', deployment_id)
          .single();
    
        if (deploymentError || !deployment) {
          throw new Error('Deployment not found');
        }
    
        const server = deployment.user_servers;
        if (!server?.coolify_url || !server?.coolify_token) {
          throw new Error('Server not configured with Coolify');
        }
    
        const coolifyUrl = server.coolify_url.replace(/\/$/, '');
        const coolifyToken = server.coolify_token;
    
        // Check if we have a Coolify app UUID
        if (!deployment.coolify_app_uuid) {
          console.log('[rolling-update] No Coolify app UUID, skipping deployment');
          
          if (history_id) {
            await supabaseAdmin
              .from('sync_history')
              .update({
                status: 'completed',
                error_message: 'No Coolify application linked',
                completed_at: new Date().toISOString(),
              })
              .eq('id', history_id);
          }
    
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'No Coolify application linked' 
          }), {,
          });
        }
    
        // Get current application status
        const statusResponse = await fetch(
          `${coolifyUrl}/api/v1/applications/${deployment.coolify_app_uuid}`,
          {
            headers: {
              'Authorization': `Bearer ${coolifyToken}`,
              'Accept': 'application/json',
            },
          }
        );
    
        if (!statusResponse.ok) {
          throw new Error(`Failed to get app status: ${statusResponse.status}`);
        }
    
        const appStatus = await statusResponse.json();
        console.log(`[rolling-update] Current app status: ${appStatus.status}`);
    
        // Trigger deployment via Coolify API
        const deployResponse = await fetch(
          `${coolifyUrl}/api/v1/applications/${deployment.coolify_app_uuid}/restart`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${coolifyToken}`,
              'Accept': 'application/json',
            },
          }
        );
    
        if (!deployResponse.ok) {
          const errorText = await deployResponse.text();
          console.error('[rolling-update] Coolify deploy error:', errorText);
          
          // Update history with error
          if (history_id) {
            await supabaseAdmin
              .from('sync_history')
              .update({
                status: 'failed',
                error_message: `Coolify deployment failed: ${errorText}`,
                completed_at: new Date().toISOString(),
              })
              .eq('id', history_id);
          }
    
          // Update sync config
          await supabaseAdmin
            .from('sync_configurations')
            .update({
              last_sync_status: 'failed',
              last_sync_error: `Deployment failed: ${errorText}`,
            })
            .eq('id', sync_config_id);
    
          throw new Error(`Coolify deployment failed: ${errorText}`);
        }
    
        console.log('[rolling-update] Deployment triggered successfully');
    
        // Wait a bit then check health
        await new Promise(resolve => setTimeout(resolve, 5000));
    
        // Health check
        let healthOk = false;
        let retries = 0;
        const maxRetries = 6; // 30 seconds max
    
        while (!healthOk && retries < maxRetries) {
          try {
            const healthResponse = await fetch(
              `${coolifyUrl}/api/v1/applications/${deployment.coolify_app_uuid}`,
              {
                headers: {
                  'Authorization': `Bearer ${coolifyToken}`,
                  'Accept': 'application/json',
                },
              }
            );
    
            if (healthResponse.ok) {
              const status = await healthResponse.json();
              if (status.status === 'running') {
                healthOk = true;
                console.log('[rolling-update] Application is healthy');
              }
            }
  } catch (error) {
    console.error('[rolling_update] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'rolling-update'
    });
  }
});
