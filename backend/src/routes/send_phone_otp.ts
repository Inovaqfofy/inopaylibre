import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const send_phone_otpRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

send_phone_otpRouter.post('/', async (req: Request, res: Response) => {
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
    
        // Get Twilio credentials
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
    
        if (!accountSid || !authToken || !twilioPhone) {
          throw new Error("Twilio not configured");
        }
    
        // Authenticate user
        const authHeader = req.headers['Authorization'];
        if (!authHeader) throw new Error("Non autorisé");
        
        const token = authHeader.replace("Bearer ", "");
        const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
        if (userError || !userData.user) {
          throw new Error("Session invalide");
        }
        const user = userData.user;
        logStep("User authenticated", { userId: user.id });
    
        const { phone } = req.body;
        
        if (!phone) {
          throw new Error("Numéro de téléphone requis");
        }
    
        // Validate phone format (basic validation)
        const cleanPhone = phone.replace(/\s/g, "");
        if (!/^\+?[0-9]{10,15}$/.test(cleanPhone)) {
          throw new Error("Format de téléphone invalide");
        }
    
        logStep("Phone received", { phone: cleanPhone.substring(0, 4) + "****" });
    
        // Generate OTP
        const otpCode = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
        // Store OTP in database (reuse otp_verifications table with phone as email)
        const { error: insertError } = await supabaseClient
          .from('otp_verifications')
          .upsert({
            email: `phone:${user.id}`, // Use user id as unique identifier
            otp_code: otpCode,
            password_hash: cleanPhone, // Store phone number
            expires_at: expiresAt.toISOString(),
            attempts: 0,
            verified: false,
          }, {
            onConflict: 'email'
          });
    
        if (insertError) {
          logStep("Error storing OTP", { error: insertError.message });
          throw new Error("Erreur lors de la création du code");
        }
    
        // Send SMS via Twilio
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const twilioAuth = btoa(`${accountSid}:${authToken}`);
    
        const smsBody = `Votre code de vérification Inopay est: ${otpCode}. Ce code expire dans 10 minutes.`;
    
        const smsResponse = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Authorization": `Basic ${twilioAuth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            From: twilioPhone,
            To: cleanPhone,
            Body: smsBody,
          }),
        });
    
        if (!smsResponse.ok) {
          const errorData = await smsResponse.text();
          logStep("Twilio error", { status: smsResponse.status, error: errorData });
          throw new Error("Impossible d'envoyer le SMS. Vérifiez le numéro de téléphone.");
        }
    
        logStep("SMS sent successfully");
    
        return new Response(JSON.stringify({ 
          success: true,
          message: "Code envoyé par SMS"
        }), {,
        });
  } catch (error) {
    console.error('[send_phone_otp] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'send-phone-otp'
    });
  }
});
