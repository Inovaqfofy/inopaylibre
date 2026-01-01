import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export const customer_portalRouter = Router();

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

customer_portalRouter.post('/', async (req: Request, res: Response) => {
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
        logStep("Stripe key verified");
    
        const supabaseClient = createClient(
          process.env.SUPABASE_URL ?? "",
          process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
          { auth: { persistSession: false } }
        );
    
        if (!authHeader) throw new Error("No authorization header provided");
        logStep("Authorization header found");
    
        const { data: userData, error: userError } = await supabaseClient.auth.getUser(token!);
        if (userError) throw new Error(`Authentication error: ${userError.message}`);
        const user = userData.user;
        if (!user?.email) throw new Error("User not authenticated or email not available");
        logStep("User authenticated", { userId: user.id, email: user.email });
    
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        
        if (customers.data.length === 0) {
          throw new Error("No Stripe customer found for this user. You need an active subscription first.");
        }
        
        const customerId = customers.data[0].id;
        logStep("Found Stripe customer", { customerId });
    
        const origin = req.headers['origin'] || "https://localhost:3000";
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${origin}/dashboard`,
        });
        
        logStep("Customer portal session created", { sessionId: portalSession.id, url: portalSession.url });
    
        return new Response(JSON.stringify({ url: portalSession.url }), {,
          status: 200,
        });
  } catch (error) {
    console.error('[customer_portal] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'customer-portal'
    });
  }
});
