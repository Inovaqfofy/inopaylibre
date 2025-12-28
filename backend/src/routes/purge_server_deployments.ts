import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const purge_server_deploymentsRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

purge_server_deploymentsRouter.post('/', async (req: Request, res: Response) => {
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
    
        // Auth
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
    
        const { server_id } = req.body;
    
        if (!server_id) {
          return new Response(
            JSON.stringify({ error: 'server_id is required' }),
            { status: 400 }
          );
        }
    
        // Verify server belongs to user
        const { data: server, error: serverError } = await supabase
          .from('user_servers')
          .select('id, coolify_url, coolify_token')
          .eq('id', server_id)
          .eq('user_id', user.id)
          .single();
    
        if (serverError || !server) {
          return new Response(
            JSON.stringify({ error: 'Server not found' }),
            { status: 404 }
          );
        }
    
        // Get all deployments for this server
        const { data: deployments, error: deploymentsError } = await supabase
          .from('server_deployments')
          .select('id, coolify_app_uuid, project_name, status')
          .eq('server_id', server_id)
          .eq('user_id', user.id);
    
        if (deploymentsError) {
          console.error('[purge-deployments] Error fetching deployments:', deploymentsError);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch deployments' }),
            { status: 500 }
          );
        }
    
        console.log(`[purge-deployments] Found ${deployments?.length || 0} deployments to purge`);
    
        // Also delete from Coolify if we have credentials
        let coolifyDeleted = 0;
        if (server.coolify_url && server.coolify_token && deployments) {
          const coolifyHeaders = {
            'Authorization': `Bearer ${server.coolify_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          };
    
          for (const dep of deployments) {
            if (dep.coolify_app_uuid) {
              try {
                console.log(`[purge-deployments] Deleting Coolify app: ${dep.coolify_app_uuid}`);
                const deleteResponse = await fetch(
                  `${server.coolify_url}/api/v1/applications/${dep.coolify_app_uuid}`,
                  { method: 'DELETE', headers: coolifyHeaders }
                );
                if (deleteResponse.ok) {
                  coolifyDeleted++;
                  console.log(`[purge-deployments] Deleted Coolify app: ${dep.coolify_app_uuid}`);
                } else {
                  console.log(`[purge-deployments] Failed to delete app: ${await deleteResponse.text()}`);
                }
  } catch (error) {
    console.error('[purge_server_deployments] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'purge-server-deployments'
    });
  }
});
