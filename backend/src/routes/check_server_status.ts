import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const check_server_statusRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

check_server_statusRouter.post('/', async (req: Request, res: Response) => {
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
    
        // Get user from auth header
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
    
        // If already ready, just return the status
        if (server.status === 'ready') {
          return new Response(
            JSON.stringify({ 
              status: 'ready',
              coolify_url: server.coolify_url,
              server 
            }),
            { }
          );
        }
    
        // Try to check if Coolify is accessible
        const coolifyUrl = `http://${server.ip_address}:8000`;
        
        try {
          const healthCheck = await fetch(`${coolifyUrl}/api/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });
    
          if (healthCheck.ok) {
            // Coolify is up! Update status
            await supabase
              .from('user_servers')
              .update({
                status: 'ready',
                coolify_url: coolifyUrl
              })
              .eq('id', server.id);
    
            return new Response(
              JSON.stringify({ 
                status: 'ready',
                coolify_url: coolifyUrl,
                message: 'Coolify est maintenant accessible'
              }),
              { }
            );
          }
  } catch (error) {
    console.error('[check_server_status] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'check-server-status'
    });
  }
});
