# 🔓 Guide des Services Open Source

Ce pack inclut des templates pour remplacer les services propriétaires par des alternatives 100% open source.

## 🤖 Ollama - IA Locale

**Remplace:** OpenAI API, Claude API, services IA propriétaires

### Installation

1. Ajoutez le service à `docker-compose.yml` (voir `services/ollama/docker-compose.yml`)
2. Démarrez: `docker compose up -d ollama`
3. Téléchargez un modèle:
   ```bash
   docker exec ollama ollama pull llama2
   docker exec ollama ollama pull mistral
   docker exec ollama ollama pull codellama  # Pour le code
   ```

### Utilisation dans votre code

```typescript
// Remplacez vos appels OpenAI par:
const response = await fetch('http://ollama:11434/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'llama2',
    messages: [{ role: 'user', content: 'Bonjour!' }],
    stream: false
  })
});
```

### Modèles recommandés
- **llama2** / **llama3**: Usage général
- **mistral** / **mixtral**: Excellent équilibre qualité/vitesse
- **codellama**: Génération de code
- **phi**: Petit mais efficace

---

## 🔍 Meilisearch - Recherche Full-Text

**Remplace:** Algolia, Elasticsearch (plus simple)

### Installation

1. Ajoutez le service (voir `services/meilisearch/docker-compose.yml`)
2. Configurez `MEILISEARCH_MASTER_KEY` dans `.env`
3. Démarrez: `docker compose up -d meilisearch`

### Utilisation

```typescript
import { MeiliSearch } from 'meilisearch';

const client = new MeiliSearch({
  host: 'http://meilisearch:7700',
  apiKey: process.env.MEILISEARCH_MASTER_KEY
});

// Indexer
await client.index('products').addDocuments(products);

// Rechercher
const results = await client.index('products').search('requête');
```

---

## 📦 MinIO - Stockage S3-Compatible

**Remplace:** AWS S3, Supabase Storage, Cloudflare R2

### Installation

1. Ajoutez le service (voir `services/minio/docker-compose.yml`)
2. Configurez les credentials dans `.env`
3. Démarrez: `docker compose up -d minio`
4. Console admin: `http://votre-ip:9001`

### Utilisation

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  endpoint: 'http://minio:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY
  },
  forcePathStyle: true
});

// Upload
await s3.send(new PutObjectCommand({
  Bucket: 'mon-bucket',
  Key: 'fichier.pdf',
  Body: buffer
}));
```

---

## 📧 Mailhog - Email en Développement

**Remplace:** Services SMTP pour le dev

```yaml
mailhog:
  image: mailhog/mailhog
  ports:
    - "1025:1025"  # SMTP
    - "8025:8025"  # Web UI
```

---

## 🔄 Soketi - WebSocket Pusher-Compatible

**Remplace:** Pusher, Ably

```yaml
soketi:
  image: quay.io/soketi/soketi:latest
  ports:
    - "6001:6001"
  environment:
    - SOKETI_DEFAULT_APP_ID=app-id
    - SOKETI_DEFAULT_APP_KEY=app-key
    - SOKETI_DEFAULT_APP_SECRET=app-secret
```

---

## 📊 Tableau Comparatif

| Propriétaire | Alternative Open Source | Effort Migration |
|-------------|------------------------|------------------|
| OpenAI API | Ollama + Llama/Mistral | ⭐⭐ Moyen |
| Algolia | Meilisearch | ⭐ Facile |
| AWS S3 | MinIO | ⭐ Facile |
| Pusher | Soketi | ⭐ Facile |
| Supabase Auth | Self-hosted Supabase | ⭐⭐⭐ Complexe |

---

*Généré par InoPay Liberation Pack*
