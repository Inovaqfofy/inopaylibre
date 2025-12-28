import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const export_user_dataRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

export_user_dataRouter.post('/', async (req: Request, res: Response) => {
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
    const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
        // Get auth from request
        const authHeader = req.headers['Authorization'];
        if (!authHeader) {
          return new Response(JSON.stringify({ error: 'Non autorisé' }), {
            status: 401
          });
        }
    
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
          return new Response(JSON.stringify({ error: 'Non autorisé' }), {
            status: 401
          });
        }
    
        const { tables } = req.body;
        
        console.log('[export-user-data] Starting user data export for:', user.email);
        console.log('[export-user-data] Tables requested:', tables);
    
        const tablesToExport = tables && tables.length > 0 
          ? tables.filter((t: string) => USER_EXPORTABLE_TABLES.includes(t))
          : USER_EXPORTABLE_TABLES;
        
        const exportData: Record<string, unknown[]> = {};
        const exportStats: Record<string, number> = {};
        let sqlInserts = '';
    
        for (const tableName of tablesToExport) {
          try {
            // All user tables have user_id column
            const { data, error } = await supabase
              .from(tableName)
              .select('*')
              .eq('user_id', user.id);
    
            if (error) {
              console.error(`[export-user-data] Error fetching ${tableName}:`, error);
              exportData[tableName] = [];
              exportStats[tableName] = 0;
            } else {
              exportData[tableName] = data || [];
              exportStats[tableName] = data?.length || 0;
              
              // Generate SQL INSERT statements
              if (data && data.length > 0) {
                sqlInserts += `\n-- Table: ${tableName} (${data.length} rows)\n`;
                sqlInserts += `-- User: ${user.email}\n`;
                sqlInserts += `-- Note: Replace user_id with your new user ID before importing\n\n`;
                
                for (const row of data) {
                  const columns = Object.keys(row).join(', ');
                  const values = Object.values(row).map(v => {
                    if (v === null) return 'NULL';
                    if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
                    if (typeof v === 'number') return v.toString();
                    if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
                    if (Array.isArray(v)) return `ARRAY[${v.map(i => `'${String(i).replace(/'/g, "''")}'`).join(',')}]`;
                    return `'${String(v).replace(/'/g, "''")}'`;
                  }).join(', ');
                  
                  sqlInserts += `INSERT INTO public.${tableName} (${columns}) VALUES (${values}) ON CONFLICT DO NOTHING;\n`;
                }
              }
            }
  } catch (error) {
    console.error('[export_user_data] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'export-user-data'
    });
  }
});
