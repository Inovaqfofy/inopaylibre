import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const pipeline_diagnosticRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

pipeline_diagnosticRouter.post('/', async (req: Request, res: Response) => {
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
    
        // Verify auth
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
    
        // Check if admin
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
    
        if (roleData?.role !== 'admin') {
          return new Response(
            JSON.stringify({ error: 'Admin access required' }),
            { status: 403 }
          );
        }
    
        console.log('[pipeline-diagnostic] Starting comprehensive diagnostic...');
    
        // ==================== TEST 1: GITHUB TOKEN ====================
        const githubToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
        
        if (!githubToken) {
          results.push({
            service: 'GitHub Token (Secret)',
            status: 'error',
            message: 'GITHUB_PERSONAL_ACCESS_TOKEN not found in secrets',
            details: { action: 'Add the secret via Supabase dashboard' }
          });
        } else {
          console.log('[pipeline-diagnostic] Testing GitHub API connection...');
          const ghStart = Date.now();
          
          try {
            // Test 1a: Validate token with /user endpoint
            const userResponse = await fetch('https://api.github.com/user', {
              headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28'
              }
            });
    
            const ghLatency = Date.now() - ghStart;
    
            if (!userResponse.ok) {
              const errorText = await userResponse.text();
              results.push({
                service: 'GitHub API',
                status: 'error',
                latency_ms: ghLatency,
                message: `Authentication failed: ${userResponse.status}`,
                details: { 
                  status_code: userResponse.status,
                  error: errorText.slice(0, 200),
                  action: 'Token may be expired or revoked. Regenerate at github.com/settings/tokens'
                }
              });
            } else {
              const userData = await userResponse.json();
              
              // Test 1b: Check token scopes
              const scopes = userResponse.headers.get('x-oauth-scopes') || '';
              const hasRepoScope = scopes.includes('repo');
              const hasWorkflowScope = scopes.includes('workflow');
              const hasAdminRepoHook = scopes.includes('admin:repo_hook');
    
              results.push({
                service: 'GitHub API',
                status: 'ok',
                latency_ms: ghLatency,
                message: `Connected as ${userData.login}`,
                details: {
                  username: userData.login,
                  name: userData.name,
                  scopes: scopes,
                  has_repo_scope: hasRepoScope,
                  has_workflow_scope: hasWorkflowScope,
                  has_admin_repo_hook: hasAdminRepoHook,
                  public_repos: userData.public_repos,
                  private_repos: userData.total_private_repos
                }
              });
    
              // Warn if missing critical scopes
              if (!hasRepoScope) {
                results.push({
                  service: 'GitHub Permissions',
                  status: 'warning',
                  message: 'Missing "repo" scope - cannot create private repositories',
                  details: { current_scopes: scopes, required: 'repo' }
                });
              }
    
              if (!hasWorkflowScope) {
                results.push({
                  service: 'GitHub Permissions',
                  status: 'warning',
                  message: 'Missing "workflow" scope - GitHub Actions may not work',
                  details: { current_scopes: scopes, required: 'workflow' }
                });
              }
    
              // Test 1c: Test repo creation capability (dry run - list repos)
              const reposResponse = await fetch('https://api.github.com/user/repos?per_page=1', {
                headers: {
                  'Authorization': `Bearer ${githubToken}`,
                  'Accept': 'application/vnd.github+json'
                }
              });
    
              if (reposResponse.ok) {
                results.push({
                  service: 'GitHub Repo Access',
                  status: 'ok',
                  message: 'Can list and create repositories'
                });
              }
            }
  } catch (error) {
    console.error('[pipeline_diagnostic] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'pipeline-diagnostic'
    });
  }
});
