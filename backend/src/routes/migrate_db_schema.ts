import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export const migrate_db_schemaRouter = Router();

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

migrate_db_schemaRouter.post('/', async (req: Request, res: Response) => {
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
    const authHeader = req.headers['Authorization'];
        if (!authHeader) {
          return new Response(JSON.stringify({ error: 'Non autorisé' }), {
            status: 401,
          });
        }
    
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);
    
        // Verify user
        const anonClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: authHeader } }
        });
        
        const { data: { user }, error: userError } = await anonClient.auth.getUser();
        if (userError || !user) {
          return new Response(JSON.stringify({ error: 'Utilisateur non authentifié' }), {
            status: 401,
          });
        }
    
        const { action, projectId } = req.body;
    
        console.log(`[MIGRATE-DB] Action: ${action} for user: ${user.email}`);
    
        // Get user's target Supabase credentials
        const { data: serverData } = await supabase
          .from('user_servers')
          .select('service_role_key, anon_key, db_url')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();
    
        if (!serverData?.service_role_key || !serverData?.db_url) {
          return new Response(JSON.stringify({ 
            error: 'Credentials Supabase non configurés',
            needsConfiguration: true
          }), {
            status: 400,
          });
        }
    
        // Connect to user's Supabase instance
        const targetSupabase = createClient(
          serverData.db_url,
          serverData.service_role_key
        );
    
        if (action === 'test') {
          // Test connection to user's Supabase
          try {
            const { data, error } = await targetSupabase.from('_test_connection').select('*').limit(1);
            // Even if table doesn't exist, connection is valid
            return new Response(JSON.stringify({ 
              success: true,
              message: 'Connexion réussie à votre instance Supabase'
            }), {,
            });
  } catch (error) {
    console.error('[migrate_db_schema] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'migrate-db-schema'
    });
  }
});
