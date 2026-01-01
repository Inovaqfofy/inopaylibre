import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const send_emailRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

const resend = new Resend(process.env.RESEND_API_KEY);

send_emailRouter.post('/', async (req: Request, res: Response) => {
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
    // Vérifier l'authentification admin
        const authHeader = req.headers['Authorization'];
        if (!authHeader) {
          console.error("No authorization header provided");
          throw new Error("Non autorisé");
        }
    
        const supabase = createClient(
          process.env.SUPABASE_URL ?? "",
          process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
        );
    
        const token = authHeader.replace("Bearer ", "");
        const { data: userData, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !userData.user) {
          console.error("Auth error:", authError?.message);
          throw new Error("Non autorisé");
        }
    
        console.log("User authenticated:", userData.user.id);
    
        // Vérifier le rôle admin
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userData.user.id)
          .eq("role", "admin")
          .single();
    
        if (roleError || !roleData) {
          console.error("Role check failed:", roleError?.message);
          throw new Error("Accès admin requis");
        }
    
        console.log("Admin role verified");
    
        // Récupérer les paramètres
        const { to, subject, html } = req.body;
        
        if (!to || !subject || !html) {
          console.error("Missing parameters:", { to: !!to, subject: !!subject, html: !!html });
          throw new Error("Paramètres manquants: to, subject et html sont requis");
        }
    
        console.log("Sending email to:", to, "Subject:", subject);
    
        // Envoyer l'email via Resend
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
          console.error("RESEND_API_KEY not configured");
          throw new Error("Configuration Resend manquante");
        }
    
        const resend = new Resend(resendApiKey);
        const result = await resend.emails.send({
          from: "Inopay <contact@getinopay.com>",
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
        });
    
        console.log("Email sent successfully:", result);
    
        return new Response(JSON.stringify({ success: true, data: result }), {,
          status: 200,
        });
  } catch (error) {
    console.error('[send_email] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'send-email'
    });
  }
});
