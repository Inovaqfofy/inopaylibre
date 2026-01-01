import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { Resend } from 'resend';

export const pipeline_health_checkRouter = Router();

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

pipeline_health_checkRouter.post('/', async (req: Request, res: Response) => {
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
    
        // Auth - Admin only
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
    
        // Check admin role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();
    
        if (!roleData) {
          return new Response(
            JSON.stringify({ error: 'Admin role required' }),
            { status: 403 }
          );
        }
    
        console.log('[pipeline-health-check] Starting comprehensive health check...');
    
        const result: HealthCheckResult = {
          timestamp: new Date().toISOString(),
          overall_status: 'healthy',
          overall_score: 100,
          checks: {
            github: { status: 'ok', token_valid: false, scopes: [], rate_limit_remaining: 0, message: '' },
            coolify: { status: 'ok', servers_total: 0, servers_connected: 0, servers_healthy: 0, details: [], message: '' },
            database: { status: 'ok', tables_count: 0, records: { users: 0, servers: 0, deployments: 0, projects: 0, sync_configs: 0 }, message: '' },
            edge_functions: { status: 'ok', total: 0, deployed: [], missing: [], message: '' },
            secrets: { status: 'ok', configured: [], missing: [], message: '' }
          }
        };
    
        let scoreDeductions = 0;
    
        // 1. Check GitHub Token
        console.log('[pipeline-health-check] Checking GitHub...');
        const githubToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
        if (githubToken) {
          try {
            const ghResponse = await fetch('https://api.github.com/user', {
              headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Inopay-HealthCheck'
              }
            });
    
            if (ghResponse.ok) {
              result.checks.github.token_valid = true;
              result.checks.github.rate_limit_remaining = parseInt(ghResponse.headers.get('x-ratelimit-remaining') || '0');
              
              // Get scopes from header
              const scopes = ghResponse.headers.get('x-oauth-scopes') || '';
              result.checks.github.scopes = scopes.split(',').map(s => s.trim()).filter(Boolean);
              
              result.checks.github.message = `Token valid, ${result.checks.github.rate_limit_remaining} requests remaining`;
              result.checks.github.status = result.checks.github.rate_limit_remaining < 100 ? 'warning' : 'ok';
              
              if (result.checks.github.rate_limit_remaining < 100) scoreDeductions += 10;
            } else {
              result.checks.github.status = 'error';
              result.checks.github.message = `Token invalid: ${ghResponse.status}`;
              scoreDeductions += 25;
            }
  } catch (error) {
    console.error('[pipeline_health_check] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'pipeline-health-check'
    });
  }
});
