import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export const check_subscriptionRouter = Router();

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

check_subscriptionRouter.post('/', async (req: Request, res: Response) => {
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
    
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
        if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    
        // If there is no auth header/token, treat as free tier (do not fail hard)
        if (!authHeader || !token) {
          logStep("Unauthenticated request", { hasAuthHeader: !!authHeader, hasToken: !!token });
          return new Response(
            JSON.stringify({
              subscribed: false,
              plan_type: "free",
              limits: { maxFiles: 100, maxRepos: 3 },
              limit_source: "free",
            }),
            {,
              status: 200,
            }
          );
        }
    
        const { data: userData, error: userError } = await authClient.auth.getUser(token);
    
        // If the session was revoked (e.g. "sign out all"), auth can return "Auth session missing!".
        // In that case, respond gracefully as free tier to avoid client blank screens.
        if (userError || !userData.user?.email) {
          const message = userError
            ? `Authentication error: ${userError.message}`
            : "User not authenticated or email not available";
    
          logStep("Unauthenticated request", { message });
    
          return new Response(
            JSON.stringify({
              error: message,
              subscribed: false,
              plan_type: "free",
              limits: { maxFiles: 100, maxRepos: 3 },
              limit_source: "free",
            }),
            {,
              status: 200,
            }
          );
        }
    
        const user = userData.user;
        logStep("User authenticated", { userId: user.id, email: user.email });
    
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
        
        // PHASE 3: Check purchase-based limits FIRST (priority over plans)
        const purchaseLimits = await getPurchaseBasedLimits(supabaseClient, user.id);
        
        if (purchaseLimits) {
          logStep("User has purchase-based Enterprise limits", purchaseLimits);
          return new Response(JSON.stringify({ 
            subscribed: true,
            plan_type: "enterprise",
            limits: { maxFiles: purchaseLimits.maxFiles, maxRepos: purchaseLimits.maxRepos },
            limit_source: purchaseLimits.source,
            purchase_id: purchaseLimits.purchaseId,
          }), {,
            status: 200,
          });
        }
    
        // Check for existing customer
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        
        // Check local subscription table (for testers and pack users)
        const { data: localSub } = await supabaseClient
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        
        logStep("Local subscription check", { 
          found: !!localSub, 
          plan_type: localSub?.plan_type,
          status: localSub?.status,
          credits_remaining: localSub?.credits_remaining,
          free_credits: localSub?.free_credits
        });
    
        // Check if user is a tester (unlimited credits)
        const isUnlimitedTester = localSub && (
          (localSub.credits_remaining && localSub.credits_remaining >= 999999) ||
          (localSub.free_credits && localSub.free_credits >= 999999)
        );
        
        if (isUnlimitedTester || (localSub && localSub.plan_type === "pro" && localSub.status === "active")) {
          const planLimits = isUnlimitedTester 
            ? { maxFiles: 10000, maxRepos: -1 } // Enterprise limits for testers
            : { maxFiles: 500, maxRepos: 50 }; // Pro limits
          
          logStep("User has Pro access (tester or active subscription)", { isUnlimitedTester, planLimits });
          return new Response(JSON.stringify({ 
            subscribed: true,
            plan_type: isUnlimitedTester ? "enterprise" : "pro",
            credits_remaining: localSub.credits_remaining,
            subscription_end: localSub.current_period_end,
            limits: planLimits,
            limit_source: isUnlimitedTester ? 'tester' : 'subscription',
          }), {,
            status: 200,
          });
        }
    
        if (customers.data.length === 0) {
          logStep("No Stripe customer found");
          
          // Check for pack credits
          if (localSub && localSub.credits_remaining > 0) {
            return new Response(JSON.stringify({ 
              subscribed: true,
              plan_type: localSub.plan_type || "pack",
              credits_remaining: localSub.credits_remaining,
              limits: { maxFiles: 500, maxRepos: 20 }, // Pack limits (more generous)
              limit_source: 'subscription',
            }), {,
              status: 200,
            });
          }
          
          return new Response(JSON.stringify({ 
            subscribed: false, 
            plan_type: "free",
            limits: { maxFiles: 100, maxRepos: 3 },
            limit_source: 'free',
          }), {,
            status: 200,
          });
        }
    
        const customerId = customers.data[0].id;
        logStep("Found Stripe customer", { customerId });
    
        // Check for active subscription
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          status: "active",
          limit: 1,
        });
    
        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0];
          const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
          logStep("Active subscription found", { subscriptionId: subscription.id });
    
          // Update local subscription table
          await supabaseClient
            .from("subscriptions")
            .upsert({
              user_id: user.id,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscription.id,
              plan_type: "pro",
              status: "active",
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: subscriptionEnd,
            }, { onConflict: "user_id" });
    
          return new Response(JSON.stringify({
            subscribed: true,
            plan_type: "pro",
            subscription_end: subscriptionEnd,
            limits: { maxFiles: 500, maxRepos: 50 },
            limit_source: 'subscription',
          }), {,
            status: 200,
          });
        }
    
        // Check for pack credits (using already fetched localSub)
        if (localSub && localSub.credits_remaining > 0) {
          return new Response(JSON.stringify({ 
            subscribed: true,
            plan_type: localSub.plan_type || "pack",
            credits_remaining: localSub.credits_remaining,
            limits: { maxFiles: 500, maxRepos: 20 }, // Pack limits
            limit_source: 'subscription',
          }), {,
            status: 200,
          });
        }
    
        logStep("No active subscription or credits found");
        return new Response(JSON.stringify({ 
          subscribed: false, 
          plan_type: "free",
          limits: { maxFiles: 100, maxRepos: 3 },
          limit_source: 'free',
        }), {,
          status: 200,
        });
  } catch (error) {
    console.error('[check_subscription] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'check-subscription'
    });
  }
});
