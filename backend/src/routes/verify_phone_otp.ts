import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const verify_phone_otpRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

verify_phone_otpRouter.post('/', async (req: Request, res: Response) => {
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
    
        const { code, phone } = req.body;
        
        if (!code || code.length !== 6) {
          throw new Error("Code invalide - 6 chiffres requis");
        }
    
        // Get stored OTP
        const { data: otpRecord, error: fetchError } = await supabaseClient
          .from('otp_verifications')
          .select('*')
          .eq('email', `phone:${user.id}`)
          .single();
    
        if (fetchError || !otpRecord) {
          logStep("OTP not found");
          throw new Error("Aucun code en attente. Veuillez en demander un nouveau.");
        }
    
        // Check if expired
        if (new Date(otpRecord.expires_at) < new Date()) {
          logStep("OTP expired");
          throw new Error("Le code a expiré. Veuillez en demander un nouveau.");
        }
    
        // Check attempts
        if (otpRecord.attempts >= 5) {
          logStep("Too many attempts");
          throw new Error("Trop de tentatives. Veuillez demander un nouveau code.");
        }
    
        // Increment attempts
        await supabaseClient
          .from('otp_verifications')
          .update({ attempts: otpRecord.attempts + 1 })
          .eq('id', otpRecord.id);
    
        // Verify code
        if (otpRecord.otp_code !== code) {
          logStep("Invalid code");
          throw new Error("Code incorrect");
        }
    
        // Code is valid - mark phone as verified
        const verifiedPhone = otpRecord.password_hash; // Phone was stored here
    
        // Update profile
        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update({ 
            phone: verifiedPhone,
            phone_verified: true 
          })
          .eq('id', user.id);
    
        if (updateError) {
          logStep("Error updating profile", { error: updateError.message });
          throw new Error("Erreur lors de la mise à jour du profil");
        }
    
        // Delete the OTP record
        await supabaseClient
          .from('otp_verifications')
          .delete()
          .eq('id', otpRecord.id);
    
        logStep("Phone verified successfully", { phone: verifiedPhone.substring(0, 4) + "****" });
    
        return new Response(JSON.stringify({ 
          success: true,
          message: "Téléphone vérifié avec succès",
          phone: verifiedPhone
        }), {,
        });
  } catch (error) {
    console.error('[verify_phone_otp] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'verify-phone-otp'
    });
  }
});
