import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const admin_manage_testerRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

admin_manage_testerRouter.post('/', async (req: Request, res: Response) => {
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
    
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    
        // Use anon key client for auth check
        const anonClient = createClient(supabaseUrl, supabaseAnonKey);
        
        // Verify the requesting user is admin
        const authHeader = req.headers['Authorization'];
        if (!authHeader) {
          throw new Error("No authorization header");
        }
    
        const token = authHeader.replace("Bearer ", "");
        const { data: userData, error: userError } = await anonClient.auth.getUser(token);
        
        if (userError || !userData.user) {
          throw new Error("Invalid token");
        }
    
        logStep("User authenticated", { userId: userData.user.id });
    
        // Use service role client for admin operations
        const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { persistSession: false },
        });
    
        // Check if user is admin
        const { data: roleData, error: roleError } = await adminClient
          .from("user_roles")
          .select("role")
          .eq("user_id", userData.user.id)
          .maybeSingle();
    
        if (roleError || roleData?.role !== "admin") {
          throw new Error("Unauthorized: Admin access required");
        }
    
        logStep("Admin verified");
    
        // Parse request body
        const { action, email, user_id } = req.body;
        logStep("Request received", { action, email, user_id });
    
        if (action === "add") {
          if (!email) {
            throw new Error("Email is required");
          }
    
          // Find user by email
          const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers({
            perPage: 1000,
          });
    
          if (authError) {
            throw new Error(`Failed to list users: ${authError.message}`);
          }
    
          const targetUser = authUsers.users.find(
            (u) => u.email?.toLowerCase() === email.toLowerCase()
          );
    
          if (!targetUser) {
            throw new Error("Utilisateur non trouvé. Vérifiez que l'email est correct et que l'utilisateur est inscrit.");
          }
    
          logStep("Target user found", { targetUserId: targetUser.id });
    
          // Check if subscription exists
          const { data: existingSub } = await adminClient
            .from("subscriptions")
            .select("*")
            .eq("user_id", targetUser.id)
            .maybeSingle();
    
          if (existingSub) {
            // Update existing subscription
            const { error } = await adminClient
              .from("subscriptions")
              .update({
                plan_type: "pro",
                status: "active",
                credits_remaining: 999999,
                free_credits: 999999,
                current_period_end: "2099-12-31",
              })
              .eq("user_id", targetUser.id);
    
            if (error) {
              logStep("Update error", { error });
              throw new Error(`Failed to update subscription: ${error.message}`);
            }
            logStep("Subscription updated");
          } else {
            // Create new subscription
            const { error } = await adminClient
              .from("subscriptions")
              .insert({
                user_id: targetUser.id,
                plan_type: "pro",
                status: "active",
                credits_remaining: 999999,
                free_credits: 999999,
                current_period_end: "2099-12-31",
              });
    
            if (error) {
              logStep("Insert error", { error });
              throw new Error(`Failed to create subscription: ${error.message}`);
            }
            logStep("Subscription created");
          }
    
          return new Response(JSON.stringify({ success: true, message: `${email} ajouté comme testeur` }), {,
            status: 200,
          });
    
        } else if (action === "remove") {
          if (!user_id) {
            throw new Error("User ID is required");
          }
    
          // Reset to free plan
          const { error } = await adminClient
            .from("subscriptions")
            .update({
              plan_type: "free",
              status: "inactive",
              credits_remaining: 0,
              free_credits: 0,
              current_period_end: null,
            })
            .eq("user_id", user_id);
    
          if (error) {
            logStep("Remove error", { error });
            throw new Error(`Failed to remove tester: ${error.message}`);
          }
    
          logStep("Tester removed");
    
          return new Response(JSON.stringify({ success: true, message: "Testeur retiré" }), {,
            status: 200,
          });
    
        } else {
          throw new Error("Invalid action. Use 'add' or 'remove'.");
        }
  } catch (error) {
    console.error('[admin_manage_tester] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'admin-manage-tester'
    });
  }
});
