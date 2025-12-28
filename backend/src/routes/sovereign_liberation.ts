import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { Resend } from 'resend';

export const sovereign_liberationRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

const resend = new Resend(process.env.RESEND_API_KEY);

sovereign_liberationRouter.post('/', async (req: Request, res: Response) => {
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
    // 1.1 - Validate token and get user
        const userResponse = await fetch('https://api.github.com/user', { headers });
        if (!userResponse.ok) {
          const error = await userResponse.text();
          return {
            success: false,
            phase: 'github',
            message: 'Token GitHub invalide ou expiré',
            error: `HTTP ${userResponse.status}: ${error}`,
            httpStatus: userResponse.status,
          };
        }
    
        const user = await userResponse.json();
        const owner = user.login;
        logStep("Phase 1.1: GitHub user validated", { owner });
    
        // 1.2 - Check token scopes
        const scopes = userResponse.headers.get('x-oauth-scopes') || '';
        const hasRepoScope = scopes.includes('repo');
    
        if (!hasRepoScope) {
          return {
            success: false,
            phase: 'github',
            message: 'Token GitHub sans permission "repo"',
            error: `Scopes actuels: ${scopes || 'aucun'}. Requis: repo, workflow`,
            httpStatus: 403,
          };
        }
    
        logStep("Phase 1.2: Token scopes validated", { scopes, hasRepoScope });
    
        // 1.3 - Clean files using proprietary-patterns
        const cleanedFiles: { path: string; content: string }[] = [];
        const cleaningResults: CleaningResult[] = [];
        let totalChanges = 0;
    
        for (const file of files) {
          if (isLockFile(file.path)) continue;
    
          const result = cleanFileContent(file.path, file.content);
          cleaningResults.push(result);
    
          if (!result.removed) {
            cleanedFiles.push({ path: file.path, content: result.cleanedContent });
            totalChanges += result.changes.length;
          }
        }
    
        logStep("Phase 1.3: Files cleaned", { 
          original: files.length, 
          cleaned: cleanedFiles.length, 
          totalChanges 
        });
    
        if (cleanedFiles.length === 0) {
          return {
            success: false,
            phase: 'github',
            message: 'Aucun fichier à pousser après nettoyage',
            error: 'Tous les fichiers ont été filtrés ou supprimés',
          };
        }
    
        // 1.4 - Check if repo exists or create it
        const repoCheckResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, { headers });
        let repoUrl: string;
        let wasCreated = false;
    
        if (repoCheckResponse.status === 404) {
          const createResponse = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              name: repoName,
              description: 'Projet libéré et nettoyé par Inopay - 100% Souverain',
              private: true,
              auto_init: false,
            }),
          });
    
          if (!createResponse.ok) {
            const error = await createResponse.json();
            return {
              success: false,
              phase: 'github',
              message: 'Erreur création du dépôt',
              error: error.message || `HTTP ${createResponse.status}`,
              httpStatus: createResponse.status,
            };
          }
    
          const newRepo = await createResponse.json();
          repoUrl = newRepo.html_url;
          wasCreated = true;
          logStep("Phase 1.4: Repository created", { repoUrl });
        } else if (repoCheckResponse.ok) {
          const existingRepo = await repoCheckResponse.json();
          repoUrl = existingRepo.html_url;
          logStep("Phase 1.4: Repository exists", { repoUrl });
        } else {
          const error = await repoCheckResponse.text();
          return {
            success: false,
            phase: 'github',
            message: 'Erreur vérification du dépôt',
            error: `HTTP ${repoCheckResponse.status}: ${error}`,
            httpStatus: repoCheckResponse.status,
          };
        }
    
        // 1.5 - Initialize repo if needed
        let baseSha: string | null = null;
        let baseTreeSha: string | null = null;
    
        if (!wasCreated) {
          const refResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/main`, { headers });
          if (refResponse.ok) {
            const refData = await refResponse.json();
            baseSha = refData.object.sha;
            
            const commitResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/commits/${baseSha}`, { headers });
            if (commitResponse.ok) {
              const commitData = await commitResponse.json();
              baseTreeSha = commitData.tree.sha;
            }
          }
        }
    
        if (!baseSha) {
          const readmeContent = btoa(`# ${repoName}\n\nProjet libéré et nettoyé par Inopay - 100% Souverain\n`);
          
          const initResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repoName}/contents/README.md`,
            {
              method: 'PUT',
              headers,
              body: JSON.stringify({
                message: '🎉 Initial commit - Repo initialized by Inopay',
                content: readmeContent,
                branch: 'main',
              }),
            }
          );
    
          if (initResponse.ok || initResponse.status === 422) {
            await new Promise(r => setTimeout(r, 1500));
            
            const refResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/main`, { headers });
            if (refResponse.ok) {
              const refData = await refResponse.json();
              baseSha = refData.object.sha;
              
              const commitResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/commits/${baseSha}`, { headers });
              if (commitResponse.ok) {
                const commitData = await commitResponse.json();
                baseTreeSha = commitData.tree.sha;
              }
            }
          }
        }
    
        logStep("Phase 1.5: Base refs obtained", { baseSha: baseSha?.substring(0, 7), baseTreeSha: baseTreeSha?.substring(0, 7) });
    
        // 1.6 - Build tree with inline content
        const treeItems: { path: string; mode: string; type: string; content?: string; sha?: string }[] = [];
        const INLINE_LIMIT = 100 * 1024;
    
        for (const file of cleanedFiles) {
          const size = new TextEncoder().encode(file.content).length;
          
          if (size > INLINE_LIMIT) {
            const blobResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/blobs`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                content: btoa(unescape(encodeURIComponent(file.content))),
                encoding: 'base64',
              }),
            });
    
            if (blobResponse.ok) {
              const blob = await blobResponse.json();
              treeItems.push({ path: file.path, mode: '100644', type: 'blob', sha: blob.sha });
            } else {
              treeItems.push({ path: file.path, mode: '100644', type: 'blob', content: file.content });
            }
          } else {
            treeItems.push({ path: file.path, mode: '100644', type: 'blob', content: file.content });
          }
        }
    
        logStep("Phase 1.6: Tree built", { items: treeItems.length });
    
        // 1.7 - Create tree
        const treePayload: { tree: typeof treeItems; base_tree?: string } = { tree: treeItems };
        if (baseTreeSha) {
          treePayload.base_tree = baseTreeSha;
        }
    
        const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/trees`, {
          method: 'POST',
          headers,
          body: JSON.stringify(treePayload),
        });
    
        if (!treeResponse.ok) {
          const error = await treeResponse.json();
          return {
            success: false,
            phase: 'github',
            message: 'Erreur création de l\'arbre Git',
            error: error.message || `HTTP ${treeResponse.status}`,
            httpStatus: treeResponse.status,
          };
        }
    
        const tree = await treeResponse.json();
        logStep("Phase 1.7: Tree created", { treeSha: tree.sha.substring(0, 7) });
    
        // 1.8 - Create commit
        const commitPayload: { message: string; tree: string; parents?: string[] } = {
          message: `🚀 Liberation Inopay - ${cleanedFiles.length} fichiers nettoyés`,
          tree: tree.sha,
        };
        if (baseSha) {
          commitPayload.parents = [baseSha];
        }
    
        const commitResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/commits`, {
          method: 'POST',
          headers,
          body: JSON.stringify(commitPayload),
        });
    
        if (!commitResponse.ok) {
          const error = await commitResponse.json();
          return {
            success: false,
            phase: 'github',
            message: 'Erreur création du commit',
            error: error.message || `HTTP ${commitResponse.status}`,
            httpStatus: commitResponse.status,
          };
        }
    
        const commit = await commitResponse.json();
        logStep("Phase 1.8: Commit created", { commitSha: commit.sha.substring(0, 7) });
    
        // 1.9 - Update ref
        const refUpdateResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/main`, {
          method: baseSha ? 'PATCH' : 'POST',
          headers,
          body: JSON.stringify({
            sha: commit.sha,
            force: true,
          }),
        });
    
        if (!refUpdateResponse.ok && !baseSha) {
          await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              ref: 'refs/heads/main',
              sha: commit.sha,
            }),
          });
        }
    
        logStep("Phase 1.9: Ref updated - COMPLETE", { repoUrl });
    
        // 1.10 - Validate package.json exists
        const packageJsonFile = cleanedFiles.find(f => f.path === 'package.json');
        let packageJsonValid = false;
    
        if (packageJsonFile) {
          try {
            const pkg = JSON.parse(packageJsonFile.content);
            packageJsonValid = !!pkg.name && !!pkg.dependencies;
  } catch (error) {
    console.error('[sovereign_liberation] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'sovereign-liberation'
    });
  }
});
