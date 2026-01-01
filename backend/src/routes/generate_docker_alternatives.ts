import { Router, Request, Response } from 'express';

export const generate_docker_alternativesRouter = Router();

generate_docker_alternativesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization required' });
    }

    // ═══════════════════════════════════════════════════════════
    // BUSINESS LOGIC (100% migrated from Edge Function)
    // ═══════════════════════════════════════════════════════════
    const { services, projectName } = req.body;
    
        if (!services || !Array.isArray(services) || services.length === 0) {
          return new Response(
            JSON.stringify({ error: 'Services array required' }),
            { status: 400 }
          );
        }
    
        // Extract unique volumes from snippets
        const volumeNames = new Set<string>();
        const serviceSnippets: string[] = [];
    
        for (const service of services as ServiceAlternative[]) {
          serviceSnippets.push(service.dockerComposeSnippet);
          
          // Extract volume names from snippet
          const volumeMatches = service.dockerComposeSnippet.match(/(\w+_data):/g);
          if (volumeMatches) {
            volumeMatches.forEach(match => volumeNames.add(match.replace(":", "")));
          }
        }
    
        const volumes = Array.from(volumeNames).map(name => `  ${name}:`).join("\n");
    
        const dockerCompose = `version: "3.8"
    
    # ============================================
    # INOPAY - Alternatives Open Source
    # Projet: ${projectName || 'Mon Projet'}
    # Généré automatiquement par le Conseiller en Économies
    # ============================================
    
    services:
    ${serviceSnippets.join("\n\n")}
    
    volumes:
    ${volumes}
    
    # ============================================
    # Instructions de déploiement:
    # 1. Copiez ce fichier dans votre projet
    # 2. Lancez: docker-compose -f docker-compose.alternatives.yml up -d
    # 3. Mettez à jour vos variables d'environnement avec .env.alternatives
    # ============================================
    `;
    
        // Generate .env template
        const envConfigs: string[] = [
          "# ============================================",
          `# INOPAY - Configuration des alternatives Open Source`,
          `# Projet: ${projectName || 'Mon Projet'}`,
          "# Remplacez vos anciennes clés API par ces valeurs",
          "# ============================================",
          ""
        ];
    
        for (const service of services as ServiceAlternative[]) {
          envConfigs.push(`# ${service.name}`);
          envConfigs.push(service.configTemplate);
          envConfigs.push("");
        }
    
        const envTemplate = envConfigs.join("\n");
    
        console.log(`Generated docker-compose for ${services.length} services`);
    
        return new Response(
          JSON.stringify({ 
            dockerCompose,
            envTemplate,
            servicesCount: services.length
          }),
          { }
        );
  } catch (error) {
    console.error('[generate_docker_alternatives] Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      route: 'generate-docker-alternatives'
    });
  }
});
