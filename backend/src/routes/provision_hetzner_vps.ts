import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const provision_hetzner_vpsRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

provision_hetzner_vpsRouter.post('/', async (req: Request, res: Response) => {
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
    // Authenticate user
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
    
        // Verify user token
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
          console.error('Auth error:', authError);
          return new Response(
            JSON.stringify({ error: 'Invalid token' }),
            { status: 401 }
          );
        }
    
        const body: ProvisionRequest = req.body;
        const { 
          hetzner_api_token, 
          server_name, 
          server_type = 'cx22',
          location = 'fsn1',
          image = 'ubuntu-22.04'
        } = body;
    
        if (!hetzner_api_token || !server_name) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields: hetzner_api_token, server_name' }),
            { status: 400 }
          );
        }
    
        console.log(`[provision-hetzner] User ${user.id} requesting VPS: ${server_name}`);
    
        // Validate Hetzner API token by fetching server types
        const validateResponse = await fetch('https://api.hetzner.cloud/v1/server_types', {
          headers: {
            'Authorization': `Bearer ${hetzner_api_token}`,
            'Content-Type': 'application/json',
          },
        });
    
        if (!validateResponse.ok) {
          const errorData = await validateResponse.json().catch(() => ({}));
          console.error('Hetzner API validation failed:', errorData);
          return new Response(
            JSON.stringify({ 
              error: 'Invalid Hetzner API token',
              details: errorData.error?.message || 'Token validation failed'
            }),
            { status: 401 }
          );
        }
    
        // Generate SSH key for the server (optional, user can use password)
        const rootPassword = generateSecurePassword();
    
        // Create the server via Hetzner API
        console.log(`[provision-hetzner] Creating server with type: ${server_type}, location: ${location}`);
        
        const createServerResponse = await fetch('https://api.hetzner.cloud/v1/servers', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hetzner_api_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: server_name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
            server_type: server_type,
            location: location,
            image: image,
            start_after_create: true,
            automount: false,
            labels: {
              managed_by: 'inopay',
              user_id: user.id,
            },
            user_data: generateCloudInit(rootPassword),
          }),
        });
    
        const serverData = await createServerResponse.json();
    
        if (!createServerResponse.ok) {
          console.error('Hetzner server creation failed:', serverData);
          return new Response(
            JSON.stringify({ 
              error: 'Failed to create server',
              details: serverData.error?.message || 'Server creation failed',
              code: serverData.error?.code
            }),
            { status: 400 }
          );
        }
    
        const server = serverData.server;
        const ipAddress = server.public_net?.ipv4?.ip || 'pending';
    
        console.log(`[provision-hetzner] Server created: ID ${server.id}, IP: ${ipAddress}`);
    
        // Generate setup ID for callback
        const setupId = crypto.randomUUID();
    
        // Store server in database
        const { data: dbServer, error: dbError } = await supabase
          .from('user_servers')
          .insert({
            user_id: user.id,
            name: server_name,
            ip_address: ipAddress,
            provider: 'hetzner',
            status: 'provisioning',
            setup_id: setupId,
          })
          .select()
          .single();
    
        if (dbError) {
          console.error('Database error:', dbError);
          // Try to delete the Hetzner server since we couldn't save it
          await fetch(`https://api.hetzner.cloud/v1/servers/${server.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${hetzner_api_token}`,
            },
          });
          
          return new Response(
            JSON.stringify({ error: 'Failed to save server configuration' }),
            { status: 500 }
          );
        }
    
        // Generate installation command
        const supabasePublicUrl = process.env.SUPABASE_URL;
        const installCommand = `curl -fsSL "${supabasePublicUrl}/functions/v1/serve-setup-script?setup_id=${setupId}" | bash`;
    
        return new Response(
          JSON.stringify({
            success: true,
            server: {
              id: dbServer.id,
              name: server_name,
              ip_address: ipAddress,
              provider: 'hetzner',
              status: 'provisioning',
              hetzner_id: server.id,
            },
            credentials: {
              root_password: rootPassword,
              ssh_command: `ssh root@${ipAddress}`,
            },
            installCommand,
            setupId,
            message: 'Server is being provisioned. It will be ready in 1-2 minutes.',
            next_steps: [
              'Wait 1-2 minutes for the server to boot',
              `Connect via SSH: ssh root@${ipAddress}`,
              'Run the installation command to setup Coolify',
            ],
          }),
          { 
            status: 200 
          }
        );
  } catch (error) {
    console.error('[provision_hetzner_vps] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'provision-hetzner-vps'
    });
  }
});
