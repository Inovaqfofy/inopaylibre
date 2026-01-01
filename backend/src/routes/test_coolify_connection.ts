import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const test_coolify_connectionRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

test_coolify_connectionRouter.post('/', async (req: Request, res: Response) => {
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
    
        console.log(`[test-coolify-connection] Testing Coolify at ${normalizedUrl}`);
    
        // Test Coolify API connection via /api/v1/applications endpoint
        try {
          const appsUrl = `${normalizedUrl}/api/v1/applications`;
          console.log(`[test-coolify-connection] Fetching ${appsUrl}`);
          
          const response = await fetch(appsUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${coolify_token}`,
              'Accept': 'application/json',
            },
          });
    
          console.log(`[test-coolify-connection] Response status: ${response.status}`);
    
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[test-coolify-connection] Error: ${response.status} - ${errorText}`);
            
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
    
          const apps = await response.json();
          const appsCount = Array.isArray(apps) ? apps.length : 0;
    
          // Look for an inopay app
          interface CoolifyApp {
            name?: string;
            git_repository?: string;
            fqdn?: string;
          }
          
          const inopayApp = (apps as CoolifyApp[]).find((app: CoolifyApp) => 
            app.name?.toLowerCase().includes('inopay') ||
            app.git_repository?.includes('inopay')
          );
    
          console.log(`[test-coolify-connection] Found ${appsCount} apps, inopay: ${inopayApp?.name || 'none'}`);
    
          return new Response(
            JSON.stringify({
              success: true,
              apps_count: appsCount,
              inopay_app: inopayApp?.name || null,
              app_url: inopayApp?.fqdn || null
            }),
            { }
          );
  } catch (error) {
    console.error('[test_coolify_connection] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'test-coolify-connection'
    });
  }
});
