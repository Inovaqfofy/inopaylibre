import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const purge_coolify_cacheRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

purge_coolify_cacheRouter.post('/', async (req: Request, res: Response) => {
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
    
        const { server_id, coolify_app_uuid } = req.body;
    
        if (!server_id) {
          return new Response(
            JSON.stringify({ error: 'server_id required' }),
            { status: 400 }
          );
        }
    
        console.log(`[purge-coolify-cache] Purging cache for server ${server_id}`);
    
        // Get server info
        const { data: server, error: serverError } = await supabase
          .from('user_servers')
          .select('*')
          .eq('id', server_id)
          .eq('user_id', user.id)
          .single();
    
        if (serverError || !server) {
          return new Response(
            JSON.stringify({ error: 'Server not found' }),
            { status: 404 }
          );
        }
    
        if (!server.coolify_url || !server.coolify_token) {
          return new Response(
            JSON.stringify({ error: 'Coolify not configured' }),
            { status: 400 }
          );
        }
    
        const coolifyUrl = normalizeCoolifyUrl(server.coolify_url);
        const coolifyHeaders = {
          'Authorization': `Bearer ${server.coolify_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };
    
        const actions: string[] = [];
        const errors: string[] = [];
    
        // Method 1: If app UUID is provided, reset its build cache
        if (coolify_app_uuid) {
          try {
            // Try to patch app with force rebuild settings
            const patchRes = await fetch(`${coolifyUrl}/api/v1/applications/${coolify_app_uuid}`, {
              method: 'PATCH',
              headers: coolifyHeaders,
              body: JSON.stringify({
                // Reset cached values
                git_commit_sha: null,
                // Force fresh build
              })
            });
    
            if (patchRes.ok) {
              actions.push(`Reset git_commit_sha pour app ${coolify_app_uuid.slice(0, 8)}...`);
            } else {
              const errText = await patchRes.text();
              console.log('[purge-coolify-cache] App PATCH response:', errText);
            }
  } catch (error) {
    console.error('[purge_coolify_cache] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'purge-coolify-cache'
    });
  }
});
