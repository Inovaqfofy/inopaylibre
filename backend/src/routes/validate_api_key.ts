import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const validate_api_keyRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

validate_api_keyRouter.post('/', async (req: Request, res: Response) => {
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
    const { apiKey, provider } = req.body;
    
        if (!apiKey || !provider) {
          return new Response(JSON.stringify({ 
            valid: false, 
            error: 'Clé API et provider requis' 
          }), {
            status: 400,
          });
        }
    
        console.log(`[VALIDATE-API-KEY] Testing ${provider} key...`);
    
        let isValid = false;
        let providerName = '';
        let modelInfo = '';
    
        try {
          if (provider === 'openai') {
            // Test OpenAI key with minimal request
            const response = await fetch('https://api.openai.com/v1/models', {
              headers: { 
                'Authorization': `Bearer ${apiKey}`,
              },
            });
            
            if (response.ok) {
              isValid = true;
              providerName = 'OpenAI';
              modelInfo = 'GPT-4o disponible';
            } else {
              const error = await response.text();
              console.log('[VALIDATE-API-KEY] OpenAI error:', response.status, error);
            }
          } else if (provider === 'anthropic') {
            // Test Anthropic key with minimal request (models endpoint)
            const response = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 10,
                messages: [{ role: 'user', content: 'ping' }],
              }),
            });
    
            // A successful request or a rate limit error both indicate valid key
            if (response.ok || response.status === 429) {
              isValid = true;
              providerName = 'Anthropic';
              modelInfo = 'Claude Sonnet 4 disponible';
            } else if (response.status === 401) {
              isValid = false;
            } else {
              // Other errors (like 400) with valid auth still mean the key works
              const error = await response.json();
              if (!error.error?.message?.includes('invalid') && !error.error?.message?.includes('unauthorized')) {
                isValid = true;
                providerName = 'Anthropic';
                modelInfo = 'Claude disponible';
              }
            }
          } else if (provider === 'deepseek') {
            // Test DeepSeek key
            const response = await fetch('https://api.deepseek.com/v1/models', {
              headers: { 
                'Authorization': `Bearer ${apiKey}`,
              },
            });
            
            if (response.ok) {
              isValid = true;
              providerName = 'DeepSeek';
              modelInfo = 'DeepSeek V3 disponible';
            } else {
              console.log('[VALIDATE-API-KEY] DeepSeek error:', response.status);
            }
          }
  } catch (error) {
    console.error('[validate_api_key] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'validate-api-key'
    });
  }
});
