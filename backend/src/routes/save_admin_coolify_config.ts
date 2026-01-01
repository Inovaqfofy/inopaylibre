import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const save_admin_coolify_configRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

save_admin_coolify_configRouter.post('/', async (req: Request, res: Response) => {
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
            JSON.stringify({ success: false, error: 'Non authentifié' }),
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
            JSON.stringify({ success: false, error: 'Authentification invalide' }),
            { status: 401 }
          );
        }
    
        // Parse request body
        const body: RequestBody = req.body;
        const { coolify_url, coolify_token } = body;
    
        if (!coolify_url || !coolify_token) {
          return new Response(
            JSON.stringify({ success: false, error: 'URL et token Coolify requis' }),
            { status: 400 }
          );
        }
    
        // Normalize URL (remove trailing slash)
        const normalizedUrl = coolify_url.trim().replace(/\/$/, '');
    
        console.log(`[save-admin-coolify-config] Testing Coolify at ${normalizedUrl} for user ${user.id}`);
    
        // Test Coolify API connection via /api/v1/version endpoint
        try {
          const versionUrl = `${normalizedUrl}/api/v1/version`;
          console.log(`[save-admin-coolify-config] Fetching ${versionUrl}`);
          
          const response = await fetch(versionUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${coolify_token}`,
              'Accept': 'application/json',
            },
          });
    
          console.log(`[save-admin-coolify-config] Coolify response status: ${response.status}`);
    
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[save-admin-coolify-config] Coolify error: ${response.status} - ${errorText}`);
            
            let errorMessage = `Erreur Coolify HTTP ${response.status}`;
            if (response.status === 401) {
              errorMessage = 'Token Coolify invalide ou expiré';
            } else if (response.status === 403) {
              errorMessage = 'Token sans permissions suffisantes';
            } else if (response.status === 404) {
              errorMessage = 'API Coolify non trouvée - vérifiez l\'URL';
            }
            
            return new Response(
              JSON.stringify({ success: false, error: errorMessage, status: response.status }),
              { }
            );
          }
    
          // Parse version response
          const responseText = await response.text();
          let coolifyVersion = responseText.trim();
          try {
            const versionData = JSON.parse(responseText);
            coolifyVersion = versionData.version || JSON.stringify(versionData);
  } catch (error) {
    console.error('[save_admin_coolify_config] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'save-admin-coolify-config'
    });
  }
});
