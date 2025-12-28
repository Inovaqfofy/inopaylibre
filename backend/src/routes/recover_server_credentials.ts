import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const recover_server_credentialsRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

recover_server_credentialsRouter.post('/', async (req: Request, res: Response) => {
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
    
        // Get authorization header
        const authHeader = req.headers['Authorization'];
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 401 }
          );
        }
    
        // Verify the user
        const { data: { user }, error: authError } = await supabase.auth.getUser(
          authHeader.replace('Bearer ', '')
        );
    
        if (authError || !user) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
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
    
        // Get the server
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
    
        console.log(`[recover-server-credentials] Attempting to recover credentials for server ${server_id}`);
        console.log(`[recover-server-credentials] Server IP: ${server.ip_address}`);
    
        // For now, we'll generate a new setup_id to allow the user to re-run the installation script
        // This is a fallback mechanism when automatic credential recovery fails
        const newSetupId = crypto.randomUUID();
    
        // Update the server with a new setup_id
        const { error: updateError } = await supabase
          .from('user_servers')
          .update({
            setup_id: newSetupId,
            status: server.status === 'ready' ? 'ready' : 'pending', // Keep ready if already ready
            updated_at: new Date().toISOString()
          })
          .eq('id', server_id);
    
        if (updateError) {
          console.error('[recover-server-credentials] Update error:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to prepare credential recovery' }),
            { status: 500 }
          );
        }
    
        // Generate the recovery command
        const recoveryCommand = `curl -fsSL ${supabaseUrl}/functions/v1/serve-setup-script?id=${newSetupId} | bash`;
    
        console.log(`[recover-server-credentials] Recovery prepared for server ${server_id}`);
    
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Pour récupérer les credentials, exécutez ce script sur votre serveur:',
            recovery_command: recoveryCommand,
            setup_id: newSetupId,
            instructions: [
              '1. Connectez-vous en SSH à votre serveur',
              `2. Exécutez: ${recoveryCommand}`,
              '3. Le script renverra les credentials à Inopay automatiquement'
            ]
          }),
          { }
        );
  } catch (error) {
    console.error('[recover_server_credentials] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'recover-server-credentials'
    });
  }
});
