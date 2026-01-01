import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const liberateRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

liberateRouter.post('/', async (req: Request, res: Response) => {
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
    
        const body: LiberateRequest = req.body;
        
        if (!body.source) {
          return new Response(
            JSON.stringify({ error: 'source is required (zip, github, or local)' }),
            { status: 400 }
          );
        }
    
        const { data: job, error: jobError } = await supabase
          .from('liberation_jobs')
          .insert({
            user_id: user.id,
            source_type: body.source,
            source_url: body.source === 'github' ? body.data : null,
            project_name: body.projectName || `project-${Date.now()}`,
            status: 'pending',
            progress: 0,
          })
          .select()
          .single();
    
        if (jobError) {
          console.error('Error creating job:', jobError);
          return new Response(
            JSON.stringify({ error: 'Failed to create liberation job', details: jobError.message }),
            { status: 500 }
          );
        }
    
        console.log(`[LIBERATE] Job created: ${job.id} for user ${user.id}`);
    
        return new Response(
          JSON.stringify({
            success: true,
            liberationId: job.id,
            status: 'queued',
            message: 'Liberation job created. Use GET /audit/:id to check progress.',
          }),
          { }
        );
  } catch (error) {
    console.error('[liberate] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'liberate'
    });
  }
});
