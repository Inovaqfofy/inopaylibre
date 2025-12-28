import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const send_welcome_emailRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

const resend = new Resend(process.env.RESEND_API_KEY);

send_welcome_emailRouter.post('/', async (req: Request, res: Response) => {
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
    const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
          console.error("RESEND_API_KEY not configured");
          throw new Error("Email configuration missing");
        }
    
        const supabase = createClient(
          process.env.SUPABASE_URL ?? "",
          process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
        );
    
        const { userId, email, name } = req.body;
        
        if (!email) {
          throw new Error("Email required");
        }
    
        console.log("Sending welcome email to:", email);
    
        // Get user language preference
        let userLanguage = "fr"; // Default to French
        
        if (userId) {
          const { data: settings } = await supabase
            .from("user_settings")
            .select("language")
            .eq("user_id", userId)
            .single();
          
          if (settings?.language) {
            userLanguage = settings.language;
          }
        }
    
        console.log("User language preference:", userLanguage);
    
        // Generate HTML template based on language
        const htmlContent = userLanguage === "en" 
          ? getWelcomeEmailTemplateEN(name || "", email)
          : getWelcomeEmailTemplateFR(name || "", email);
    
        // Choose subject based on language
        const subject = userLanguage === "en"
          ? "🚀 Welcome to Inopay – Take ownership of your code"
          : "🚀 Bienvenue chez Inopay – Préparez-vous à la souveraineté";
    
        // Send via Resend
        const resend = new Resend(resendApiKey);
        const result = await resend.emails.send({
          from: "Inopay <contact@getinopay.com>",
          to: [email],
          subject,
          html: htmlContent,
        });
    
        console.log("Welcome email sent:", result);
    
        // Log email in database
        if (userId) {
          await supabase.from("email_logs").insert({
            user_id: userId,
            user_email: email,
            subject,
            status: "sent",
            sent_at: new Date().toISOString(),
          });
        }
    
        return new Response(
          JSON.stringify({ success: true, data: result }),
          {,
            status: 200,
          }
        );
  } catch (error) {
    console.error('[send_welcome_email] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'send-welcome-email'
    });
  }
});
