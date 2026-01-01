import { Router, Request, Response } from 'express';
import { Resend } from 'resend';

export const send_newsletter_welcomeRouter = Router();

const resend = new Resend(process.env.RESEND_API_KEY);

send_newsletter_welcomeRouter.post('/', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    // ═══════════════════════════════════════════════════════════
    // BUSINESS LOGIC (100% migrated from Edge Function)
    // ═══════════════════════════════════════════════════════════
    const { email }: NewsletterWelcomeRequest = req.body;
    
        if (!email) {
          console.error("Missing email in request body");
          return new Response(
            JSON.stringify({ error: "Email is required" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }
    
        console.log(`Sending welcome email to: ${email}`);
    
        const htmlContent = `
          <!DOCTYPE html>
          <html lang="fr">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 40px 40px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                          Bienvenue dans la communauté Inopay !
                        </h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                          Bonjour,
                        </p>
                        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                          Merci de vous être inscrit à notre newsletter ! 🚀
                        </p>
                        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                          Vous recevrez désormais nos dernières actualités, conseils et astuces pour libérer votre code IA et le déployer sur votre propre VPS en quelques minutes.
                        </p>
                        
                        <!-- Features List -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                          <tr>
                            <td style="padding: 15px; background-color: #f0fdf4; border-radius: 8px; border-left: 4px solid #22c55e;">
                              <p style="color: #166534; font-size: 14px; margin: 0; font-weight: 600;">
                                ✨ Ce que vous recevrez :
                              </p>
                              <ul style="color: #374151; font-size: 14px; margin: 10px 0 0 0; padding-left: 20px; line-height: 1.8;">
                                <li>Guides de déploiement et bonnes pratiques</li>
                                <li>Nouveautés et mises à jour de la plateforme</li>
                                <li>Conseils pour optimiser vos coûts d'hébergement</li>
                                <li>Offres exclusives réservées aux abonnés</li>
                              </ul>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- CTA Button -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding: 20px 0;">
                              <a href="https://getinopay.com/dashboard" style="display: inline-block; background-color: #22c55e; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                Accéder à mon Dashboard
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                          À très bientôt,<br>
                          <strong style="color: #374151;">L'équipe Inopay</strong>
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f9fafb; padding: 30px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0 0 10px 0;">
                          © ${new Date().getFullYear()} Inopay. Tous droits réservés.
                        </p>
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                          De l'IA à la Production en 10 minutes
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `;
    
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Inopay <onboarding@resend.dev>",
            to: [email],
            subject: "🎉 Bienvenue dans la newsletter Inopay !",
            html: htmlContent,
          }),
        });
    
        const emailData = await emailResponse.json();
    
        if (!emailResponse.ok) {
          console.error("Resend API error:", emailData);
          throw new Error(emailData.message || "Failed to send email");
        }
    
        console.log("Welcome email sent successfully:", emailData);
    
        return new Response(JSON.stringify({ success: true, data: emailData }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
  } catch (error) {
    console.error('[send_newsletter_welcome] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'send-newsletter-welcome'
    });
  }
});
