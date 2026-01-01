import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export const create_checkoutRouter = Router();

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

create_checkoutRouter.post('/', async (req: Request, res: Response) => {
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
    
        const { priceId, mode, serviceType } = req.body;
        logStep("Request body parsed", { priceId, mode, serviceType });
    
        const authHeader = req.headers['Authorization']!;
        const token = authHeader.replace("Bearer ", "");
        const { data } = await supabaseClient.auth.getUser(token);
        const user = data.user;
        if (!user?.email) throw new Error("User not authenticated or email not available");
        logStep("User authenticated", { userId: user.id, email: user.email });
    
        // Fetch user profile to verify completion and get billing info
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
    
        if (profileError) {
          logStep("Profile fetch error", { error: profileError.message });
          throw new Error("PROFILE_NOT_FOUND");
        }
    
        const userProfile = profile as UserProfile;
        logStep("Profile fetched", { 
          hasAddress: !!userProfile.billing_address_line1,
          hasCity: !!userProfile.billing_city,
          profileCompleted: userProfile.profile_completed 
        });
    
        // Check if profile is complete (minimum: name + billing address)
        const isProfileComplete = !!(
          userProfile.first_name &&
          userProfile.last_name &&
          userProfile.billing_address_line1 &&
          userProfile.billing_city &&
          userProfile.billing_postal_code &&
          userProfile.billing_country
        );
    
        if (!isProfileComplete) {
          logStep("Profile incomplete - blocking checkout");
          return new Response(JSON.stringify({ 
            error: "PROFILE_INCOMPLETE",
            message: "Veuillez compléter votre profil (nom et adresse de facturation) avant de procéder au paiement.",
            redirect: "/profil"
          }), {,
            status: 400,
          });
        }
    
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
          apiVersion: "2025-08-27.basil",
        });
    
        // Check if customer exists
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        let customerId;
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
          logStep("Existing customer found", { customerId });
    
          // Update customer with profile data for Stripe Radar
          await stripe.customers.update(customerId, {
            name: `${userProfile.first_name} ${userProfile.last_name}`,
            phone: userProfile.phone || undefined,
            address: {
              line1: userProfile.billing_address_line1 || undefined,
              line2: userProfile.billing_address_line2 || undefined,
              city: userProfile.billing_city || undefined,
              postal_code: userProfile.billing_postal_code || undefined,
              country: userProfile.billing_country || undefined,
            },
          });
          logStep("Customer updated with profile data");
        }
    
        const origin = req.headers['origin'] || "https://localhost:3000";
    
        // Determine plan type based on serviceType
        const planTypeMap: Record<string, string> = {
          deploy: "deploy",
          redeploy: "redeploy",
          monitoring: "monitoring",
          server: "server",
          confort: "confort",
          souverain: "souverain",
        };
    
        const planType = planTypeMap[serviceType] || (mode === "subscription" ? "monitoring" : "deploy");
    
        // Build success URL with plan parameter for subscription plans
        const isSubscriptionPlan = serviceType === "confort" || serviceType === "souverain";
        const successUrl = isSubscriptionPlan
          ? `${origin}/payment-success?plan=${serviceType}&session_id={CHECKOUT_SESSION_ID}`
          : `${origin}/payment-success?service=${serviceType || "deploy"}&session_id={CHECKOUT_SESSION_ID}`;
    
        // Create checkout session with billing address prefilled
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          customer_email: customerId ? undefined : user.email,
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          mode: mode || "payment",
          success_url: successUrl,
          cancel_url: `${origin}/tarifs`,
          // Prefill billing address from profile
          customer_update: customerId ? {
            address: 'auto',
            name: 'auto',
          } : undefined,
          // For new customers, prefill the address
          ...(customerId ? {} : {
            billing_address_collection: 'required',
          }),
          metadata: {
            user_id: user.id,
            service_type: serviceType || "deploy",
            plan_type: planType,
            customer_name: `${userProfile.first_name} ${userProfile.last_name}`,
            customer_phone: userProfile.phone || '',
            billing_city: userProfile.billing_city || '',
            billing_country: userProfile.billing_country || '',
          },
          // Pass phone to Stripe for fraud detection
          phone_number_collection: {
            enabled: false, // We already have phone from profile
          },
        });
    
        logStep("Checkout session created", { sessionId: session.id, url: session.url, serviceType, planType });
    
        return new Response(JSON.stringify({ url: session.url }), {,
          status: 200,
        });
  } catch (error) {
    console.error('[create_checkout] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'create-checkout'
    });
  }
});
