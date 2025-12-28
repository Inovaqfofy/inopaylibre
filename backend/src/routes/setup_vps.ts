import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const setup_vpsRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

setup_vpsRouter.post('/', async (req: Request, res: Response) => {
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
    
        const { name, ip_address, provider } = req.body;
    
        if (!name || !ip_address) {
          return new Response(
            JSON.stringify({ error: 'Name and IP address are required' }),
            { status: 400 }
          );
        }
    
        // Generate unique setup ID
        const setupId = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    
        // Create server entry in database
        const { data: server, error: insertError } = await supabase
          .from('user_servers')
          .insert({
            user_id: user.id,
            name,
            ip_address,
            provider: provider || 'other',
            setup_id: setupId,
            status: 'pending'
          })
          .select()
          .single();
    
        if (insertError) {
          console.error('Insert error:', insertError);
          return new Response(
            JSON.stringify({ error: 'Failed to create server entry' }),
            { status: 500 }
          );
        }
    
        // Generate the installation script URL
        const scriptUrl = `${supabaseUrl}/functions/v1/serve-setup-script?id=${setupId}`;
        
        // Installation command for the user
        const installCommand = `curl -sSL "${scriptUrl}" | bash`;
    
        console.log(`Created server setup for user ${user.id}, setup_id: ${setupId}`);
    
        return new Response(
          JSON.stringify({
            success: true,
            server,
            setupId,
            installCommand,
            instructions: [
              "1. Connectez-vous à votre VPS via SSH",
              `2. Exécutez cette commande : ${installCommand}`,
              "3. Patientez 3-5 minutes pendant l'installation",
              "4. Inopay détectera automatiquement quand Coolify sera prêt"
            ]
          }),
          { }
        );
  } catch (error) {
    console.error('[setup_vps] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'setup-vps'
    });
  }
});
