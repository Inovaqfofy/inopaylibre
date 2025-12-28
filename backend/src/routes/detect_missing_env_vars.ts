import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const detect_missing_env_varsRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

detect_missing_env_varsRouter.post('/', async (req: Request, res: Response) => {
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
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
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
    
        const { server_id, app_uuid, auto_fix = false } = req.body;
    
        if (!server_id || !app_uuid) {
          return new Response(JSON.stringify({ error: 'server_id et app_uuid requis' }), {
            status: 400,
          });
        }
    
        // Get server with Coolify credentials
        const { data: server, error: serverError } = await supabase
          .from('user_servers')
          .select('coolify_url, coolify_token')
          .eq('id', server_id)
          .eq('user_id', user.id)
          .single();
    
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
    
        // Normalize Coolify URL
        let coolifyUrl = server.coolify_url.trim();
        if (!coolifyUrl.startsWith('http://') && !coolifyUrl.startsWith('https://')) {
          coolifyUrl = `http://${coolifyUrl}`;
        }
        coolifyUrl = coolifyUrl.replace(/\/+$/, '');
        if (!coolifyUrl.includes(':8000') && !coolifyUrl.includes(':443')) {
          const urlObj = new URL(coolifyUrl);
          if (urlObj.protocol === 'http:') {
            urlObj.port = '8000';
          }
          coolifyUrl = urlObj.toString().replace(/\/+$/, '');
        }
    
        const headers = {
          'Authorization': `Bearer ${server.coolify_token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        };
    
        // Step 1: Fetch current env vars from Coolify
        console.log(`[detect-missing-env-vars] Fetching env vars for app ${app_uuid}`);
        const envsResponse = await fetch(`${coolifyUrl}/api/v1/applications/${app_uuid}/envs`, { headers });
    
        if (!envsResponse.ok) {
          const errText = await envsResponse.text();
          console.error(`[detect-missing-env-vars] Failed to fetch envs: ${errText}`);
          return new Response(JSON.stringify({ error: `Impossible de récupérer les variables: ${envsResponse.status}` }), {
            status: envsResponse.status,
          });
        }
    
        const currentEnvs: EnvVar[] = await envsResponse.json();
        console.log(`[detect-missing-env-vars] Found ${currentEnvs.length} existing env vars`);
    
        // Create a map of existing env vars
        const existingKeys = new Set(currentEnvs.map(e => e.key));
    
        // Step 2: Detect missing required env vars
        const missingRequired: MissingEnvVar[] = [];
        const missingOptional: MissingEnvVar[] = [];
    
        for (const envDef of REQUIRED_ENV_VARS) {
          if (!existingKeys.has(envDef.key)) {
            // Check for alternate keys
            if (envDef.key === 'VITE_SUPABASE_PUBLISHABLE_KEY' && existingKeys.has('VITE_SUPABASE_ANON_KEY')) {
              continue; // Has the alternate key
            }
            if (envDef.key === 'VITE_SUPABASE_ANON_KEY' && existingKeys.has('VITE_SUPABASE_PUBLISHABLE_KEY')) {
              continue; // Has the alternate key
            }
    
            let suggestedValue: string | undefined;
            
            // Suggest values from our environment
            if (envDef.key === 'VITE_SUPABASE_URL') {
              suggestedValue = supabaseUrl;
            } else if (envDef.key === 'VITE_SUPABASE_PUBLISHABLE_KEY' || envDef.key === 'VITE_SUPABASE_ANON_KEY') {
              suggestedValue = supabaseAnonKey;
            }
    
            missingRequired.push({
              ...envDef,
              suggestedValue
            });
          }
        }
    
        for (const envDef of OPTIONAL_ENV_VARS) {
          if (!existingKeys.has(envDef.key)) {
            missingOptional.push({
              ...envDef,
              required: false,
              suggestedValue: (envDef as { defaultValue?: string }).defaultValue
            });
          }
        }
    
        // Step 3: Auto-fix if requested
        const fixedVars: string[] = [];
        const failedVars: { key: string; error: string }[] = [];
    
        if (auto_fix && missingRequired.length > 0) {
          console.log(`[detect-missing-env-vars] Auto-fixing ${missingRequired.length} missing env vars`);
          
          for (const envVar of missingRequired) {
            if (!envVar.suggestedValue) {
              failedVars.push({ key: envVar.key, error: 'Pas de valeur suggérée' });
              continue;
            }
    
            try {
              const addEnvRes = await fetch(`${coolifyUrl}/api/v1/applications/${app_uuid}/envs`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  key: envVar.key,
                  value: envVar.suggestedValue,
                  is_build_time: envVar.isBuildTime,
                  is_preview: false
                })
              });
    
              if (addEnvRes.ok) {
                fixedVars.push(envVar.key);
                console.log(`[detect-missing-env-vars] Added ${envVar.key}`);
              } else {
                const errText = await addEnvRes.text();
                failedVars.push({ key: envVar.key, error: errText.slice(0, 100) });
                console.error(`[detect-missing-env-vars] Failed to add ${envVar.key}: ${errText}`);
              }
  } catch (error) {
    console.error('[detect_missing_env_vars] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'detect-missing-env-vars'
    });
  }
});
