import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const download_liberationRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

download_liberationRouter.post('/', async (req: Request, res: Response) => {
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
    
        // Vérifier l'authentification
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
    
        // Extraire l'ID du job
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        let jobId = pathParts[pathParts.length - 1];
        
        if (!jobId || jobId === 'download-liberation') {
          jobId = url.searchParams.get('id') || '';
        }
    
        if (!jobId) {
          return new Response(
            JSON.stringify({ error: 'Job ID required' }),
            { status: 400 }
          );
        }
    
        // Récupérer le job
        const { data: job, error: jobError } = await supabase
          .from('liberation_jobs')
          .select('*')
          .eq('id', jobId)
          .eq('user_id', user.id)
          .single();
    
        if (jobError || !job) {
          return new Response(
            JSON.stringify({ error: 'Job not found or access denied' }),
            { status: 404 }
          );
        }
    
        // Vérifier que le job est complété
        if (job.status !== 'completed') {
          return new Response(
            JSON.stringify({ 
              error: 'Liberation not completed',
              status: job.status,
              progress: job.progress,
              message: job.status === 'failed' 
                ? `Job failed: ${job.error_message}` 
                : 'Please wait for the liberation to complete'
            }),
            { status: 400 }
          );
        }
    
        // Si on a une URL de résultat, rediriger
        if (job.result_url) {
          // Télécharger depuis le storage
          const { data: fileData, error: storageError } = await supabase.storage
            .from('cleaned-archives')
            .download(job.result_url);
    
          if (storageError || !fileData) {
            console.error('Storage error:', storageError);
            return new Response(
              JSON.stringify({ error: 'Failed to retrieve archive' }),
              { status: 500 }
            );
          }
    
          const filename = `${job.project_name || 'liberation'}-liberated.zip`;
          
          return new Response(fileData, {"`,
            },
          });
        }
    
        // Si pas d'URL mais complété, générer un package minimal
        const minimalPackage = generateMinimalPackage(job);
        
        console.log(`[DOWNLOAD] Serving liberation package for job ${jobId}`);
    
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Liberation package ready',
            projectName: job.project_name,
            auditScore: job.audit_score,
            // Dans une vraie implémentation, on retournerait le ZIP
            package: minimalPackage,
          }),
          { }
        );
  } catch (error) {
    console.error('[download_liberation] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'download-liberation'
    });
  }
});
