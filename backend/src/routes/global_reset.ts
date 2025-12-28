import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const global_resetRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

global_resetRouter.post('/', async (req: Request, res: Response) => {
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
    
        // Auth - Admin only
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
    
        // Check admin role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();
    
        if (!roleData) {
          console.log(`[global-reset] Unauthorized: user ${user.id} is not admin`);
          return new Response(
            JSON.stringify({ error: 'Admin role required' }),
            { status: 403 }
          );
        }
    
        const options: ResetOptions = req.body;
        const { reset_coolify, reset_database, reset_github, dry_run = false } = options;
    
        console.log(`[global-reset] Starting reset - dry_run: ${dry_run}, options:`, options);
    
        const result: ResetResult = {
          success: true,
          dry_run,
          coolify: { apps_deleted: 0, projects_deleted: 0, servers_processed: 0, errors: [] },
          database: {
            server_deployments: 0,
            sync_configurations: 0,
            sync_history: 0,
            deployment_history: 0,
            projects_analysis: 0,
            cleaning_cache: 0,
            cleaning_estimates: 0,
            health_check_logs: 0,
            errors: []
          },
          github: { repos_deleted: 0, errors: [] },
          audit_log_id: null
        };
    
        // 1. Reset Coolify (delete all apps and projects from all servers)
        if (reset_coolify) {
          console.log('[global-reset] Starting Coolify reset...');
          
          const { data: servers } = await supabase
            .from('user_servers')
            .select('id, coolify_url, coolify_token, name');
    
          if (servers && servers.length > 0) {
            for (const server of servers) {
              if (!server.coolify_url || !server.coolify_token) continue;
              result.coolify.servers_processed++;
    
              const coolifyHeaders = {
                'Authorization': `Bearer ${server.coolify_token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              };
    
              try {
                // Get all applications
                const appsResponse = await fetch(`${server.coolify_url}/api/v1/applications`, {
                  headers: coolifyHeaders
                });
    
                if (appsResponse.ok) {
                  const apps = await appsResponse.json();
                  console.log(`[global-reset] Found ${apps.length} apps on server ${server.name}`);
                  
                  for (const app of apps) {
                    if (!dry_run) {
                      try {
                        await fetch(`${server.coolify_url}/api/v1/applications/${app.uuid}`, {
                          method: 'DELETE',
                          headers: coolifyHeaders
                        });
                        result.coolify.apps_deleted++;
                        console.log(`[global-reset] Deleted app: ${app.name || app.uuid}`);
  } catch (error) {
    console.error('[global_reset] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'global-reset'
    });
  }
});
