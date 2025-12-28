import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const fetch_github_repoRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

fetch_github_repoRouter.post('/', async (req: Request, res: Response) => {
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
    const zipBlob = await zipResponse.blob();
        logStep("Blob created", { size: zipBlob.size });
        
        // Check blob size (rough estimate)
        const blobSizeKB = zipBlob.size / 1024;
        if (blobSizeKB > MAX_REPO_SIZE_KB) {
          throw new Error(`TAILLE_EXCESSIVE: Le dépôt compressé fait ${Math.round(blobSizeKB / 1024)}MB, ce qui dépasse la limite de ${MAX_REPO_SIZE_KB / 1024}MB.`);
        }
        
        zipReader = new ZipReader(new BlobReader(zipBlob));
        logStep("ZipReader created, extracting entries...");
        
        // 3. Get all entries
        const entries = await zipReader.getEntries();
        logStep("Entries retrieved", { count: entries.length });
    
        // 4. Filter text files to analyze
        const textEntries: Array<{ entry: typeof entries[0]; cleanPath: string }> = [];
        
        for (const entry of entries) {
          if (entry.directory) continue;
          
          // Remove the root folder prefix (e.g., "owner-repo-sha/")
          const pathParts = entry.filename.split('/');
          const cleanPath = pathParts.slice(1).join('/');
          
          if (cleanPath && !shouldSkipPath(cleanPath) && isTextFile(cleanPath)) {
            textEntries.push({ entry, cleanPath });
          }
        }
    
        logStep("Text files filtered", { count: textEntries.length });
    
        // 5. Sort by priority
        textEntries.sort((a, b) => {
          const aIsPriority = isPriorityFile(a.cleanPath);
          const bIsPriority = isPriorityFile(b.cleanPath);
          if (aIsPriority && !bIsPriority) return -1;
          if (!aIsPriority && bIsPriority) return 1;
          
          // Within priority files, sort by pattern order
          if (aIsPriority && bIsPriority) {
            const aScore = PRIORITY_PATTERNS.findIndex(p => p.test(a.cleanPath));
            const bScore = PRIORITY_PATTERNS.findIndex(p => p.test(b.cleanPath));
            return aScore - bScore;
          }
          
          return 0;
        });
    
        // 6. Limit files based on plan
        const totalFiles = textEntries.length;
        const limitedEntries = maxFiles > 0 
          ? textEntries.slice(0, maxFiles) 
          : textEntries;
    
        logStep("Files selected for extraction", { 
          selected: limitedEntries.length, 
          total: totalFiles,
          limit: maxFiles 
        });
    
        // 7. Extract text content from each file in batches
        const files: FileContent[] = [];
        const BATCH_SIZE = 50; // Process 50 files at a time
        
        for (let i = 0; i < limitedEntries.length; i += BATCH_SIZE) {
          const batch = limitedEntries.slice(i, i + BATCH_SIZE);
          logStep(`Extracting batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(limitedEntries.length / BATCH_SIZE)}`, {
            from: i,
            to: Math.min(i + BATCH_SIZE, limitedEntries.length)
          });
          
          for (const { entry, cleanPath } of batch) {
            try {
              if (!entry.getData) {
                logStep("Entry has no getData method", { path: cleanPath });
                continue;
              }
              
              const writer = new TextWriter();
              const content = await entry.getData(writer);
              
              // Skip very large files (> 300KB for faster processing)
              if (content && content.length < 300000) {
                files.push({ path: cleanPath, content });
              } else if (content && content.length >= 300000) {
                logStep("File too large, skipping", { path: cleanPath, size: content.length });
              }
  } catch (error) {
    console.error('[fetch_github_repo] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'fetch-github-repo'
    });
  }
});
