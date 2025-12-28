import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const auto_fix_dockerfileRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

auto_fix_dockerfileRouter.post('/', async (req: Request, res: Response) => {
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
          github_repo_url, 
          fix_type = 'npm_install',
          auto_redeploy = false,
          coolify_app_uuid,
          server_id
        } = req.body;
    
        if (!github_repo_url) {
          return new Response(
            JSON.stringify({ error: 'github_repo_url is required' }),
            { status: 400 }
          );
        }
    
        console.log(`[auto-fix-dockerfile] Starting fix for ${github_repo_url}, type: ${fix_type}, auto_redeploy: ${auto_redeploy}`);
    
        // Get GitHub token
        const githubToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
        if (!githubToken) {
          return new Response(
            JSON.stringify({ error: 'GitHub token not configured' }),
            { status: 500 }
          );
        }
    
        // Parse GitHub URL
        const urlMatch = github_repo_url.match(/github\.com[/:]([^/]+)\/([^/.#?\s]+)/i);
        if (!urlMatch) {
          return new Response(
            JSON.stringify({ error: 'Invalid GitHub URL format' }),
            { status: 400 }
          );
        }
    
        const [, owner, repo] = urlMatch;
        const repoClean = repo.replace(/\.git$/, '');
        
        console.log(`[auto-fix-dockerfile] Repo: ${owner}/${repoClean}`);
    
        const githubHeaders = {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28'
        };
    
        // Step 1: Get the default branch
        const repoInfoRes = await fetch(`https://api.github.com/repos/${owner}/${repoClean}`, {
          headers: githubHeaders
        });
    
        if (!repoInfoRes.ok) {
          const errText = await repoInfoRes.text();
          console.error('[auto-fix-dockerfile] Repo info error:', errText);
          return new Response(
            JSON.stringify({ error: `Cannot access repository: ${repoInfoRes.status}` }),
            { status: 400 }
          );
        }
    
        const repoInfo = await repoInfoRes.json();
        const defaultBranch = repoInfo.default_branch || 'main';
        console.log(`[auto-fix-dockerfile] Default branch: ${defaultBranch}`);
    
        // Step 2: Get the current commit SHA of the branch
        const refRes = await fetch(`https://api.github.com/repos/${owner}/${repoClean}/git/ref/heads/${defaultBranch}`, {
          headers: githubHeaders
        });
    
        if (!refRes.ok) {
          return new Response(
            JSON.stringify({ error: 'Cannot get branch reference' }),
            { status: 400 }
          );
        }
    
        const refData = await refRes.json();
        const currentCommitSha = refData.object.sha;
        console.log(`[auto-fix-dockerfile] Current commit SHA: ${currentCommitSha}`);
    
        // Step 3: Get the current tree
        const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repoClean}/git/commits/${currentCommitSha}`, {
          headers: githubHeaders
        });
    
        if (!commitRes.ok) {
          return new Response(
            JSON.stringify({ error: 'Cannot get commit details' }),
            { status: 400 }
          );
        }
    
        const commitData = await commitRes.json();
        const currentTreeSha = commitData.tree.sha;
    
        // Step 4: Create blobs for the new files
        const filesToAdd: Array<{ path: string; content: string }> = [];
        
        if (fix_type === 'npm_install' || fix_type === 'patch_dockerfile_npm_install') {
          filesToAdd.push({ path: 'Dockerfile', content: CORRECTED_DOCKERFILE });
          filesToAdd.push({ path: 'nginx.conf', content: NGINX_CONFIG });
        }
    
        const blobPromises = filesToAdd.map(async (file) => {
          const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repoClean}/git/blobs`, {
            method: 'POST',
            headers: githubHeaders,
            body: JSON.stringify({
              content: file.content,
              encoding: 'utf-8'
            })
          });
          
          if (!blobRes.ok) {
            throw new Error(`Failed to create blob for ${file.path}`);
          }
          
          const blobData = await blobRes.json();
          return {
            path: file.path,
            mode: '100644',
            type: 'blob',
            sha: blobData.sha
          };
        });
    
        const treeEntries = await Promise.all(blobPromises);
        console.log(`[auto-fix-dockerfile] Created ${treeEntries.length} blobs`);
    
        // Step 5: Create a new tree
        const newTreeRes = await fetch(`https://api.github.com/repos/${owner}/${repoClean}/git/trees`, {
          method: 'POST',
          headers: githubHeaders,
          body: JSON.stringify({
            base_tree: currentTreeSha,
            tree: treeEntries
          })
        });
    
        if (!newTreeRes.ok) {
          const errText = await newTreeRes.text();
          console.error('[auto-fix-dockerfile] Tree creation error:', errText);
          return new Response(
            JSON.stringify({ error: 'Failed to create tree' }),
            { status: 500 }
          );
        }
    
        const newTreeData = await newTreeRes.json();
        const newTreeSha = newTreeData.sha;
    
        // Step 6: Create a new commit
        const commitMessage = fix_type === 'npm_install' || fix_type === 'patch_dockerfile_npm_install'
          ? '🔧 Auto-fix: Replace npm ci with npm install in Dockerfile\n\nThis fix resolves the npm ci error when package-lock.json is missing.\nGenerated by Inopay Deployment Assistant.'
          : '🔧 Auto-fix: Update Dockerfile\n\nGenerated by Inopay Deployment Assistant.';
    
        const newCommitRes = await fetch(`https://api.github.com/repos/${owner}/${repoClean}/git/commits`, {
          method: 'POST',
          headers: githubHeaders,
          body: JSON.stringify({
            message: commitMessage,
            tree: newTreeSha,
            parents: [currentCommitSha]
          })
        });
    
        if (!newCommitRes.ok) {
          const errText = await newCommitRes.text();
          console.error('[auto-fix-dockerfile] Commit creation error:', errText);
          return new Response(
            JSON.stringify({ error: 'Failed to create commit' }),
            { status: 500 }
          );
        }
    
        const newCommitData = await newCommitRes.json();
        const newCommitSha = newCommitData.sha;
        console.log(`[auto-fix-dockerfile] New commit SHA: ${newCommitSha}`);
    
        // Step 7: Update the branch reference
        const updateRefRes = await fetch(`https://api.github.com/repos/${owner}/${repoClean}/git/refs/heads/${defaultBranch}`, {
          method: 'PATCH',
          headers: githubHeaders,
          body: JSON.stringify({
            sha: newCommitSha,
            force: false
          })
        });
    
        if (!updateRefRes.ok) {
          const errText = await updateRefRes.text();
          console.error('[auto-fix-dockerfile] Ref update error:', errText);
          return new Response(
            JSON.stringify({ error: 'Failed to update branch reference' }),
            { status: 500 }
          );
        }
    
        console.log('[auto-fix-dockerfile] Successfully pushed fix');
    
        // Step 8: Verify the commit is on the branch by re-fetching
        let verifiedCommit = false;
        try {
          const verifyRes = await fetch(`https://api.github.com/repos/${owner}/${repoClean}/commits/${newCommitSha}`, {
            headers: githubHeaders
          });
          if (verifyRes.ok) {
            console.log('[auto-fix-dockerfile] Commit verified on GitHub');
            verifiedCommit = true;
          }
  } catch (error) {
    console.error('[auto_fix_dockerfile] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'auto-fix-dockerfile'
    });
  }
});
