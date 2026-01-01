import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const process_project_liberationRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

process_project_liberationRouter.post('/', async (req: Request, res: Response) => {
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
    // Create initial README.md via Contents API (works on empty repos)
        const readmeContent = btoa(`# ${repoName}\n\nProjet libéré et nettoyé par Inopay - 100% Souverain\n`);
        
        const createFileResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/contents/README.md`,
          {
            method: 'PUT',
            headers,
            body: JSON.stringify({
              message: '🎉 Initial commit - Repo initialized',
              content: readmeContent,
              branch: 'main',
            }),
          }
        );
    
        if (!createFileResponse.ok) {
          // Try with master branch if main doesn't exist
          const masterResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repoName}/contents/README.md`,
            {
              method: 'PUT',
              headers,
              body: JSON.stringify({
                message: '🎉 Initial commit - Repo initialized',
                content: readmeContent,
                branch: 'master',
              }),
            }
          );
          
          if (!masterResponse.ok) {
            const error = await masterResponse.json();
            console.error('[GitHub] Failed to initialize repo:', error);
            return { success: false, error: `Impossible d'initialiser le repo: ${error.message}` };
          }
        }
        
        console.log(`[GitHub] Initial commit created, waiting for branch to be ready...`);
        
        // Wait a moment for GitHub to process
        await new Promise(r => setTimeout(r, 1500));
        
        // Now get the base SHA from the newly created commit
        const refResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/main`,
          { headers }
        );
        
        if (refResponse.ok) {
          const refData = await refResponse.json();
          const baseSha = refData.object.sha;
          
          const commitResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repoName}/git/commits/${baseSha}`,
            { headers }
          );
          
          if (commitResponse.ok) {
            const commitData = await commitResponse.json();
            console.log(`[GitHub] Repo initialized successfully, baseSha: ${baseSha}`);
            return { 
              success: true, 
              baseSha, 
              baseTreeSha: commitData.tree.sha 
            };
          }
        }
        
        // Try master branch
        const masterRefResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/master`,
          { headers }
        );
        
        if (masterRefResponse.ok) {
          const refData = await masterRefResponse.json();
          const baseSha = refData.object.sha;
          
          const commitResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repoName}/git/commits/${baseSha}`,
            { headers }
          );
          
          if (commitResponse.ok) {
            const commitData = await commitResponse.json();
            console.log(`[GitHub] Repo initialized on master, baseSha: ${baseSha}`);
            return { 
              success: true, 
              baseSha, 
              baseTreeSha: commitData.tree.sha 
            };
          }
        }
        
        return { success: false, error: 'Repo initialisé mais impossible de lire la ref' };
  } catch (error) {
    console.error('[process_project_liberation] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'process-project-liberation'
    });
  }
});
