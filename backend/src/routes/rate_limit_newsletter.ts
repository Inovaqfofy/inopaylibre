import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const rate_limit_newsletterRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

rate_limit_newsletterRouter.post('/', async (req: Request, res: Response) => {
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
    const { email } = req.body;
    
        if (!email || typeof email !== 'string') {
          return new Response(
            JSON.stringify({ error: 'Email is required' }),
            { status: 400 }
          );
        }
    
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return new Response(
            JSON.stringify({ error: 'Invalid email format' }),
            { status: 400 }
          );
        }
    
        // Get client IP
        const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
          || req.headers['x-real-ip'] 
          || 'unknown';
    
        // Check IP rate limit
        const ipCheck = checkRateLimit(ipRateLimits, clientIP, MAX_SIGNUPS_PER_IP);
        if (!ipCheck.allowed) {
          console.log(`[rate-limit-newsletter] IP ${clientIP} rate limited`);
          return res.json({ 
              error: 'Too many signup attempts. Please try again later.',
              retry_after: Math.ceil((ipCheck.resetAt - Date.now() / 1000)
            }),
            { 
              status: 429 
            }
          );
        }
    
        // Check domain rate limit (to prevent abuse from disposable email services)
        const domain = getEmailDomain(email);
        const domainCheck = checkRateLimit(domainRateLimits, domain, MAX_SIGNUPS_PER_EMAIL_DOMAIN);
        if (!domainCheck.allowed) {
          console.log(`[rate-limit-newsletter] Domain ${domain} rate limited`);
          return res.json({ 
              error: 'Too many signups from this email provider. Please try again later.',
              retry_after: Math.ceil((domainCheck.resetAt - Date.now() / 1000)
            }),
            { 
              status: 429 
            }
          );
        }
    
        // Proceed with newsletter signup
        const supabase = createClient(
          process.env.SUPABASE_URL ?? '',
          process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
          { auth: { persistSession: false } }
        );
    
        const normalizedEmail = email.toLowerCase().trim();
    
        // Check if already subscribed
        const { data: existing } = await supabase
          .from('newsletter_subscribers')
          .select('id, is_active')
          .eq('email', normalizedEmail)
          .single();
    
        if (existing) {
          if (existing.is_active) {
            return new Response(
              JSON.stringify({ success: true, message: 'Already subscribed' }),
              { }
            );
          } else {
            // Reactivate subscription
            await supabase
              .from('newsletter_subscribers')
              .update({ is_active: true, unsubscribed_at: null })
              .eq('id', existing.id);
    
            return new Response(
              JSON.stringify({ success: true, message: 'Subscription reactivated' }),
              { }
            );
          }
        }
    
        // Create new subscription
        const { error: insertError } = await supabase
          .from('newsletter_subscribers')
          .insert({
            email: normalizedEmail,
            source: 'api_rate_limited',
            is_active: true
          });
    
        if (insertError) {
          console.error('[rate-limit-newsletter] Insert error:', insertError);
          return new Response(
            JSON.stringify({ error: 'Failed to subscribe' }),
            { status: 500 }
          );
        }
    
        console.log(`[rate-limit-newsletter] New subscription: ${normalizedEmail} from IP ${clientIP}`);
    
        return new Response(
          JSON.stringify({ success: true, message: 'Successfully subscribed' }),
          { }
        );
  } catch (error) {
    console.error('[rate_limit_newsletter] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'rate-limit-newsletter'
    });
  }
});
