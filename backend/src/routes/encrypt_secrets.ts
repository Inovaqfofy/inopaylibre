import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const encrypt_secretsRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

encrypt_secretsRouter.post('/', async (req: Request, res: Response) => {
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
            JSON.stringify({ error: 'Authorization required' }),
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
    
        const { action, secret_type, secret_value, target_id } = req.body;
    
        if (action !== 'encrypt') {
          return new Response(
            JSON.stringify({ error: 'Invalid action. Use "encrypt"' }),
            { status: 400 }
          );
        }
    
        if (!secret_type || !secret_value) {
          return new Response(
            JSON.stringify({ error: 'secret_type and secret_value are required' }),
            { status: 400 }
          );
        }
    
        const masterKey = getMasterKey();
        const encryptedValue = await encryptToken(secret_value, masterKey);
    
        // Store encrypted value based on secret type
        if (secret_type === 'github_token') {
          const { error: updateError } = await supabase
            .from('user_settings')
            .upsert({
              user_id: user.id,
              github_token: encryptedValue,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });
    
          if (updateError) throw updateError;
    
          console.log('[encrypt-secrets] GitHub token encrypted and stored for user:', user.id);
        } 
        else if ((secret_type === 'coolify_token' || secret_type === 'service_role_key' || 
                  secret_type === 'anon_key' || secret_type === 'jwt_secret' || 
                  secret_type === 'db_password') && target_id) {
          // Verify server ownership
          const { data: server, error: serverError } = await supabase
            .from('user_servers')
            .select('id')
            .eq('id', target_id)
            .eq('user_id', user.id)
            .single();
    
          if (serverError || !server) {
            return new Response(
              JSON.stringify({ error: 'Server not found or access denied' }),
              { status: 404 }
            );
          }
    
          // Build the update object dynamically based on secret type
          const updateData: Record<string, string> = {
            updated_at: new Date().toISOString(),
          };
          updateData[secret_type] = encryptedValue;
    
          const { error: updateError } = await supabase
            .from('user_servers')
            .update(updateData)
            .eq('id', target_id);
    
          if (updateError) throw updateError;
    
          console.log(`[encrypt-secrets] ${secret_type} encrypted and stored for server:`, target_id);
        }
        else {
          return new Response(
            JSON.stringify({ error: 'Invalid secret_type or missing target_id for server secrets' }),
            { status: 400 }
          );
        }
    
        // Log security audit
        await supabase.from('security_audit_logs').insert({
          user_id: user.id,
          action: 'secret_encrypted',
          server_id: secret_type === 'coolify_token' ? target_id : null,
          details: {
            secret_type,
            encrypted_length: encryptedValue.length,
            timestamp: new Date().toISOString(),
          }
        });
    
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `${secret_type} encrypted and stored securely`,
            encrypted_length: encryptedValue.length,
          }),
          { status: 200 }
        );
  } catch (error) {
    console.error('[encrypt_secrets] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'encrypt-secrets'
    });
  }
});
