import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const get_user_creditsRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

get_user_creditsRouter.post('/', async (req: Request, res: Response) => {
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
    logStep("Function started");
    
        const authHeader = req.headers['Authorization'];
        if (!authHeader) throw new Error("No authorization header provided");
    
        const token = authHeader.replace("Bearer ", "");
        const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
        if (userError) throw new Error(`Authentication error: ${userError.message}`);
        const user = userData.user;
        if (!user) throw new Error("User not authenticated");
        
        logStep("User authenticated", { userId: user.id });
    
        // Fetch all purchases for the user
        const { data: purchases, error: purchasesError } = await supabaseClient
          .from("user_purchases")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
    
        if (purchasesError) {
          logStep("Error fetching purchases", { error: purchasesError });
          throw new Error("Failed to fetch purchases");
        }
    
        logStep("Purchases fetched", { count: purchases?.length || 0 });
    
        // Calculate available credits by service type
        const credits = {
          deploy: 0,
          redeploy: 0,
          server: 0,
        };
    
        // Active monitoring subscriptions
        const activeMonitoring: any[] = [];
    
        // Recent purchases for history
        const recentPurchases: any[] = [];
    
        for (const purchase of purchases || []) {
          // Add to recent purchases (for display)
          recentPurchases.push({
            id: purchase.id,
            service_type: purchase.service_type,
            amount: purchase.amount,
            currency: purchase.currency,
            status: purchase.status,
            is_subscription: purchase.is_subscription,
            subscription_status: purchase.subscription_status,
            subscription_ends_at: purchase.subscription_ends_at,
            used: purchase.used,
            deployment_id: purchase.deployment_id,
            created_at: purchase.created_at,
          });
    
          // Count available credits (not used, not refunded)
          if (purchase.status === "completed" && !purchase.used && !purchase.is_subscription) {
            if (purchase.service_type === "deploy") credits.deploy++;
            if (purchase.service_type === "redeploy") credits.redeploy++;
            if (purchase.service_type === "server") credits.server++;
          }
    
          // Track active monitoring subscriptions
          if (purchase.is_subscription && purchase.subscription_status === "active" && purchase.service_type === "monitoring") {
            activeMonitoring.push({
              id: purchase.id,
              subscription_ends_at: purchase.subscription_ends_at,
              created_at: purchase.created_at,
            });
          }
        }
    
        logStep("Credits calculated", { credits, activeMonitoringCount: activeMonitoring.length });
    
        // Check for legacy credits in subscriptions table
        const { data: legacySub } = await supabaseClient
          .from("subscriptions")
          .select("credits_remaining, free_credits, plan_type, status")
          .eq("user_id", user.id)
          .maybeSingle();
    
        // Include legacy credits
        const legacyCredits = (legacySub?.credits_remaining || 0) + (legacySub?.free_credits || 0);
        const isUnlimitedTester = legacyCredits >= 999999;
        const isPro = legacySub?.plan_type === "pro" && legacySub?.status === "active";
    
        return new Response(JSON.stringify({
          credits: {
            deploy: credits.deploy,
            redeploy: credits.redeploy,
            server: credits.server,
            legacy: legacyCredits > 0 && legacyCredits < 999999 ? legacyCredits : 0,
          },
          activeMonitoring,
          recentPurchases: recentPurchases.slice(0, 20),
          isUnlimitedTester,
          isPro,
          totalPurchases: purchases?.length || 0,
        }), {,
          status: 200,
        });
  } catch (error) {
    console.error('[get_user_credits] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'get-user-credits'
    });
  }
});
