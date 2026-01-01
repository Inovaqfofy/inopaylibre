import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const setup_databaseRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

setup_databaseRouter.post('/', async (req: Request, res: Response) => {
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
    
        const { server_id } = req.body;
    
        if (!server_id) {
          return new Response(
            JSON.stringify({ error: 'server_id is required' }),
            { status: 400 }
          );
        }
    
        console.log(`[setup-database] Starting database setup for server: ${server_id}`);
    
        // Get server info
        const { data: server, error: serverError } = await supabase
          .from('user_servers')
          .select('*')
          .eq('id', server_id)
          .eq('user_id', user.id)
          .single();
    
        if (serverError || !server) {
          console.error('[setup-database] Server not found:', serverError);
          return new Response(
            JSON.stringify({ error: 'Server not found' }),
            { status: 404 }
          );
        }
    
        if (server.status !== 'ready') {
          return new Response(
            JSON.stringify({ error: 'Server is not ready' }),
            { status: 400 }
          );
        }
    
        // FIXED: Check if database is ALREADY set up by the bash script (setup-callback)
        // This avoids creating a duplicate PostgreSQL instance
        if (server.db_status === 'ready' && server.db_password) {
          console.log('[setup-database] Database already configured by installation script');
          
          // Generate security keys if not already present
          let needsUpdate = false;
          const updateFields: Record<string, unknown> = {};
          
          if (!server.jwt_secret) {
            updateFields.jwt_secret = generateJWTSecret();
            needsUpdate = true;
          }
          if (!server.anon_key) {
            updateFields.anon_key = generateSecureKey(48);
            needsUpdate = true;
          }
          if (!server.service_role_key) {
            updateFields.service_role_key = generateSecureKey(48);
            needsUpdate = true;
          }
          
          if (needsUpdate) {
            await supabase
              .from('user_servers')
              .update(updateFields)
              .eq('id', server.id);
            console.log('[setup-database] Generated missing security keys');
          }
          
          return new Response(
            JSON.stringify({
              success: true,
              message: 'Database already configured by installation script',
              database: {
                host: server.db_host,
                port: server.db_port,
                name: server.db_name,
                status: server.db_status
              },
              secrets_generated: {
                jwt_secret: needsUpdate && !!updateFields.jwt_secret,
                anon_key: needsUpdate && !!updateFields.anon_key,
                service_role_key: needsUpdate && !!updateFields.service_role_key
              }
            }),
            { }
          );
        }
        
        // If db_status is 'ready' but no password (edge case), skip Coolify creation too
        if (server.db_url && server.db_host) {
          console.log('[setup-database] Database URL exists, skipping creation');
          return new Response(
            JSON.stringify({
              success: true,
              message: 'Database already configured',
              database: {
                host: server.db_host,
                port: server.db_port,
                name: server.db_name,
                status: server.db_status || 'unknown'
              }
            }),
            { }
          );
        }
    
        // Check Coolify configuration for creating new database
        if (!server.coolify_url || !server.coolify_token) {
          return new Response(
            JSON.stringify({ error: 'Server Coolify configuration is incomplete. Cannot create database via Coolify API.' }),
            { status: 400 }
          );
        }
    
        // Update status
        await supabase
          .from('user_servers')
          .update({ db_status: 'creating' })
          .eq('id', server.id);
    
        const coolifyHeaders = {
          'Authorization': `Bearer ${server.coolify_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };
    
        try {
          // Step 1: Create a project for databases if not exists
          console.log('[setup-database] Creating databases project in Coolify...');
          
          const projectResponse = await fetch(`${server.coolify_url}/api/v1/projects`, {
            method: 'POST',
            headers: coolifyHeaders,
            body: JSON.stringify({
              name: 'inopay-databases',
              description: 'PostgreSQL databases for Inopay projects'
            })
          });
    
          let projectUuid: string;
          if (projectResponse.ok) {
            const projectData = await projectResponse.json();
            projectUuid = projectData.uuid;
            console.log('[setup-database] Database project created:', projectUuid);
          } else {
            // Try to find existing project
            const listResponse = await fetch(`${server.coolify_url}/api/v1/projects`, {
              method: 'GET',
              headers: coolifyHeaders
            });
            
            if (listResponse.ok) {
              const projects = await listResponse.json();
              const existingProject = projects.find((p: any) => p.name === 'inopay-databases');
              if (existingProject) {
                projectUuid = existingProject.uuid;
                console.log('[setup-database] Using existing database project:', projectUuid);
              } else {
                throw new Error('Failed to create or find database project');
              }
            } else {
              throw new Error('Failed to list projects');
            }
          }
    
          // Step 2: Generate secure credentials
          const dbName = 'inopay_production';
          const dbUser = 'inopay_user';
          const dbPassword = generateSecureKey(32);
          const jwtSecret = generateJWTSecret();
          const anonKey = generateSecureKey(48);
          const serviceRoleKey = generateSecureKey(48);
    
          console.log('[setup-database] Creating PostgreSQL service...');
    
          // Step 3: Create PostgreSQL database via Coolify API
          const dbPayload = {
            type: 'postgresql',
            name: 'inopay-postgresql',
            description: 'PostgreSQL database for Inopay projects',
            project_uuid: projectUuid,
            server_uuid: '0', // Local server
            environment_name: 'production',
            postgres_user: dbUser,
            postgres_password: dbPassword,
            postgres_db: dbName,
            is_public: false,
            public_port: null
          };
    
          const dbResponse = await fetch(`${server.coolify_url}/api/v1/databases/postgresql`, {
            method: 'POST',
            headers: coolifyHeaders,
            body: JSON.stringify(dbPayload)
          });
    
          if (!dbResponse.ok) {
            const errorText = await dbResponse.text();
            console.error('[setup-database] Database creation failed:', errorText);
            
            // Try alternative method - create via service
            const servicePayload = {
              type: 'postgresql-15',
              name: 'inopay-postgresql',
              project_uuid: projectUuid,
              server_uuid: '0',
              environment_name: 'production'
            };
    
            const serviceResponse = await fetch(`${server.coolify_url}/api/v1/services`, {
              method: 'POST',
              headers: coolifyHeaders,
              body: JSON.stringify(servicePayload)
            });
    
            if (!serviceResponse.ok) {
              throw new Error(`Failed to create database: ${errorText}`);
            }
          }
    
          const dbData = await dbResponse.json();
          console.log('[setup-database] PostgreSQL database created:', dbData);
    
          // Step 4: Start the database
          if (dbData.uuid) {
            await fetch(`${server.coolify_url}/api/v1/databases/${dbData.uuid}/start`, {
              method: 'GET',
              headers: coolifyHeaders
            });
          }
    
          // Build the database URL
          const dbHost = server.ip_address;
          const dbPort = 5432;
          const dbUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
    
          // Step 5: Update server with database credentials
          const { error: updateError } = await supabase
            .from('user_servers')
            .update({
              db_host: dbHost,
              db_port: dbPort,
              db_name: dbName,
              db_user: dbUser,
              db_password: dbPassword,
              db_url: dbUrl,
              jwt_secret: jwtSecret,
              anon_key: anonKey,
              service_role_key: serviceRoleKey,
              db_status: 'ready'
            })
            .eq('id', server.id);
    
          if (updateError) {
            console.error('[setup-database] Failed to update server credentials:', updateError);
            throw new Error('Failed to save database credentials');
          }
    
          console.log('[setup-database] Database setup complete');
    
          return new Response(
            JSON.stringify({
              success: true,
              message: 'Database created successfully',
              database: {
                host: dbHost,
                port: dbPort,
                name: dbName,
                user: dbUser,
                status: 'ready'
              },
              secrets_generated: {
                jwt_secret: true,
                anon_key: true,
                service_role_key: true
              }
            }),
            { }
          );
  } catch (error) {
    console.error('[setup_database] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'setup-database'
    });
  }
});
