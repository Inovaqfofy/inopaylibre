import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const validate_coolify_tokenRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

validate_coolify_tokenRouter.post('/', async (req: Request, res: Response) => {
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
    // Get auth token
        const authHeader = req.headers['Authorization'];
        if (!authHeader) {
          return new Response(
            JSON.stringify({ valid: false, error: 'Not authenticated' }),
            { status: 401 }
          );
        }
    
        // Initialize Supabase client
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);
    
        // Verify user
        const { data: { user }, error: authError } = await supabase.auth.getUser(
          authHeader.replace('Bearer ', '')
        );
    
        if (authError || !user) {
          return new Response(
            JSON.stringify({ valid: false, error: 'Invalid authentication' }),
            { status: 401 }
          );
        }
    
        // Parse request body
        const { server_id, coolify_token, coolify_url } = req.body;
    
        if (!server_id || !coolify_token || !coolify_url) {
          return new Response(
            JSON.stringify({ valid: false, error: 'Missing required parameters' }),
            { status: 400 }
          );
        }
    
        // Verify server belongs to user
        const { data: server, error: serverError } = await supabase
          .from('user_servers')
          .select('id, user_id, ip_address')
          .eq('id', server_id)
          .eq('user_id', user.id)
          .single();
    
        if (serverError || !server) {
          return new Response(
            JSON.stringify({ valid: false, error: 'Server not found or not authorized' }),
            { status: 404 }
          );
        }
    
        console.log(`Validating Coolify token for server ${server_id} at ${coolify_url}`);
    
        // Test Coolify API connection
        try {
          const healthUrl = `${coolify_url}/api/v1/version`;
          console.log(`Testing Coolify API at: ${healthUrl}`);
          
          const response = await fetch(healthUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${coolify_token}`,
              'Accept': 'application/json',
            },
          });
    
          console.log(`Coolify API response status: ${response.status}`);
    
          if (response.ok) {
            // Try to parse as JSON, fallback to text if it fails
            const responseText = await response.text();
            console.log(`Coolify response: ${responseText}`);
            
            let coolifyVersion = responseText;
            try {
              const versionData = JSON.parse(responseText);
              coolifyVersion = versionData.version || JSON.stringify(versionData);
  } catch (error) {
    console.error('[validate_coolify_token] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'validate-coolify-token'
    });
  }
});
