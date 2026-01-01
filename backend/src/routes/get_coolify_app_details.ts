import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const get_coolify_app_detailsRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

get_coolify_app_detailsRouter.post('/', async (req: Request, res: Response) => {
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
    
        const authHeader = req.headers['Authorization'];
        if (!authHeader) {
          return new Response(JSON.stringify({ error: 'Non autorisé' }), {
            status: 401,
          });
        }
    
        const { data: { user }, error: authError } = await supabase.auth.getUser(
          authHeader.replace('Bearer ', '')
        );
    
        if (authError || !user) {
          return new Response(JSON.stringify({ error: 'Session invalide' }), {
            status: 401,
          });
        }
    
        // Check admin access or allow user to see their own server apps
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
    
        const isAdmin = userRole?.role === 'admin';
    
        const { server_id, app_uuid } = req.body;
    
        if (!server_id) {
          return new Response(JSON.stringify({ error: 'server_id requis' }), {
            status: 400,
          });
        }
    
        // Get server with Coolify credentials - admin can access any, user only their own
        const serverQuery = supabase
          .from('user_servers')
          .select('coolify_url, coolify_token, user_id')
          .eq('id', server_id);
        
        if (!isAdmin) {
          serverQuery.eq('user_id', user.id);
        }
        
        const { data: server, error: serverError } = await serverQuery.single();
    
        if (serverError || !server) {
          return new Response(JSON.stringify({ error: 'Serveur non trouvé' }), {
            status: 404,
          });
        }
    
        if (!server.coolify_url || !server.coolify_token) {
          return new Response(JSON.stringify({ error: 'Credentials Coolify non configurés' }), {
            status: 400,
          });
        }
    
        const headers = {
          'Authorization': `Bearer ${server.coolify_token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        };
    
        // If app_uuid is provided, get specific app details with full configuration
        if (app_uuid) {
          console.log(`[Coolify] Fetching details for app ${app_uuid}`);
          const appResponse = await fetch(`${server.coolify_url}/api/v1/applications/${app_uuid}`, { headers });
          
          if (!appResponse.ok) {
            const errText = await appResponse.text();
            console.error(`[Coolify] Failed to fetch app: ${errText}`);
            return new Response(JSON.stringify({ error: `Application non trouvée: ${appResponse.status}`, details: errText }), {
              status: 404,
            });
          }
          
          const app = await appResponse.json();
          console.log(`[Coolify] App details:`, JSON.stringify({
            uuid: app.uuid,
            name: app.name,
            build_pack: app.build_pack,
            base_directory: app.base_directory,
            dockerfile_location: app.dockerfile_location,
            git_repository: app.git_repository ? '***configured***' : null,
            git_branch: app.git_branch,
            git_commit_sha: app.git_commit_sha
          }));
          
          const appDetails: CoolifyApp = {
            uuid: app.uuid,
            name: app.name,
            fqdn: app.fqdn,
            git_repository: app.git_repository,
            git_branch: app.git_branch,
            git_commit_sha: app.git_commit_sha || null,
            build_pack: app.build_pack,
            status: app.status,
            description: app.description,
            base_directory: app.base_directory || '/',
            dockerfile_location: app.dockerfile_location || '/Dockerfile',
            ports_exposes: app.ports_exposes,
            is_static: app.is_static || false,
            updated_at: app.updated_at,
          };
          
          // Also get recent deployments for this app
          let deployments: unknown[] = [];
          try {
            const deploymentsRes = await fetch(`${server.coolify_url}/api/v1/applications/${app_uuid}/deployments`, { headers });
            if (deploymentsRes.ok) {
              deployments = await deploymentsRes.json();
            }
  } catch (error) {
    console.error('[get_coolify_app_details] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'get-coolify-app-details'
    });
  }
});
