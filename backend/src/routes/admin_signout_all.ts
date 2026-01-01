import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const admin_signout_allRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

admin_signout_allRouter.post('/', async (req: Request, res: Response) => {
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
    
        const supabaseUrl = process.env.SUPABASE_URL ?? "";
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
        const anonKey = process.env.SUPABASE_ANON_KEY ?? "";
    
        if (!serviceRoleKey) {
          throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
        }
    
        // Verify the caller is an admin
        const authHeader = req.headers['Authorization'] ?? "";
        if (!authHeader) {
          throw new Error("No authorization header provided");
        }
    
        const token = authHeader.replace(/^Bearer\s+/i, "");
        const authClient = createClient(supabaseUrl, anonKey, {
          auth: { persistSession: false },
        });
    
        const { data: userData, error: userError } = await authClient.auth.getUser(token);
        if (userError || !userData.user) {
          throw new Error("Authentication failed");
        }
    
        logStep("User authenticated", { userId: userData.user.id });
    
        // Check if user is admin using service role client
        const supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false },
        });
    
        const { data: roleData } = await supabaseClient
          .from("user_roles")
          .select("role")
          .eq("user_id", userData.user.id)
          .maybeSingle();
    
        if (roleData?.role !== "admin") {
          logStep("Access denied - not admin", { userId: userData.user.id, role: roleData?.role });
          return new Response(JSON.stringify({ error: "Admin access required" }), {,
            status: 403,
          });
        }
    
        logStep("Admin access confirmed");
    
        // Use the Admin API to sign out all users
        const usersResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users?per_page=1000`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${serviceRoleKey}`,
            "apikey": serviceRoleKey,
            "Content-Type": "application/json",
          },
        });
    
        if (!usersResponse.ok) {
          const errorText = await usersResponse.text();
          logStep("Failed to fetch users", { status: usersResponse.status, error: errorText });
          throw new Error(`Failed to fetch users: ${usersResponse.status}`);
        }
    
        const usersData = await usersResponse.json();
        const users = usersData.users || usersData || [];
        logStep("Found users", { count: users.length });
    
        let signedOutCount = 0;
        const errors: string[] = [];
    
        // Sign out each user by temporarily banning then unbanning
        for (const user of users) {
          // Skip the current admin user
          if (user.id === userData.user.id) {
            logStep("Skipping current admin user", { userId: user.id });
            continue;
          }
    
          try {
            // Ban user briefly to invalidate sessions
            const banResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
              method: "PUT",
              headers: {
                "Authorization": `Bearer ${serviceRoleKey}`,
                "apikey": serviceRoleKey,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ ban_duration: "1s" }),
            });
    
            if (banResponse.ok) {
              // Immediately unban
              await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
                method: "PUT",
                headers: {
                  "Authorization": `Bearer ${serviceRoleKey}`,
                  "apikey": serviceRoleKey,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ ban_duration: "none" }),
              });
              signedOutCount++;
              logStep("User signed out", { userId: user.id });
            } else {
              const errorText = await banResponse.text();
              errors.push(`User ${user.id}: ${errorText}`);
            }
  } catch (error) {
    console.error('[admin_signout_all] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'admin-signout-all'
    });
  }
});
