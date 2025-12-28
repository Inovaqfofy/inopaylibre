import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const send_liberation_successRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

const resend = new Resend(process.env.RESEND_API_KEY);

send_liberation_successRouter.post('/', async (req: Request, res: Response) => {
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
    
        const resendKey = process.env.RESEND_API_KEY;
        if (!resendKey) throw new Error("RESEND_API_KEY not set");
    
        const resend = new Resend(resendKey);
    
        const supabaseClient = createClient(
          process.env.SUPABASE_URL ?? "",
          process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
          { auth: { persistSession: false } }
        );
    
        const { userId, projectName, vpsIp, githubUrl } = req.body;
    
        if (!userId || !projectName) {
          throw new Error("userId and projectName are required");
        }
    
        // Get user info
        const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(userId);
        
        if (userError || !userData.user?.email) {
          throw new Error("User not found");
        }
    
        const userName = userData.user.user_metadata?.full_name || userData.user.email.split('@')[0];
        const userEmail = userData.user.email;
    
        logStep("Sending success email", { to: userEmail, project: projectName });
    
        const htmlContent = getSuccessEmailTemplate(userName, projectName, vpsIp || '', githubUrl || '');
    
        const result = await resend.emails.send({
          from: "Inopay <contact@getinopay.com>",
          to: [userEmail],
          subject: `✅ Mission accomplie : ${projectName} est désormais souverain !`,
          html: htmlContent,
        });
    
        // Log the email
        await supabaseClient.from("email_logs").insert({
          user_id: userId,
          user_email: userEmail,
          subject: `✅ Mission accomplie : ${projectName} est désormais souverain !`,
          status: "sent",
          sent_at: new Date().toISOString(),
        });
    
        logStep("Success email sent", { result });
    
        return new Response(JSON.stringify({ success: true, data: result }), {,
          status: 200,
        });
  } catch (error) {
    console.error('[send_liberation_success] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'send-liberation-success'
    });
  }
});
