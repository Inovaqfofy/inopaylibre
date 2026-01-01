import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const compare_dockerfileRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

compare_dockerfileRouter.post('/', async (req: Request, res: Response) => {
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
    
        const { server_id, github_repo_url, coolify_app_uuid } = req.body;
    
        if (!server_id || !github_repo_url) {
          return new Response(
            JSON.stringify({ error: 'server_id and github_repo_url required' }),
            { status: 400 }
          );
        }
    
        console.log(`[compare-dockerfile] Comparing for ${github_repo_url}`);
    
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
    
        const result: DockerfileComparison = {
          github_content: null,
          coolify_content: null,
          is_synced: false,
          differences: [],
          github_analysis: { is_valid: false },
          coolify_analysis: { is_valid: false }
        };
    
        // 1. Fetch Dockerfile from GitHub
        const urlMatch = github_repo_url.match(/github\.com[/:]([^/]+)\/([^/.#?\s]+)/i);
        if (urlMatch) {
          const [, owner, repo] = urlMatch;
          const repoClean = repo.replace(/\.git$/, '');
          const githubToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
          
          const githubHeaders: Record<string, string> = {
            'Accept': 'application/vnd.github.v3.raw',
            'User-Agent': 'Inopay-Deployer'
          };
          if (githubToken) {
            githubHeaders['Authorization'] = `Bearer ${githubToken}`;
          }
    
          try {
            // Get default branch
            const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repoClean}`, {
              headers: { ...githubHeaders, 'Accept': 'application/vnd.github.v3+json' }
            });
            let branch = 'main';
            if (repoRes.ok) {
              const repoData = await repoRes.json();
              branch = repoData.default_branch || 'main';
            }
    
            const dockerfileRes = await fetch(
              `https://api.github.com/repos/${owner}/${repoClean}/contents/Dockerfile?ref=${branch}`,
              { headers: githubHeaders }
            );
            
            if (dockerfileRes.ok) {
              result.github_content = await dockerfileRes.text();
              const analysis = analyzeDockerfile(result.github_content);
              result.github_analysis = {
                copy_package_line: analysis.copyPackageLine,
                npm_install_line: analysis.npmInstallLine,
                is_valid: analysis.isValid
              };
            }
  } catch (error) {
    console.error('[compare_dockerfile] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'compare-dockerfile'
    });
  }
});
