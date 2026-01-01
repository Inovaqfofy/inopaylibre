import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

export const estimate_cleaning_costRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

estimate_cleaning_costRouter.post('/', async (req: Request, res: Response) => {
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
    const supabaseClient = createClient(
          process.env.SUPABASE_URL ?? '',
          process.env.SUPABASE_ANON_KEY ?? ''
        );
    
        // Get user from auth header
        const authHeader = req.headers['Authorization'];
        let userId: string | null = null;
        
        if (authHeader) {
          const token = authHeader.replace('Bearer ', '');
          const { data: userData } = await supabaseClient.auth.getUser(token);
          userId = userData.user?.id || null;
        }
    
        const { files, projectName, excludedPaths = [] } = req.body;
    
        if (!files || !Array.isArray(files)) {
          return new Response(
            JSON.stringify({ error: 'Files array required' }),
            { status: 400 }
          );
        }
    
        // Analyze each file
        const fileInfos: FileInfo[] = [];
        let totalLines = 0;
        let totalChars = 0;
        let cleanableFiles = 0;
        let totalInputTokens = 0;
        let totalOutputTokens = 0;
    
        for (const file of files) {
          // Skip excluded paths
          const isExcluded = excludedPaths.some((path: string) => 
            file.path.startsWith(path) || file.path.includes(path)
          );
          
          if (isExcluded) continue;
    
          // Skip non-code files
          const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte', '.css', '.scss', '.html'];
          const hasCodeExtension = codeExtensions.some(ext => file.path.endsWith(ext));
          
          if (!hasCodeExtension) continue;
    
          const content = file.content || '';
          const lines = content.split('\n').length;
          const chars = content.length;
          const requiresCleaning = needsCleaning(content);
    
          totalLines += lines;
          totalChars += chars;
    
          if (requiresCleaning) {
            cleanableFiles++;
            const tokens = estimateTokens(chars, lines);
            totalInputTokens += tokens.input;
            totalOutputTokens += tokens.output;
          }
    
          fileInfos.push({
            path: file.path,
            lines,
            chars,
            needsCleaning: requiresCleaning,
          });
        }
    
        // Calculate costs
        const estimatedCostCents = calculateCost(totalInputTokens, totalOutputTokens);
        const marginCents = SALE_PRICE_CENTS - estimatedCostCents;
        const marginPercentage = ((marginCents / SALE_PRICE_CENTS) * 100);
        const isLargeProject = fileInfos.length > LARGE_PROJECT_FILES;
        const requiresAdminApproval = (estimatedCostCents / SALE_PRICE_CENTS) * 100 > MAX_MARGIN_PERCENTAGE;
    
        const result: EstimationResult = {
          totalFiles: fileInfos.length,
          cleanableFiles,
          totalLines,
          totalChars,
          estimatedInputTokens: totalInputTokens,
          estimatedOutputTokens: totalOutputTokens,
          estimatedCostCents,
          salePriceCents: SALE_PRICE_CENTS,
          marginCents,
          marginPercentage: parseFloat(marginPercentage.toFixed(2)),
          isLargeProject,
          requiresAdminApproval,
          files: fileInfos,
          excludedPaths,
        };
    
        // Store estimate if user is authenticated
        if (userId && projectName) {
          const supabaseAdmin = createClient(
            process.env.SUPABASE_URL ?? '',
            process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
          );
    
          await supabaseAdmin.from('cleaning_estimates').insert({
            user_id: userId,
            project_name: projectName,
            total_files: fileInfos.length,
            total_lines: totalLines,
            estimated_tokens: totalInputTokens + totalOutputTokens,
            estimated_cost_cents: estimatedCostCents,
            sale_price_cents: SALE_PRICE_CENTS,
            margin_cents: marginCents,
            margin_percentage: marginPercentage,
            requires_admin_approval: requiresAdminApproval,
            excluded_paths: excludedPaths,
            status: requiresAdminApproval ? 'pending_approval' : 'approved',
          });
        }
    
        console.log(`[ESTIMATE] Project: ${projectName}, Files: ${fileInfos.length}, Cleanable: ${cleanableFiles}, Cost: ${estimatedCostCents}¢, Margin: ${marginPercentage.toFixed(1)}%`);
    
        return new Response(
          JSON.stringify(result),
          { }
        );
  } catch (error) {
    console.error('[estimate_cleaning_cost] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'estimate-cleaning-cost'
    });
  }
});
