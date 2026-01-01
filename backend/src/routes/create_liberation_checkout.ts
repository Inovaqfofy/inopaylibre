import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export const create_liberation_checkoutRouter = Router();

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

create_liberation_checkoutRouter.post('/', async (req: Request, res: Response) => {
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
    // Authenticate user
        const authHeader = req.headers['Authorization'];
        if (!authHeader) throw new Error("Non autorisé");
        
        const token = authHeader.replace("Bearer ", "");
        const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
        if (userError || !userData.user?.email) {
          throw new Error("Session invalide");
        }
        const user = userData.user;
    
        // Fetch user profile to verify completion and get billing info
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
    
        if (profileError) {
          console.log("[LIBERATION-CHECKOUT] Profile fetch error:", profileError.message);
          throw new Error("PROFILE_NOT_FOUND");
        }
    
        const userProfile = profile as UserProfile;
    
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
          console.log("[LIBERATION-CHECKOUT] Profile incomplete - blocking checkout");
          return new Response(JSON.stringify({ 
            error: "PROFILE_INCOMPLETE",
            message: "Veuillez compléter votre profil (nom et adresse de facturation) avant de procéder au paiement.",
            redirect: "/profil"
          }), {,
            status: 400,
          });
        }
    
        const body: LiberationQuoteRequest = req.body;
        const { projectName, projectId, totalFiles, maxFilesAllowed, filesData, selectedPaths } = body;
    
        // Calculate total chars from files
        const totalChars = filesData?.reduce((sum, f) => sum + f.content.length, 0) || (totalFiles * 5000);
    
        // Calculate volume supplement
        const { excessFiles, baseTokenCost, supplementAmount } = calculateVolumeSupplement(
          totalFiles,
          maxFilesAllowed,
          totalChars
        );
    
        console.log(`[LIBERATION-CHECKOUT] Quote for ${projectName}: ${excessFiles} excess files, supplement: ${supplementAmount}¢`);
    
        // Store pending payment record
        const { data: pendingPayment, error: insertError } = await supabaseClient
          .from('pending_liberation_payments')
          .insert({
            user_id: user.id,
            project_name: projectName,
            project_id: projectId,
            total_files: totalFiles,
            max_files_allowed: maxFilesAllowed,
            excess_files: excessFiles,
            base_token_cost_cents: baseTokenCost,
            inopay_margin_multiplier: INOPAY_MARGIN_MULTIPLIER,
            supplement_amount_cents: supplementAmount,
            files_data: filesData,
            selected_paths: selectedPaths,
            status: 'pending',
          })
          .select()
          .single();
    
        if (insertError) {
          console.error('Error creating pending payment:', insertError);
          throw new Error("Erreur lors de la création du devis");
        }
    
        // Initialize Stripe
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey) {
          // Return quote without payment link if Stripe not configured
          return new Response(JSON.stringify({
            success: true,
            quote: {
              id: pendingPayment.id,
              excessFiles,
              baseTokenCost,
              supplementAmount,
              supplementFormatted: `$${(supplementAmount / 100).toFixed(2)}`,
            },
            paymentUrl: null,
            message: "Devis calculé. Stripe non configuré.",
          }), {,
          });
        }
    
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" as any });
    
        // Check for existing customer
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        let customerId: string | undefined;
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
    
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
          console.log("[LIBERATION-CHECKOUT] Customer updated with profile data");
        }
    
        // Create dynamic price for the supplement
        const origin = req.headers['origin'] || "https://app.inopay.ca";
        
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          customer_email: customerId ? undefined : user.email,
          line_items: [
            {
              price_data: {
                currency: 'cad',
                product_data: {
                  name: `Supplément Volume - ${projectName}`,
                  description: `Libération complète: ${totalFiles} fichiers (${excessFiles} fichiers excédentaires)`,
                },
                unit_amount: supplementAmount,
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${origin}/dashboard?liberation=success&payment_id=${pendingPayment.id}`,
          cancel_url: `${origin}/dashboard?liberation=cancelled&payment_id=${pendingPayment.id}`,
          // Prefill billing address for new customers
          ...(customerId ? {} : {
            billing_address_collection: 'required',
          }),
          metadata: {
            type: 'liberation_supplement',
            pending_payment_id: pendingPayment.id,
            project_name: projectName,
            excess_files: String(excessFiles),
            customer_name: `${userProfile.first_name} ${userProfile.last_name}`,
            customer_phone: userProfile.phone || '',
            billing_city: userProfile.billing_city || '',
            billing_country: userProfile.billing_country || '',
          },
        });
    
        // Update pending payment with session ID
        await supabaseClient
          .from('pending_liberation_payments')
          .update({ stripe_checkout_session_id: session.id })
          .eq('id', pendingPayment.id);
    
        console.log(`[LIBERATION-CHECKOUT] Created checkout session ${session.id} for ${supplementAmount}¢`);
    
        return new Response(JSON.stringify({
          success: true,
          quote: {
            id: pendingPayment.id,
            excessFiles,
            baseTokenCost,
            supplementAmount,
            supplementFormatted: `$${(supplementAmount / 100).toFixed(2)} CAD`,
          },
          paymentUrl: session.url,
        }), {,
        });
  } catch (error) {
    console.error('[create_liberation_checkout] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'create-liberation-checkout'
    });
  }
});
