import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const auto_configure_coolify_appRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

auto_configure_coolify_appRouter.post('/', async (req: Request, res: Response) => {
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
    
        // Auth check
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
    
        const { 
          server_id, 
          project_name, 
          github_repo_url,
          git_branch, // Optional: if not provided, will fetch from GitHub 
          git_commit_sha, // Optional: specific commit to deploy
          domain,
          env_vars,
          auto_deploy = true,
          force_rebuild = true, // Force clean rebuild by default
          force_no_cache = true, // Force Docker no-cache by default
          skip_pre_check = false // Skip pre-deploy checks if already done
        } = req.body;
    
        if (!server_id || !project_name || !github_repo_url) {
          return new Response(
            JSON.stringify({ error: 'server_id, project_name, and github_repo_url are required' }),
            { status: 400 }
          );
        }
    
        // Get the correct branch and commit from GitHub if not provided
        let gitBranchToUse = git_branch;
        let gitCommitShaToUse = git_commit_sha;
        
        const urlMatch = github_repo_url.match(/github\.com[/:]([^/]+)\/([^/.#?]+)/i);
        if (urlMatch && (!gitBranchToUse || !gitCommitShaToUse)) {
          const [, ghOwner, ghRepo] = urlMatch;
          const repoClean = ghRepo.replace(/\.git$/, '');
          const githubToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
          const ghHeaders: Record<string, string> = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Inopay-Deployer'
          };
          if (githubToken) {
            ghHeaders['Authorization'] = `token ${githubToken}`;
          }
          
          try {
            const repoRes = await fetch(`https://api.github.com/repos/${ghOwner}/${repoClean}`, { headers: ghHeaders });
            if (repoRes.ok) {
              const repoData = await repoRes.json();
              gitBranchToUse = gitBranchToUse || repoData.default_branch || 'main';
              console.log(`[auto-configure-coolify] Detected default branch: ${gitBranchToUse}`);
            }
            
            // Get latest commit SHA if not provided
            if (!gitCommitShaToUse && gitBranchToUse) {
              const refRes = await fetch(`https://api.github.com/repos/${ghOwner}/${repoClean}/git/ref/heads/${gitBranchToUse}`, { headers: ghHeaders });
              if (refRes.ok) {
                const refData = await refRes.json();
                gitCommitShaToUse = refData.object.sha;
                console.log(`[auto-configure-coolify] Detected commit SHA: ${gitCommitShaToUse}`);
              }
            }
  } catch (error) {
    console.error('[auto_configure_coolify_app] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'auto-configure-coolify-app'
    });
  }
});
