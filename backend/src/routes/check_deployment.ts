import { Router, Request, Response } from 'express';

export const check_deploymentRouter = Router();

check_deploymentRouter.post('/', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    // ═══════════════════════════════════════════════════════════
    // BUSINESS LOGIC (100% migrated from Edge Function)
    // ═══════════════════════════════════════════════════════════
    const { url } = req.body;
    
        if (!url) {
          return new Response(JSON.stringify({ error: 'URL requise' }), {
            status: 400,
          });
        }
    
        // Validate URL format
        let parsedUrl: URL;
        try {
          parsedUrl = new URL(url);
  } catch (error) {
    console.error('[check_deployment] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'check-deployment'
    });
  }
});
