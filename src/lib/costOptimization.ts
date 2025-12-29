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

// Base de connaissances complète des services coûteux
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
        from: ["new OpenAI({", "openai.chat.completions.create", "gpt-3", "gpt-4"],
        to: "Ollama HTTP API (Fetch)",
        instructions: "Remplacer le SDK OpenAI par un fetch() sur http://localhost:11434/api/chat"
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
      configTemplate: "OLLAMA_BASE_URL=http://ollama:11434\nOLLAMA_MODEL=llama3.1:70b",
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
    description: "Base de données vectorielle cloud pour embeddings IA",
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
        from: ["@pinecone-database/pinecone", "PineconeClient", "pinecone.upsert", "pinecone.query"],
        to: "pg avec extension pgvector",
        instructions: "Utiliser PostgreSQL avec l'extension pgvector pour les recherches de similarité vectorielle"
      }
    }
  },
  {
    id: "weaviate",
    name: "Weaviate Cloud",
    category: "vectordb",
    patterns: ["weaviate", "weaviate-ts-client", "weaviate-client"],
    envPatterns: ["WEAVIATE_API_KEY", "WEAVIATE_URL"],
    averageMonthlyCost: 60,
    description: "Base de données vectorielle Weaviate cloud",
    alternative: {
      name: "Weaviate Self-hosted",
      dockerImage: "semitechnologies/weaviate:latest",
      dockerComposeSnippet: `  weaviate:
    image: semitechnologies/weaviate:latest
    container_name: weaviate
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - QUERY_DEFAULTS_LIMIT=25
      - AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true
      - PERSISTENCE_DATA_PATH=/var/lib/weaviate
    volumes:
      - weaviate_data:/var/lib/weaviate`,
      selfHostedCost: 0,
      complexity: "medium",
      configTemplate: "WEAVIATE_URL=http://weaviate:8080",
      codeReplacement: {
        from: ["weaviate-ts-client"],
        to: "Weaviate self-hosted",
        instructions: "Pointer vers votre instance Weaviate self-hosted au lieu du cloud"
      }
    }
  },

  // =========== Auth ===========
  {
    id: "clerk",
    name: "Clerk",
    category: "auth",
    patterns: ["@clerk/", "clerk-sdk", "clerk.dev", "@clerk/nextjs", "@clerk/react"],
    envPatterns: ["CLERK_SECRET_KEY", "CLERK_PUBLISHABLE_KEY", "NEXT_PUBLIC_CLERK"],
    averageMonthlyCost: 25,
    description: "Service d'authentification SaaS complet",
    alternative: {
      name: "Supabase Auth (Self-hosted)",
      dockerImage: "supabase/gotrue:latest",
      dockerComposeSnippet: `  auth:
    image: supabase/gotrue:v2.132.3
    container_name: supabase-auth
    restart: unless-stopped
    ports:
      - "9999:9999"
    environment:
      - GOTRUE_API_HOST=0.0.0.0
      - GOTRUE_API_PORT=9999
      - GOTRUE_DB_DRIVER=postgres
      - DATABASE_URL=postgres://supabase:secret@db:5432/supabase
      - GOTRUE_SITE_URL=http://localhost:3000
      - GOTRUE_JWT_SECRET=your-super-secret-jwt-token`,
      selfHostedCost: 0,
      complexity: "medium",
      configTemplate: "SUPABASE_AUTH_URL=http://auth:9999\nSUPABASE_JWT_SECRET=your-super-secret",
      codeReplacement: {
        from: ["@clerk/react", "@clerk/nextjs", "useUser", "SignIn", "SignUp", "ClerkProvider"],
        to: "@supabase/supabase-js",
        instructions
