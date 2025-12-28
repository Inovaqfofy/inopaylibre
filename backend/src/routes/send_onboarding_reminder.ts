import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const send_onboarding_reminderRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

const resend = new Resend(process.env.RESEND_API_KEY);

send_onboarding_reminderRouter.post('/', async (req: Request, res: Response) => {
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
    
        // Get users who signed up 24h ago and haven't completed setup
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
        const twentyFiveHoursAgo = new Date();
        twentyFiveHoursAgo.setHours(twentyFiveHoursAgo.getHours() - 25);
    
        // Get users without any servers configured (wizard not completed)
        const { data: userServers } = await supabaseClient
          .from("user_servers")
          .select("user_id");
        
        const usersWithServers = new Set(userServers?.map(s => s.user_id) || []);
    
        // Get users without GitHub token configured
        const { data: userSettings } = await supabaseClient
          .from("user_settings")
          .select("user_id, github_token");
        
        const usersWithGithub = new Set(
          userSettings?.filter(s => s.github_token)?.map(s => s.user_id) || []
        );
    
        // List all users and filter those who need reminder
        const { data: authData } = await supabaseClient.auth.admin.listUsers();
        
        if (!authData?.users) {
          logStep("No users found");
          return new Response(JSON.stringify({ success: true, sent: 0 }), {,
          });
        }
    
        let totalSent = 0;
    
        for (const user of authData.users) {
          const createdAt = new Date(user.created_at);
          
          // Check if user was created between 24-25 hours ago
          if (createdAt < twentyFiveHoursAgo || createdAt > twentyFourHoursAgo) {
            continue;
          }
    
          // Check if wizard incomplete (no server OR no github)
          const hasServer = usersWithServers.has(user.id);
          const hasGithub = usersWithGithub.has(user.id);
          
          if (hasServer && hasGithub) {
            logStep("User already configured", { userId: user.id });
            continue;
          }
    
          // Check if we already sent this reminder
          const { data: existingLog } = await supabaseClient
            .from("email_logs")
            .select("id")
            .eq("user_id", user.id)
            .eq("subject", "⏳ Plus qu'une étape pour libérer votre premier projet...")
            .single();
    
          if (existingLog) {
            logStep("Reminder already sent", { userId: user.id });
            continue;
          }
    
          const userName = user.user_metadata?.full_name || user.email?.split('@')[0];
          const htmlContent = getReminderEmailTemplate(userName);
    
          try {
            await resend.emails.send({
              from: "Inopay <contact@getinopay.com>",
              to: [user.email!],
              subject: "⏳ Plus qu'une étape pour libérer votre premier projet...",
              html: htmlContent,
            });
    
            await supabaseClient.from("email_logs").insert({
              user_id: user.id,
              user_email: user.email!,
              subject: "⏳ Plus qu'une étape pour libérer votre premier projet...",
              status: "sent",
              sent_at: new Date().toISOString(),
            });
    
            totalSent++;
            logStep("Reminder sent", { to: user.email });
  } catch (error) {
    console.error('[send_onboarding_reminder] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'send-onboarding-reminder'
    });
  }
});
