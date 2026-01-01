import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const diff_cleanRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

diff_cleanRouter.post('/', async (req: Request, res: Response) => {
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
    const supabaseAdmin = createClient(
          process.env.SUPABASE_URL ?? '',
          process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
        );
    
        const { 
          sync_config_id, 
          history_id, 
          github_repo_url, 
          commit_sha, 
          files_changed,
          deployment_id,
          branch = 'main' // Dynamic branch from webhook
        } = req.body;
    
        console.log(`[diff-clean] Processing ${files_changed?.length || 0} files for commit ${commit_sha} on branch ${branch}`);
    
        if (!files_changed || files_changed.length === 0) {
          console.log('[diff-clean] No files to process');
          
          if (history_id) {
            await supabaseAdmin
              .from('sync_history')
              .update({
                status: 'completed',
                files_cleaned: [],
                duration_ms: Date.now() - startTime,
                completed_at: new Date().toISOString(),
              })
              .eq('id', history_id);
          }
    
          // Trigger rolling update anyway (might be non-code changes)
          await triggerRollingUpdate(supabaseAdmin, deployment_id, sync_config_id, history_id);
    
          return new Response(JSON.stringify({ 
            success: true, 
            files_cleaned: 0 
          }), {,
          });
        }
    
        // Fetch user's GitHub token
        const { data: syncConfig } = await supabaseAdmin
          .from('sync_configurations')
          .select('user_id')
          .eq('id', sync_config_id)
          .single();
    
        if (!syncConfig) {
          throw new Error('Sync configuration not found');
        }
    
        const { data: userSettings } = await supabaseAdmin
          .from('user_settings')
          .select('github_token')
          .eq('user_id', syncConfig.user_id)
          .single();
    
        const githubToken = userSettings?.github_token;
        
        if (!githubToken) {
          throw new Error('GitHub token not configured');
        }
    
        // Parse repo owner/name from URL
        const repoMatch = github_repo_url.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (!repoMatch) {
          throw new Error('Invalid GitHub URL');
        }
        const [, owner, repo] = repoMatch;
        const repoName = repo.replace(/\.git$/, '');
    
        // Fetch content of changed files
        const filesToClean: { path: string; content: string; sha: string }[] = [];
    
        for (const filePath of files_changed) {
          try {
            const response = await fetch(
              `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}?ref=${commit_sha}`,
              {
                headers: {
                  'Authorization': `Bearer ${githubToken}`,
                  'Accept': 'application/vnd.github.v3+json',
                  'User-Agent': 'Inopay-Sync',
                },
              }
            );
    
            if (!response.ok) {
              console.log(`[diff-clean] Could not fetch ${filePath}: ${response.status}`);
              continue;
            }
    
            const data = await response.json();
            const content = atob(data.content.replace(/\n/g, ''));
    
            // Check if file needs cleaning (using shared patterns)
            if (needsCleaning(content)) {
              filesToClean.push({
                path: filePath,
                content,
                sha: data.sha,
              });
            }
  } catch (error) {
    console.error('[diff_clean] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'diff-clean'
    });
  }
});
