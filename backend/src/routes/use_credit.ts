import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const use_creditRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

use_creditRouter.post('/', async (req: Request, res: Response) => {
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
    
        // Get user from auth header
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
    
        const { credit_type, deployment_id, project_id } = req.body;
    
        if (!credit_type) {
          return new Response(
            JSON.stringify({ error: 'credit_type is required' }),
            { status: 400 }
          );
        }
    
        logStep('Processing credit request', { userId: user.id, credit_type, deployment_id, project_id });
    
        // Check if user is an unlimited tester (via user_roles)
        const { data: testerRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin') // Admins also have unlimited credits
          .maybeSingle();
    
        if (testerRole) {
          logStep('User is admin - credit granted');
          return new Response(
            JSON.stringify({
              success: true,
              credit_source: 'admin',
              message: 'Crédit illimité (administrateur)'
            }),
            { }
          );
        }
    
        // Check for unlimited tester in subscriptions table
        const { data: testerSub } = await supabase
          .from('subscriptions')
          .select('id, credits_remaining, free_credits')
          .eq('user_id', user.id)
          .or('credits_remaining.gte.999999,free_credits.gte.999999')
          .maybeSingle();
    
        if (testerSub) {
          logStep('User is unlimited tester - credit granted');
          return new Response(
            JSON.stringify({
              success: true,
              credit_source: 'tester',
              message: 'Crédit illimité (testeur)'
            }),
            { }
          );
        }
    
        // PHASE 3: Check for available purchase credit (exact match OR fallback)
        // First try exact match, then try related types
        const creditTypes = credit_type === 'redeploy' 
          ? ['redeploy', 'deploy'] // redeploy can use deploy credit as fallback
          : [credit_type];
    
        let purchase = null;
        for (const searchType of creditTypes) {
          const { data } = await supabase
            .from('user_purchases')
            .select('*')
            .eq('user_id', user.id)
            .eq('service_type', searchType)
            .eq('status', 'completed')
            .eq('used', false)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();
    
          if (data) {
            purchase = data;
            logStep(`Found credit via ${searchType}`, { purchaseId: data.id });
            break;
          }
        }
    
        if (purchase) {
          logStep('Found available purchase credit', { purchaseId: purchase.id, serviceType: purchase.service_type });
    
          // Mark as used and link to deployment/project
          const updateData: Record<string, unknown> = {
            used: true,
            used_at: new Date().toISOString(),
          };
          
          if (deployment_id) {
            updateData.deployment_id = deployment_id;
          }
          
          // Store project_id in metadata if provided
          if (project_id) {
            updateData.metadata = {
              ...(purchase.metadata || {}),
              project_id,
              used_for: credit_type
            };
          }
    
          const { error: updateError } = await supabase
            .from('user_purchases')
            .update(updateData)
            .eq('id', purchase.id);
    
          if (updateError) {
            logStep('Error marking credit as used', updateError);
            throw new Error('Failed to consume credit');
          }
    
          return new Response(
            JSON.stringify({
              success: true,
              credit_source: 'purchase',
              purchase_id: purchase.id,
              original_type: purchase.service_type,
              used_for: credit_type,
              message: `Crédit ${credit_type} consommé`,
              // PHASE 3: Return enterprise limits for deploy purchases
              limits_granted: purchase.service_type === 'deploy' || purchase.service_type === 'redeploy'
                ? { maxFiles: 10000, maxRepos: -1 }
                : null
            }),
            { }
          );
        }
    
        // Check legacy credits (subscriptions table)
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('id, credits_remaining, free_credits, plan_type')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
    
        if (subscription) {
          const totalLegacy = (subscription.credits_remaining || 0) + (subscription.free_credits || 0);
          
          if (totalLegacy > 0) {
            logStep('Using legacy credit', { subscriptionId: subscription.id, available: totalLegacy });
    
            // Deduct from free_credits first, then credits_remaining
            let newFreeCredits = subscription.free_credits || 0;
            let newCreditsRemaining = subscription.credits_remaining || 0;
    
            if (newFreeCredits > 0) {
              newFreeCredits -= 1;
            } else {
              newCreditsRemaining -= 1;
            }
    
            const { error: updateError } = await supabase
              .from('subscriptions')
              .update({
                free_credits: newFreeCredits,
                credits_remaining: newCreditsRemaining,
                updated_at: new Date().toISOString()
              })
              .eq('id', subscription.id);
    
            if (updateError) {
              logStep('Error updating legacy credit', updateError);
              throw new Error('Failed to consume legacy credit');
            }
    
            return new Response(
              JSON.stringify({
                success: true,
                credit_source: 'legacy',
                subscription_id: subscription.id,
                remaining: newFreeCredits + newCreditsRemaining,
                message: 'Crédit legacy consommé'
              }),
              { }
            );
          }
        }
    
        // No credits available
        logStep('No credits available', { credit_type });
    
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Crédit insuffisant',
            credit_type,
            message: `Vous n'avez pas de crédit "${credit_type}" disponible. Veuillez en acheter un pour continuer.`,
            redirect_to_pricing: true
          }),
          { status: 402 }
        );
  } catch (error) {
    console.error('[use_credit] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'use-credit'
    });
  }
});
