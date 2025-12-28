import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const cleanup_storageRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

cleanup_storageRouter.post('/', async (req: Request, res: Response) => {
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
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        // Verify authentication
        const authHeader = req.headers['Authorization'];
        if (!authHeader) {
          console.error('No authorization header provided');
          return new Response(JSON.stringify({ error: 'Authorization required' }), {
            status: 401,
          });
        }
    
        // Create client with user's auth to verify identity
        const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } }
        });
    
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
        if (authError || !user) {
          console.error('Invalid authentication:', authError?.message);
          return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
            status: 401,
          });
        }
    
        // Check if user has admin role using the user_roles table
        const { data: roleData, error: roleError } = await supabaseAuth
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
    
        if (roleError || !roleData) {
          console.error('User is not an admin:', user.id);
          return new Response(JSON.stringify({ error: 'Admin access required' }), {
            status: 403,
          });
        }
    
        console.log('Admin user authenticated:', user.id);
        
        // Use service role to access storage admin functions
        const supabase = createClient(supabaseUrl, serviceRoleKey);
    
        console.log('Starting storage cleanup...');
    
        // Get all files from cleaned-archives bucket
        const { data: files, error: listError } = await supabase.storage
          .from('cleaned-archives')
          .list('', {
            limit: 1000,
            sortBy: { column: 'created_at', order: 'asc' }
          });
    
        if (listError) {
          console.error('Error listing files:', listError);
          return new Response(JSON.stringify({ error: 'Erreur lors de la liste des fichiers' }), {
            status: 500,
          });
        }
    
        // Calculate 24 hours ago timestamp
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const filesToDelete: string[] = [];
    
        // Files in cleaned-archives are organized by user_id folders
        // We need to list files within each folder
        for (const folder of files || []) {
          if (folder.id === null) {
            // This is a folder, list its contents
            const { data: folderFiles, error: folderError } = await supabase.storage
              .from('cleaned-archives')
              .list(folder.name, {
                limit: 1000,
                sortBy: { column: 'created_at', order: 'asc' }
              });
    
            if (folderError) {
              console.error(`Error listing folder ${folder.name}:`, folderError);
              continue;
            }
    
            for (const file of folderFiles || []) {
              if (file.created_at) {
                const fileDate = new Date(file.created_at);
                if (fileDate < twentyFourHoursAgo) {
                  filesToDelete.push(`${folder.name}/${file.name}`);
                }
              }
            }
          } else if (folder.created_at) {
            // This is a file at root level
            const fileDate = new Date(folder.created_at);
            if (fileDate < twentyFourHoursAgo) {
              filesToDelete.push(folder.name);
            }
          }
        }
    
        console.log(`Found ${filesToDelete.length} files older than 24 hours`);
    
        let deletedCount = 0;
        let errorCount = 0;
    
        // Delete old files in batches
        if (filesToDelete.length > 0) {
          const { data: deleteData, error: deleteError } = await supabase.storage
            .from('cleaned-archives')
            .remove(filesToDelete);
    
          if (deleteError) {
            console.error('Error deleting files:', deleteError);
            errorCount = filesToDelete.length;
          } else {
            deletedCount = deleteData?.length || filesToDelete.length;
            console.log(`Successfully deleted ${deletedCount} files`);
          }
        }
    
        return new Response(JSON.stringify({ 
          success: true,
          message: `Nettoyage terminé: ${deletedCount} fichiers supprimés, ${errorCount} erreurs`,
          deletedCount,
          errorCount,
          timestamp: new Date().toISOString()
        }), {,
        });
  } catch (error) {
    console.error('[cleanup_storage] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'cleanup-storage'
    });
  }
});
