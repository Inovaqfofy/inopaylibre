import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export const admin_list_paymentsRouter = Router();

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

admin_list_paymentsRouter.post('/', async (req: Request, res: Response) => {
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
    
        const supabaseClient = createClient(
          process.env.SUPABASE_URL ?? "",
          process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
          { auth: { persistSession: false } }
        );
    
        // Verify admin
        const authHeader = req.headers['Authorization'];
        if (!authHeader) throw new Error("No authorization header");
    
        const token = authHeader.replace("Bearer ", "");
        const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
        if (userError || !userData.user) throw new Error("User not authenticated");
    
        const { data: roleData } = await supabaseClient
          .from("user_roles")
          .select("role")
          .eq("user_id", userData.user.id)
          .eq("role", "admin")
          .single();
    
        if (!roleData) throw new Error("Admin access required");
        logStep("Admin verified", { userId: userData.user.id });
    
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");
    
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
        const url = new URL(req.url);
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const starting_after = url.searchParams.get("starting_after") || undefined;
    
        // Get payment intents
        const paymentIntents = await stripe.paymentIntents.list({
          limit,
          starting_after,
          expand: ["data.customer"],
        });
        logStep("Fetched payment intents", { count: paymentIntents.data.length });
    
        // Get balance
        const balance = await stripe.balance.retrieve();
        logStep("Fetched balance");
    
        // Get recent charges for refund info
        const charges = await stripe.charges.list({ limit: 100 });
    
        // Calculate stats
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfMonthTimestamp = Math.floor(startOfMonth.getTime() / 1000);
    
        const monthlyRevenue = paymentIntents.data
          .filter((pi: Stripe.PaymentIntent) => pi.status === "succeeded" && pi.created >= startOfMonthTimestamp)
          .reduce((sum: number, pi: Stripe.PaymentIntent) => sum + (pi.amount || 0), 0);
    
        const totalRefunds = charges.data
          .filter((c: Stripe.Charge) => c.refunded)
          .reduce((sum: number, c: Stripe.Charge) => sum + (c.amount_refunded || 0), 0);
    
        const successfulPayments = paymentIntents.data.filter((pi: Stripe.PaymentIntent) => pi.status === "succeeded").length;
    
        return new Response(JSON.stringify({
          payments: paymentIntents.data.map((pi: Stripe.PaymentIntent) => ({
            id: pi.id,
            amount: pi.amount,
            currency: pi.currency,
            status: pi.status,
            created: pi.created,
            customer_email: typeof pi.customer === "object" && pi.customer ? (pi.customer as Stripe.Customer).email : null,
            customer_name: typeof pi.customer === "object" && pi.customer ? (pi.customer as Stripe.Customer).name : null,
            description: pi.description,
            metadata: pi.metadata,
          })),
          has_more: paymentIntents.has_more,
          balance: {
            available: balance.available,
            pending: balance.pending,
          },
          stats: {
            monthly_revenue: monthlyRevenue,
            total_refunds: totalRefunds,
            successful_payments: successfulPayments,
            total_payments: paymentIntents.data.length,
          },
        }), {,
          status: 200,
        });
  } catch (error) {
    console.error('[admin_list_payments] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'admin-list-payments'
    });
  }
});
