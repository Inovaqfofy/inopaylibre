import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const sync_coolify_statusRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

sync_coolify_statusRouter.post('/', async (req: Request, res: Response) => {
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
          return new Response(JSON.stringify({ error: 'Authorization required' }), {
            status: 401,
          });
        }
    
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
          return new Response(JSON.stringify({ error: 'Invalid token' }), {
            status: 401,
          });
        }
    
        const { deployment_id } = req.body;
    
        if (!deployment_id) {
          return new Response(JSON.stringify({ error: 'deployment_id required' }), {
            status: 400,
          });
        }
    
        console.log(`[sync-coolify-status] Syncing deployment ${deployment_id} for user ${user.id}`);
    
        // Fetch deployment with server info
        const { data: deployment, error: deployError } = await supabase
          .from('server_deployments')
          .select('*, user_servers(*)')
          .eq('id', deployment_id)
          .eq('user_id', user.id)
          .maybeSingle();
    
        if (deployError || !deployment) {
          console.error('[sync-coolify-status] Deployment not found:', deployError);
          return new Response(JSON.stringify({ error: 'Deployment not found' }), {
            status: 404,
          });
        }
    
        const server = deployment.user_servers;
        if (!server?.coolify_url || !server?.coolify_token) {
          return new Response(JSON.stringify({ error: 'Server not configured with Coolify' }), {
            status: 400,
          });
        }
    
        const coolifyUrl = server.coolify_url.replace(/\/$/, '');
        const coolifyHeaders = {
          'Authorization': `Bearer ${server.coolify_token}`,
          'Content-Type': 'application/json',
        };
    
        let appData = null;
        let coolifyStatus = 'unknown';
        let appNotFoundInCoolify = false;
        let foundAppUuid = deployment.coolify_app_uuid;
    
        console.log(`[sync-coolify-status] Checking app UUID: ${deployment.coolify_app_uuid}`);
    
        // Try to fetch app from Coolify using stored UUID
        if (deployment.coolify_app_uuid) {
          const appResponse = await fetch(`${coolifyUrl}/api/v1/applications/${deployment.coolify_app_uuid}`, {
            headers: coolifyHeaders,
          });
    
          if (appResponse.status === 401 || appResponse.status === 403) {
            console.error('[sync-coolify-status] Coolify auth error:', appResponse.status);
            return new Response(JSON.stringify({ 
              error: 'Token Coolify invalide ou expiré',
              details: `HTTP ${appResponse.status}` 
            }), {
              status: 401,
            });
          }
    
          if (!appResponse.ok) {
            const errorText = await appResponse.text();
            console.log('[sync-coolify-status] App not found by UUID, will search by repo:', errorText);
            appNotFoundInCoolify = true;
          } else {
            appData = await appResponse.json();
            console.log('[sync-coolify-status] App found by UUID, status:', appData.status);
            coolifyStatus = appData.status || 'unknown';
          }
        } else {
          appNotFoundInCoolify = true;
        }
    
        // If app not found by UUID, try to find it by searching all applications
        if (appNotFoundInCoolify && deployment.github_repo_url) {
          console.log('[sync-coolify-status] Searching apps by repo:', deployment.github_repo_url);
          
          try {
            const appsResponse = await fetch(`${coolifyUrl}/api/v1/applications`, {
              headers: coolifyHeaders,
            });
    
            if (appsResponse.ok) {
              const allApps = await appsResponse.json();
              console.log(`[sync-coolify-status] Found ${allApps.length} apps in Coolify`);
    
              // Search for matching app by git_repository or name
              const matchingApp = allApps.find((app: { git_repository?: string; name?: string; uuid?: string }) => {
                const repoMatch = app.git_repository && 
                  deployment.github_repo_url?.includes(app.git_repository.replace('.git', ''));
                const nameMatch = app.name && 
                  app.name.toLowerCase().includes(deployment.project_name.toLowerCase());
                return repoMatch || nameMatch;
              });
    
              if (matchingApp) {
                console.log(`[sync-coolify-status] Found matching app: ${matchingApp.uuid} (${matchingApp.name})`);
                foundAppUuid = matchingApp.uuid;
                appNotFoundInCoolify = false;
                
                // Fetch full app details
                const fullAppResponse = await fetch(`${coolifyUrl}/api/v1/applications/${matchingApp.uuid}`, {
                  headers: coolifyHeaders,
                });
                
                if (fullAppResponse.ok) {
                  appData = await fullAppResponse.json();
                  coolifyStatus = appData.status || 'unknown';
                  
                  // Update the stored UUID in database
                  await supabase
                    .from('server_deployments')
                    .update({ coolify_app_uuid: matchingApp.uuid })
                    .eq('id', deployment_id);
                  
                  console.log(`[sync-coolify-status] Updated coolify_app_uuid to ${matchingApp.uuid}`);
                }
              } else {
                console.log('[sync-coolify-status] No matching app found in Coolify');
              }
            }
  } catch (error) {
    console.error('[sync_coolify_status] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'sync-coolify-status'
    });
  }
});
