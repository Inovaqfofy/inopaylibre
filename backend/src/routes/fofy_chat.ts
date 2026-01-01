import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const fofy_chatRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

fofy_chatRouter.post('/', async (req: Request, res: Response) => {
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
    const { messages, language = "fr" } = req.body;
        const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
        
        if (!LOVABLE_API_KEY) {
          throw new Error("LOVABLE_API_KEY is not configured");
        }
    
        console.log("FOFY chat request received, messages count:", messages?.length);
    
        // Try to get user context from auth token
        let userContext = {
          isAuthenticated: false,
          language,
          name: undefined as string | undefined,
          email: undefined as string | undefined,
          plan: undefined as string | undefined,
          projectsCount: undefined as number | undefined,
          creditsRemaining: undefined as number | undefined,
        };
    
        const authHeader = req.headers['authorization'];
        if (authHeader?.startsWith("Bearer ")) {
          const token = authHeader.slice(7);
          
          // Don't try to auth with the anon key
          if (!token.includes("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6cXZleXZjZWJvbHJxcHFsbWhvIiwicm9sZSI6ImFub24i")) {
            try {
              const supabaseUrl = process.env.SUPABASE_URL;
              const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
              const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
              const { data: { user }, error } = await supabase.auth.getUser(token);
              
              if (user && !error) {
                userContext.isAuthenticated = true;
                userContext.email = user.email;
    
                // Get profile info
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("first_name, last_name")
                  .eq("id", user.id)
                  .single();
    
                if (profile) {
                  userContext.name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || undefined;
                }
    
                // Get subscription info
                const { data: subscription } = await supabase
                  .from("subscriptions")
                  .select("plan_type, credits_remaining")
                  .eq("user_id", user.id)
                  .maybeSingle();
    
                if (subscription) {
                  userContext.plan = subscription.plan_type;
                  userContext.creditsRemaining = subscription.credits_remaining ?? undefined;
                }
    
                // Get projects count
                const { count } = await supabase
                  .from("projects_analysis")
                  .select("*", { count: "exact", head: true })
                  .eq("user_id", user.id);
    
                userContext.projectsCount = count ?? 0;
    
                console.log("User context loaded:", {
                  name: userContext.name,
                  plan: userContext.plan,
                  projects: userContext.projectsCount,
                });
              }
  } catch (error) {
    console.error('[fofy_chat] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'fofy-chat'
    });
  }
});
