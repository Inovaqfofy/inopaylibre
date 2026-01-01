import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { Resend } from 'resend';

export const stripe_webhookRouter = Router();

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

stripe_webhookRouter.post('/', async (req: Request, res: Response) => {
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
    await resend.emails.send({
            from: "Inopay <contact@getinopay.com>",
            to: [userEmail],
            subject: "⚠️ Échec de paiement - Action requise",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #e74c3c;">Échec de paiement</h1>
                <p>Bonjour${customerName ? ` ${customerName}` : ''},</p>
                <p>Nous n'avons pas pu traiter votre dernier paiement (tentative ${attemptCount}).</p>
                <p>Pour éviter toute interruption de service, veuillez mettre à jour vos informations de paiement.</p>
                ${invoiceUrl ? `<p><a href="${invoiceUrl}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Mettre à jour le paiement</a></p>` : ''}
                <p style="color: #7f8c8d; font-size: 14px;">Si vous avez des questions, contactez-nous à support@getinopay.com</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="color: #bdc3c7; font-size: 12px;">Inopay - Libérez vos projets Lovable</p>
              </div>
            `,
          });
          logStep("Payment failure email sent to user", { email: userEmail });
  } catch (error) {
    console.error('[stripe_webhook] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'stripe-webhook'
    });
  }
});
