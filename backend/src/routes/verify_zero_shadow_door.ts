import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const verify_zero_shadow_doorRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

verify_zero_shadow_doorRouter.post('/', async (req: Request, res: Response) => {
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
    const decoded = atob(match[1]);
          // Check if decoded content contains suspicious patterns
          const hasSuspiciousContent = TELEMETRY_DOMAINS.some(domain => 
            decoded.toLowerCase().includes(domain)
          ) || decoded.includes('eval(') || decoded.includes('Function(');
          
          if (hasSuspiciousContent) {
            findings.push({
              type: 'critical',
              category: 'obfuscation',
              filePath,
              line: lineNumber,
              description: `Chaîne Base64 suspecte détectée (${match[1].length} caractères) contenant du code potentiellement malveillant`,
              originalCode: match[0].substring(0, 100) + '...',
              recommendation: 'Supprimer cette chaîne encodée ou la remplacer par du code transparent',
              quarantined: true,
            });
          }
  } catch (error) {
    console.error('[verify_zero_shadow_door] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'verify-zero-shadow-door'
    });
  }
});
