import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const network_diagnosticRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

network_diagnosticRouter.post('/', async (req: Request, res: Response) => {
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
    const authHeader = req.headers['Authorization'];
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: 'Authorization required' }),
            { status: 401 }
          );
        }
    
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
        // Verify admin role
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
          return new Response(
            JSON.stringify({ error: 'Invalid token' }),
            { status: 401 }
          );
        }
    
        // Check if user is admin
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
    
        if (!roleData || roleData.role !== 'admin') {
          return new Response(
            JSON.stringify({ error: 'Admin access required' }),
            { status: 403 }
          );
        }
    
        const { vpsIp, coolifyUrl, coolifyToken } = req.body;
        const results: DiagnosticResult[] = [];
    
        // 1. Test Supabase Database
        console.log('[Diagnostic] Testing Supabase connection...');
        const supabaseStart = Date.now();
        try {
          const { data, error } = await supabase.from('user_roles').select('count').limit(1);
          const latency = Date.now() - supabaseStart;
          
          if (error) {
            results.push({
              service: 'Supabase Database',
              status: 'error',
              latency,
              message: 'Connexion échouée',
              details: error.message
            });
          } else {
            results.push({
              service: 'Supabase Database',
              status: 'ok',
              latency,
              message: 'Base de données accessible'
            });
          }
  } catch (error) {
    console.error('[network_diagnostic] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'network-diagnostic'
    });
  }
});
