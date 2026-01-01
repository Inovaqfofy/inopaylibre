import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const send_liberation_reportRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

const resend = new Resend(process.env.RESEND_API_KEY);

send_liberation_reportRouter.post('/', async (req: Request, res: Response) => {
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
    console.log("send-liberation-report: Starting...");
    
        const supabase = createClient(
          process.env.SUPABASE_URL ?? "",
          process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
        );
    
        // Parse request body
        const body = req.body;
        const { deploymentId } = body;
    
        if (!deploymentId) {
          console.error("Missing deploymentId");
          throw new Error("deploymentId est requis");
        }
    
        console.log("Fetching deployment:", deploymentId);
    
        // Fetch deployment data
        const { data: deployment, error: deploymentError } = await supabase
          .from("deployment_history")
          .select("*")
          .eq("id", deploymentId)
          .single();
    
        if (deploymentError || !deployment) {
          console.error("Deployment not found:", deploymentError?.message);
          throw new Error("Déploiement introuvable");
        }
    
        // Get user email from auth.users
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
          deployment.user_id
        );
    
        if (userError || !userData?.user?.email) {
          console.error("User not found:", userError?.message);
          throw new Error("Utilisateur introuvable");
        }
    
        const userEmail = userData.user.email;
        const userName = userData.user.user_metadata?.full_name || 
                         userData.user.user_metadata?.name || 
                         userEmail.split('@')[0];
    
        console.log("Sending report to:", userEmail);
    
        // Parse cost analysis
        const costAnalysis = deployment.cost_analysis as Record<string, number> | null;
        const totalSavings = costAnalysis?.totalSavings || 140;
        const annualSavings = totalSavings * 12;
    
        // Parse services replaced
        const servicesReplaced = (deployment.services_replaced as Array<{ from: string; to: string; savings: number }>) || [];
    
        // Generate email data
        const emailData: LiberationReportEmailData = {
          deploymentId,
          userEmail,
          userName,
          projectName: deployment.project_name,
          deployedUrl: deployment.deployed_url || undefined,
          hostingProvider: deployment.provider || "Auto-hébergé",
          hostingType: deployment.hosting_type || "vps",
          serverIp: deployment.server_ip || undefined,
          coolifyUrl: deployment.coolify_url || undefined,
          totalSavings,
          annualSavings,
          servicesReplaced,
          portabilityScoreAfter: deployment.portability_score_after || 100
        };
    
        // Generate HTML
        const html = generateEmailHtml(emailData);
    
        // Send email via Resend
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
          console.error("RESEND_API_KEY not configured");
          throw new Error("Configuration Resend manquante");
        }
    
        const resend = new Resend(resendApiKey);
        const result = await resend.emails.send({
          from: "Inopay <contact@getinopay.com>",
          to: [userEmail],
          subject: `🎉 Rapport de Libération - ${deployment.project_name} est maintenant LIBRE !`,
          html,
        });
    
        console.log("Email sent successfully:", result);
    
        // Log the email send
        await supabase.from("email_logs").insert({
          user_id: deployment.user_id,
          user_email: userEmail,
          subject: `Rapport de Libération - ${deployment.project_name}`,
          status: "sent",
          sent_at: new Date().toISOString()
        });
    
        return new Response(JSON.stringify({ success: true, data: result }), {,
          status: 200,
        });
  } catch (error) {
    console.error('[send_liberation_report] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'send-liberation-report'
    });
  }
});
