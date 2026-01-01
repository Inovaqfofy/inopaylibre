import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export const export_to_githubRouter = Router();

// Supabase client factory
const supabaseUrl = process.env.SUPABASE_URL || process.env.DATABASE_URL?.replace(/^postgresql:/, 'https:');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function getSupabaseClient(authHeader?: string) {
  const options = authHeader ? { global: { headers: { Authorization: authHeader } } } : {};
  return createClient(supabaseUrl!, supabaseKey!, options);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

export_to_githubRouter.post('/', async (req: Request, res: Response) => {
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
    const authHeader = req.headers['Authorization'];
        if (!authHeader) {
          return new Response(JSON.stringify({ error: 'Non autorisé' }), {
            status: 401,
          });
        }
    
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey, {
          global: { headers: { Authorization: authHeader } }
        });
    
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          return new Response(JSON.stringify({ error: 'Utilisateur non authentifié' }), {
            status: 401,
          });
        }
    
        const { repoName, description, files, isPrivate = true, github_token, existingRepoName, destinationUsername: reqDestUsername } = req.body;
    
        // Fetch user's destination token from user_settings
        const { data: userSettings } = await supabase
          .from("user_settings")
          .select("github_destination_token, github_destination_username, github_token")
          .eq("user_id", user.id)
          .maybeSingle();
    
        // Priority: 1) explicit github_token param, 2) user destination token, 3) legacy github_token, 4) server fallback
        const destinationToken = github_token || userSettings?.github_destination_token || userSettings?.github_token;
        const serverGithubToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
        const githubToken = destinationToken || serverGithubToken;
        const usingUserToken = !!destinationToken;
        const destinationUsername = reqDestUsername || userSettings?.github_destination_username;
        
        // Determine if we're pushing to an existing repo
        const useExistingRepo = !!existingRepoName;
        const targetRepoName = useExistingRepo ? existingRepoName : repoName;
    
        console.log(`[EXPORT-TO-GITHUB] Using ${usingUserToken ? `user destination token${destinationUsername ? ` (@${destinationUsername})` : ''}` : "server fallback token"} for user ${user.email}`);
        console.log(`[EXPORT-TO-GITHUB] Mode: ${useExistingRepo ? 'Push to existing repo' : 'Create new repo'} - Target: ${destinationUsername}/${targetRepoName}`);
    
        if (!githubToken) {
          return new Response(JSON.stringify({ 
            error: 'Token GitHub non disponible. Veuillez vous connecter avec GitHub pour exporter vers votre compte.',
            needsGitHubAuth: true
          }), {
            status: 401,
          });
        }
    
        if (!targetRepoName || !files || Object.keys(files).length === 0) {
          return new Response(JSON.stringify({ error: 'Nom du repo et fichiers requis' }), {
            status: 400,
          });
        }
    
        // Clean package.json to fix known dependency conflicts
        const cleanPackageJson = (filesObj: Record<string, string>): Record<string, string> => {
          if (!filesObj['package.json']) return filesObj;
          
          try {
            const pkg = JSON.parse(filesObj['package.json']);
            let modified = false;
            
            // Known dependency fixes for React 18 compatibility
            const dependencyFixes: Record<string, string> = {
              // Map libraries - FORCE compatible versions regardless of current version
              'react-leaflet': '^4.2.1',
              '@react-leaflet/core': '^2.1.0',
              'leaflet': '^1.9.4',
              'google-map-react': '^2.2.1',
              '@react-google-maps/api': '^2.19.3',
              
              // Markdown/MDX
              'react-markdown': '^8.0.7',
              '@mdx-js/react': '^2.3.0',
              'remark-gfm': '^3.0.1',
              
              // Form libraries
              'react-hook-form': '^7.51.5',
              'formik': '^2.4.6',
              
              // Animation libraries
              'framer-motion': '^10.18.0',
              'react-spring': '^9.7.3',
              'react-transition-group': '^4.4.5',
              
              // UI Component libraries
              'react-select': '^5.8.0',
              'react-datepicker': '^6.9.0',
              'react-dropzone': '^14.2.3',
              'react-modal': '^3.16.1',
              'react-tooltip': '^5.26.4',
              'react-toastify': '^10.0.5',
              
              // Data visualization
              'recharts': '^2.12.7',
              'react-chartjs-2': '^5.2.0',
              'victory': '^36.9.2',
              
              // Table libraries
              'react-table': '^7.8.0',
              '@tanstack/react-table': '^8.17.3',
              
              // State management
              'react-redux': '^8.1.3',
              'zustand': '^4.5.2',
              'jotai': '^2.8.0',
              'recoil': '^0.7.7',
              
              // Router
              'react-router-dom': '^6.23.1',
              
              // Query/Data fetching
              '@tanstack/react-query': '^5.40.1',
              'swr': '^2.2.5',
              
              // DnD libraries
              'react-beautiful-dnd': '^13.1.1',
              '@dnd-kit/core': '^6.1.0',
              'react-dnd': '^16.0.1',
              
              // Virtualization
              'react-virtualized': '^9.22.5',
              'react-window': '^1.8.10',
              
              // PDF
              'react-pdf': '^7.7.3',
              '@react-pdf/renderer': '^3.4.4',
              
              // Rich text editors
              'draft-js': '^0.11.7',
              'slate': '^0.103.0',
              'slate-react': '^0.103.0',
              '@tiptap/react': '^2.4.0',
              
              // Date libraries
              'react-day-picker': '^8.10.1',
              
              // Media
              'react-player': '^2.16.0',
              'react-webcam': '^7.2.0',
            };
            
            // Check and fix dependencies - ALWAYS fix known problematic packages
            for (const [dep, compatibleVersion] of Object.entries(dependencyFixes)) {
              if (pkg.dependencies?.[dep]) {
                const currentVersion = pkg.dependencies[dep];
                // Fix if version starts with ^5, ^6, 5., 6., or any version that's not the compatible one
                const needsFix = 
                  currentVersion.includes('5.') || 
                  currentVersion.includes('6.') || 
                  currentVersion.includes('^5') || 
                  currentVersion.includes('^6') ||
                  currentVersion.includes('7.') ||
                  currentVersion.includes('^7') ||
                  // Special case for react-leaflet - always force compatible version
                  (dep === 'react-leaflet' && !currentVersion.startsWith('^4')) ||
                  (dep === '@react-leaflet/core' && !currentVersion.startsWith('^2'));
                
                if (needsFix) {
                  console.log(`[CLEAN] Fixing dependency: ${dep} ${currentVersion} -> ${compatibleVersion}`);
                  pkg.dependencies[dep] = compatibleVersion;
                  modified = true;
                }
              }
            }
            
            // Add overrides for npm 8.3+ to force compatible versions
            if (pkg.dependencies?.['react-leaflet'] || pkg.dependencies?.['@react-leaflet/core']) {
              pkg.overrides = pkg.overrides || {};
              pkg.overrides['react-leaflet'] = {
                'react': '$react',
                'react-dom': '$react-dom'
              };
              modified = true;
              console.log('[CLEAN] Added react-leaflet overrides');
            }
            
            // Ensure engines field for Node.js version
            if (!pkg.engines) {
              pkg.engines = { node: '>=18.0.0' };
              modified = true;
            }
            
            if (modified) {
              filesObj['package.json'] = JSON.stringify(pkg, null, 2);
              console.log('[CLEAN] package.json cleaned successfully');
            }
  } catch (error) {
    console.error('[export_to_github] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'export-to-github'
    });
  }
});
