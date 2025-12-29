// ============================================
// INOPAY COST OPTIMIZATION ENGINE
// Base de connaissances des services coûteux et alternatives Open Source
// ============================================

export interface CostlyServiceDefinition {
  id: string;
  name: string;
  category: "ai" | "vectordb" | "auth" | "search" | "realtime" | "email" | "storage" | "analytics" | "database";
  patterns: string[];
  envPatterns: string[];
  averageMonthlyCost: number;
  description: string;
  alternative: {
    name: string;
    dockerImage: string;
    dockerComposeSnippet: string;
    selfHostedCost: number;
    complexity: "low" | "medium" | "high";
    configTemplate: string;
    codeReplacement: {
      from: string[];
      to: string;
      instructions: string;
    };
  };
}

export interface CostlyServiceDetection {
  service: CostlyServiceDefinition;
  detectedIn: { file: string; line?: number; pattern: string; type: "dependency" | "import" | "env" | "code" }[];
  estimatedMonthlyCost: number;
}

export interface CostAnalysisResult {
  totalMonthlyCost: number;
  potentialSavings: number;
  yearlyProjection: number;
  detectedServices: CostlyServiceDetection[];
  savingsLevel: "none" | "low" | "medium" | "high";
  savingsScore: number; // 0-100
}

export const COSTLY_SERVICES: CostlyServiceDefinition[] = [
  // =========== AI / LLM ===========
  {
    id: "openai",
    name: "OpenAI",
    category: "ai",
    patterns: ["openai", "@openai/", "gpt-3", "gpt-4", "dall-e", "whisper"],
    envPatterns: ["OPENAI_API_KEY", "OPENAI_ORG_ID"],
    averageMonthlyCost: 50,
    description: "API de modèles de langage GPT-3/4, DALL-E, Whisper",
    alternative: {
      name: "Ollama",
      dockerImage: "ollama/ollama:latest",
      dockerComposeSnippet: `  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    restart: unless-stopped
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    environment:
      - OLLAMA_HOST=0.0.0.0`,
      selfHostedCost: 0,
      complexity: "medium",
      configTemplate: "OLLAMA_BASE_URL=http://ollama:11434",
      codeReplacement: {
        from: ["new OpenAI({", "openai.chat.completions.create"],
        to: "Ollama HTTP API",
        instructions: "Remplacer les appels OpenAI par des requêtes HTTP vers Ollama (/api/chat)"
      }
    }
  },
  {
    id: "anthropic",
    name: "Anthropic (Claude)",
    category: "ai",
    patterns: ["anthropic", "@anthropic-ai/", "claude-3", "claude-2"],
    envPatterns: ["ANTHROPIC_API_KEY"],
    averageMonthlyCost: 40,
    description: "API Claude d'Anthropic pour le traitement du langage",
    alternative: {
      name: "Ollama + Llama 3.1",
      dockerImage: "ollama/ollama:latest",
      dockerComposeSnippet: `  ollama:
    image: ollama/ollama:latest
    container_name: ollama-claude-alt
    restart: unless-stopped
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama`,
      selfHostedCost: 0,
      complexity: "medium",
      configTemplate: "OLLAMA_BASE_URL=http://ollama:11434\nOLLAMA_MODEL=llama3.1",
      codeReplacement: {
        from: ["@anthropic-ai/sdk", "Anthropic(", "anthropic.messages.create"],
        to: "Ollama HTTP API",
        instructions: "Utiliser Ollama avec un modèle Llama 3.1 comme alternative à Claude"
      }
    }
  },
  // =========== Vector DB ===========
  {
    id: "pinecone",
    name: "Pinecone",
    category: "vectordb",
    patterns: ["pinecone", "@pinecone-database/pinecone", "pinecone-client"],
    envPatterns: ["PINECONE_API_KEY", "PINECONE_ENVIRONMENT", "PINECONE_INDEX"],
    averageMonthlyCost: 70,
    description: "Base de données vectorielle cloud",
    alternative: {
      name: "PGVector (PostgreSQL)",
      dockerImage: "ankane/pgvector:latest",
      dockerComposeSnippet: `  postgres-vector:
    image: ankane/pgvector:latest
    container_name: pgvector
    restart: unless-stopped
    ports:
      - "5433:5432"
    volumes:
      - pgvector_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=vectordb
      - POSTGRES_PASSWORD=vectordb_secret
      - POSTGRES_DB=vectors`,
      selfHostedCost: 0,
      complexity: "low",
      configTemplate: "VECTOR_DATABASE_URL=postgresql://vectordb:vectordb_secret@postgres-vector:5432/vectors",
      codeReplacement: {
        from: ["@pinecone-database/pinecone", "PineconeClient"],
        to: "pg avec extension pgvector",
        instructions: "Utiliser PostgreSQL avec l'extension pgvector"
      }
    }
  },
  // =========== Auth ===========
  {
    id: "clerk",
    name: "Clerk",
    category: "auth",
    patterns: ["@clerk/", "clerk-sdk", "@clerk/nextjs"],
    envPatterns: ["CLERK_SECRET_KEY", "CLERK_PUBLISHABLE_KEY"],
    averageMonthlyCost: 25,
    description: "Service d'authentification SaaS",
    alternative: {
      name: "Supabase Auth (Self-hosted)",
      dockerImage: "supabase/gotrue:latest",
      dockerComposeSnippet: `  auth:
    image: supabase/gotrue:latest
    container_name: supabase-auth
    ports:
      - "9999:9999"
    environment:
      - GOTRUE_DB_DRIVER=postgres
      - DATABASE_URL=postgres://supabase:secret@db:5432/supabase`,
      selfHostedCost: 0,
      complexity: "medium",
      configTemplate: "SUPABASE_AUTH_URL=http://auth:9999",
      codeReplacement: {
        from: ["@clerk/react", "ClerkProvider", "useUser"],
        to: "@supabase/supabase-js",
        instructions: "Remplacer Clerk par Supabase Auth"
      }
    }
  },
  // =========== Search ===========
  {
    id: "algolia",
    name: "Algolia",
    category: "search",
    patterns: ["algoliasearch", "@algolia/"],
    envPatterns: ["ALGOLIA_API_KEY", "ALGOLIA_APP_ID"],
    averageMonthlyCost: 35,
    description: "Recherche full-text cloud",
    alternative: {
      name: "Meilisearch",
      dockerImage: "getmeili/meilisearch:latest",
      dockerComposeSnippet: `  meilisearch:
    image: getmeili/meilisearch:latest
    container_name: meilisearch
    ports:
      - "7700:7700"
    volumes:
      - meilisearch_data:/meili_data
    environment:
      - MEILI_MASTER_KEY=your-master-key`,
      selfHostedCost: 0,
      complexity: "low",
      configTemplate: "MEILISEARCH_URL=http://meilisearch:7700",
      codeReplacement: {
        from: ["algoliasearch", "index.search"],
        to: "meilisearch client",
        instructions: "Remplacer Algolia par Meilisearch"
      }
    }
  },
  // =========== Realtime ===========
  {
    id: "pusher",
    name: "Pusher",
    category: "realtime",
    patterns: ["pusher-js", "pusher"],
    envPatterns: ["PUSHER_APP_KEY", "PUSHER_APP_SECRET"],
    averageMonthlyCost: 49,
    description: "WebSockets temps réel",
    alternative: {
      name: "Soketi",
      dockerImage: "quay.io/soketi/soketi:1.6-16-debian",
      dockerComposeSnippet: `  soketi:
    image: quay.io/soketi/soketi:1.6-16-debian
    ports:
      - "6001:6001"
    environment:
      - SOKETI_DEFAULT_APP_ID=app-id`,
      selfHostedCost: 0,
      complexity: "low",
      configTemplate: "PUSHER_HOST=soketi\nPUSHER_PORT=6001",
      codeReplacement: {
        from: ["pusher-js", "Pusher({"],
        to: "Soketi",
        instructions: "Soketi est compatible avec le SDK Pusher"
      }
    }
  },
  // =========== Email ===========
  {
    id: "resend",
    name: "Resend",
    category: "email",
    patterns: ["resend", "@resend/"],
    envPatterns: ["RESEND_API_KEY"],
    averageMonthlyCost: 20,
    description: "API d'envoi d'emails",
    alternative: {
      name: "Mailpit + SMTP",
      dockerImage: "axllent/mailpit:latest",
      dockerComposeSnippet: `  mailpit:
    image: axllent/mailpit:latest
    ports:
      - "1025:1025"
      - "8025:8025"`,
      selfHostedCost: 0,
      complexity: "low",
      configTemplate: "SMTP_HOST=mailpit\nSMTP_PORT=1025",
      codeReplacement: {
        from: ["resend.emails.send"],
        to: "nodemailer",
        instructions: "Utiliser nodemailer avec SMTP"
      }
    }
  },
  // =========== Storage ===========
  {
    id: "cloudinary",
    name: "Cloudinary",
    category: "storage",
    patterns: ["cloudinary", "@cloudinary/"],
    envPatterns: ["CLOUDINARY_URL"],
    averageMonthlyCost: 45,
    description: "Gestion d'images cloud",
    alternative: {
      name: "MinIO",
      dockerImage: "minio/minio:latest",
      dockerComposeSnippet: `  minio:
    image: minio/minio:latest
    ports:
      - "9000:9000"
    volumes:
      - minio_data:/data`,
      selfHostedCost: 0,
      complexity: "medium",
      configTemplate: "S3_ENDPOINT=http://minio:9000",
      codeReplacement: {
        from: ["cloudinary.uploader.upload"],
        to: "AWS S3 SDK (MinIO)",
        instructions: "Utiliser le SDK S3 pointant vers MinIO"
      }
    }
  },
  // =========== Database ===========
  {
    id: "neon",
    name: "Neon",
    category: "database",
    patterns: ["@neondatabase/serverless"],
    envPatterns: ["NEON_DATABASE_URL", "DATABASE_URL"],
    averageMonthlyCost: 19,
    description: "PostgreSQL serverless",
    alternative: {
      name: "PostgreSQL Standard",
      dockerImage: "postgres:16-alpine",
      dockerComposeSnippet: `  postgres:
    image: postgres:16-alpine
    container_name: postgres
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_PASSWORD=secret`,
      selfHostedCost: 0,
      complexity: "low",
      configTemplate: "DATABASE_URL=postgresql://postgres:secret@postgres:5432/app",
      codeReplacement: {
        from: ["@neondatabase/serverless"],
        to: "pg",
        instructions: "Utiliser le driver pg standard"
      }
    }
  }
];

export const COST_CATEGORIES = {
  ai: { label: "IA / LLM", icon: "🤖", color: "purple" },
  vectordb: { label: "Base Vectorielle", icon: "🧮", color: "blue" },
  auth: { label: "Authentification", icon: "🔐", color: "green" },
  search: { label: "Recherche", icon: "🔍", color: "yellow" },
  realtime: { label: "Temps Réel", icon: "⚡", color: "orange" },
  email: { label: "Email", icon: "📧", color: "pink" },
  storage: { label: "Stockage", icon: "💾", color: "cyan" },
  analytics: { label: "Analytics", icon: "📊", color: "indigo" },
  database: { label: "Base de données", icon: "🗄️", color: "gray" }
} as const;

export function analyzeCostlyServices(files: Map<string, string>, packageJsonContent?: string): CostAnalysisResult {
  const detectedServices: CostlyServiceDetection[] = [];
  const detectedServiceIds = new Set<string>();

  if (packageJsonContent) {
    try {
      const pkg = JSON.parse(packageJsonContent);
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      for (const service of COSTLY_SERVICES) {
        for (const pattern of service.patterns) {
          if (Object.keys(allDeps).some(dep => dep.includes(pattern))) {
            if (!detectedServiceIds.has(service.id)) {
              detectedServices.push({
                service,
                detectedIn: [{ file: "package.json", pattern, type: "dependency" }],
                estimatedMonthlyCost: service.averageMonthlyCost
              });
              detectedServiceIds.add(service.id);
            }
          }
        }
      }
    } catch (e) { console.error(e); }
  }

  files.forEach((content, filePath) => {
    for (const service of COSTLY_SERVICES) {
      service.patterns.forEach(pattern => {
        if (content.includes(pattern) && !detectedServiceIds.has(service.id)) {
          detectedServices.push({
            service,
            detectedIn: [{ file: filePath, pattern, type: "code" }],
            estimatedMonthlyCost: service.averageMonthlyCost
          });
          detectedServiceIds.add(service.id);
        }
      });
    }
  });

  const totalMonthlyCost = detectedServices.reduce((sum, s) => sum + s.estimatedMonthlyCost, 0);
  return {
    totalMonthlyCost,
    potentialSavings: totalMonthlyCost,
    yearlyProjection: totalMonthlyCost * 12,
    detectedServices,
    savingsLevel: totalMonthlyCost > 100 ? "high" : totalMonthlyCost > 0 ? "low" : "none",
    savingsScore: Math.max(0, 100 - (totalMonthlyCost / 5))
  };
}

export function generateDockerComposeAlternatives(services: CostlyServiceDetection[]): string {
  const serviceSnippets = services.map(s => s.service.alternative.dockerComposeSnippet).join("\n\n");
  return `version: "3.8"\nservices:\n${serviceSnippets}`;
}

export function generateEnvTemplate(services: CostlyServiceDetection[]): string {
  return services.map(s => `# ${s.service.name}\n${s.service.alternative.configTemplate}`).join("\n\n");
}
