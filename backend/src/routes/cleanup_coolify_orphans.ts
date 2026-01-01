import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const cleanup_coolify_orphansRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

cleanup_coolify_orphansRouter.post('/', async (req: Request, res: Response) => {
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
    
        const { server_id, delete_failed_deployments = false } = req.body;
    
        if (!server_id) {
          return new Response(
            JSON.stringify({ error: 'server_id is required' }),
            { status: 400 }
          );
        }
    
        // Get server info
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
    
        if (!server.coolify_url || !server.coolify_token) {
          return new Response(
            JSON.stringify({ error: 'Server Coolify configuration is incomplete' }),
            { status: 400 }
          );
        }
    
        const coolifyHeaders = {
          'Authorization': `Bearer ${server.coolify_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };
    
        console.log('[cleanup-coolify-orphans] Starting cleanup for server:', server_id);
    
        // Get all deployed project names from our database
        const { data: deployments } = await supabase
          .from('server_deployments')
          .select('project_name, coolify_app_uuid, status')
          .eq('server_id', server_id)
          .eq('user_id', user.id);
    
        const activeProjectNames = new Set(
          (deployments || [])
            .filter(d => d.status === 'deployed' || d.status === 'success')
            .map(d => d.project_name)
        );
    
        console.log('[cleanup-coolify-orphans] Active project names:', Array.from(activeProjectNames));
    
        // Get all Coolify projects
        const projectsResponse = await fetch(`${server.coolify_url}/api/v1/projects`, {
          method: 'GET',
          headers: coolifyHeaders
        });
    
        if (!projectsResponse.ok) {
          const errorText = await projectsResponse.text();
          throw new Error(`Failed to fetch Coolify projects: ${errorText}`);
        }
    
        const coolifyProjects = await projectsResponse.json();
        console.log('[cleanup-coolify-orphans] Coolify projects found:', coolifyProjects.length);
    
        // Find orphan projects (in Coolify but not in active deployments)
        const orphanProjects = coolifyProjects.filter(
          (p: { name: string; uuid: string }) => !activeProjectNames.has(p.name)
        );
    
        console.log('[cleanup-coolify-orphans] Orphan projects to delete:', orphanProjects.length);
    
        const deletedProjects: string[] = [];
        const failedDeletions: { name: string; error: string }[] = [];
    
        // Delete orphan projects from Coolify
        for (const project of orphanProjects) {
          try {
            console.log(`[cleanup-coolify-orphans] Deleting orphan project: ${project.name} (${project.uuid})`);
            const deleteResponse = await fetch(`${server.coolify_url}/api/v1/projects/${project.uuid}`, {
              method: 'DELETE',
              headers: coolifyHeaders
            });
    
            if (deleteResponse.ok) {
              deletedProjects.push(project.name);
              console.log(`[cleanup-coolify-orphans] Successfully deleted: ${project.name}`);
            } else {
              const errorText = await deleteResponse.text();
              failedDeletions.push({ name: project.name, error: errorText });
              console.error(`[cleanup-coolify-orphans] Failed to delete ${project.name}:`, errorText);
            }
  } catch (error) {
    console.error('[cleanup_coolify_orphans] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'cleanup-coolify-orphans'
    });
  }
});
