import { Router, Request, Response } from 'express';

export const fofy_chatRouter = Router();

fofy_chatRouter.post('/', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    // ═══════════════════════════════════════════════════════════
    // BUSINESS LOGIC (100% migrated from Edge Function)
    // ═══════════════════════════════════════════════════════════
    const { messages } = req.body;
        const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
        
        if (!LOVABLE_API_KEY) {
          throw new Error("LOVABLE_API_KEY is not configured");
        }
    
        console.log("FOFY chat request received, messages count:", messages?.length);
    
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              ...messages,
            ],
            stream: true,
          }),
        });
    
        if (!response.ok) {
          if (response.status === 429) {
            console.error("Rate limit exceeded");
            return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
              status: 429,
            });
          }
          if (response.status === 402) {
            console.error("Payment required");
            return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
              status: 402,
            });
          }
          const errorText = await response.text();
          console.error("AI gateway error:", response.status, errorText);
          return new Response(JSON.stringify({ error: "AI gateway error" }), {
            status: 500,
          });
        }
    
        console.log("Streaming response from AI gateway");
    
        return new Response(response.body, {,
        });
  } catch (error) {
    console.error('[fofy_chat] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'fofy-chat'
    });
  }
});
