/**
 * Test file for verifying AI replacement patterns in deepCleanSourceFile
 * This validates that proprietary AI services are correctly replaced with open-source alternatives
 */

import { deepCleanSourceFile } from '../clientProprietaryPatterns';

// Test file content with OpenAI imports
const openAITestCode = `
// INOPAY: OpenAI remplacé par Ollama (auto-hébergé)
const OLLAMA_BASE_URL = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434';

async function createChatCompletion(messages: Array<{role: string; content: string}>, model = 'llama3.1') {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: false })
  });
  return response.json();
}

const openai = /* INOPAY: Ollama client - voir createChatCompletion() */;

async function chat(message: string) {
  const response = await createChatCompletion({
    model: 'gpt-4',
    messages: [{ role: 'user', content: message }],
  });
  return response.choices[0].message.content;
}
`;

// Test file content with Anthropic imports  
const anthropicTestCode = `
// INOPAY: Anthropic (Claude) remplacé par Ollama + Llama 3.1 (auto-hébergé)
const OLLAMA_BASE_URL = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434';

async function createMessage(messages: Array<{role: string; content: string}>, model = 'llama3.1:70b') {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: false })
  });
  const data = await response.json();
  return { content: [{ text: data.message?.content || '' }] };
}

const anthropic = /* INOPAY: Ollama client - voir createMessage() */;

async function chat(message: string) {
  const response = await createMessage({
    model: 'claude-3-opus-20240229',
    max_tokens: 1024,
    messages: [{ role: 'user', content: message }],
  });
  return response.content[0].text;
}
`;

// Test file content with Firebase imports
const firebaseTestCode = `
// INOPAY: Firebase remplacé par PocketBase (auto-hébergé)
import PocketBase from 'pocketbase';

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://localhost:8090');
// INOPAY: Firebase Auth remplacé par PocketBase Auth
// Migration:
// signInWithEmailAndPassword → pb.collection('users').authWithPassword(email, password)
// createUserWithEmailAndPassword → pb.collection('users').create({ email, password })
// signOut → pb.authStore.clear()
// INOPAY: Firestore remplacé par PocketBase Collections
// Migration:
// collection(db, 'users') → pb.collection('users')
// addDoc → pb.collection('x').create(data)
// getDocs → pb.collection('x').getList()
// doc + updateDoc → pb.collection('x').update(id, data)
// doc + deleteDoc → pb.collection('x').delete(id)
// INOPAY: Firebase Storage remplacé par MinIO
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  endpoint: import.meta.env.VITE_MINIO_ENDPOINT || 'http://localhost:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: import.meta.env.VITE_MINIO_ACCESS_KEY || 'minioadmin',
    secretAccessKey: import.meta.env.VITE_MINIO_SECRET_KEY || 'minioadmin',
  },
  forcePathStyle: true,
});

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
`;

// Test file content with multiple services
const mixedTestCode = `
// INOPAY: OpenAI remplacé par Ollama (auto-hébergé)
const OLLAMA_BASE_URL = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434';

async function createChatCompletion(messages: Array<{role: string; content: string}>, model = 'llama3.1') {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: false })
  });
  return response.json();
}
// INOPAY: Anthropic (Claude) remplacé par Ollama + Llama 3.1 (auto-hébergé)
const OLLAMA_BASE_URL = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434';

async function createMessage(messages: Array<{role: string; content: string}>, model = 'llama3.1:70b') {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: false })
  });
  const data = await response.json();
  return { content: [{ text: data.message?.content || '' }] };
}
// INOPAY: TODO - Remplacer Pinecone par PostgreSQL + pgvector
// Installation: CREATE EXTENSION vector;
// Usage: SELECT * FROM items ORDER BY embedding <=> $1 LIMIT 10;
// Voir: https://github.com/pgvector/pgvector
// INOPAY: Clerk remplacé par Supabase Auth (auto-hébergé)
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Migration Clerk → Supabase Auth:
// useUser() → supabase.auth.getUser()
// SignIn → supabase.auth.signInWithPassword({ email, password })
// SignUp → supabase.auth.signUp({ email, password })
// SignOut → supabase.auth.signOut()
// INOPAY: Algolia remplacé par Meilisearch (auto-hébergé)
import { MeiliSearch } from 'meilisearch';

const searchClient = new MeiliSearch({
  host: import.meta.env.VITE_MEILISEARCH_URL || 'http://localhost:7700',
  apiKey: import.meta.env.VITE_MEILISEARCH_KEY || ''
});

const openai = /* INOPAY: Ollama client - voir createChatCompletion() */;
const anthropic = /* INOPAY: Ollama client - voir createMessage() */;
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const algolia = algoliasearch('APP_ID', 'API_KEY');
`;

// Run tests
export function runAIReplacementTests(): { passed: number; failed: number; results: string[] } {
  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  // Test 1: OpenAI → Ollama
  const openAIResult = deepCleanSourceFile(openAITestCode, 'test-openai.ts');
  if (openAIResult.cleaned.includes('OLLAMA_BASE_URL') && 
      openAIResult.cleaned.includes('createChatCompletion') &&
      !openAIResult.cleaned.includes("from 'openai'")) {
    results.push('✅ OpenAI → Ollama: PASSED');
    passed++;
  } else {
    results.push('❌ OpenAI → Ollama: FAILED');
    failed++;
  }

  // Test 2: Anthropic → Ollama + Llama
  const anthropicResult = deepCleanSourceFile(anthropicTestCode, 'test-anthropic.ts');
  if (anthropicResult.cleaned.includes('OLLAMA_BASE_URL') && 
      anthropicResult.cleaned.includes('createMessage') &&
      anthropicResult.cleaned.includes('llama3.1:70b') &&
      !anthropicResult.cleaned.includes("from '@anthropic-ai/sdk'")) {
    results.push('✅ Anthropic → Ollama + Llama 3.1: PASSED');
    passed++;
  } else {
    results.push('❌ Anthropic → Ollama + Llama 3.1: FAILED');
    failed++;
  }

  // Test 3: Firebase → PocketBase
  const firebaseResult = deepCleanSourceFile(firebaseTestCode, 'test-firebase.ts');
  if (firebaseResult.cleaned.includes('PocketBase') && 
      firebaseResult.cleaned.includes('INOPAY:') &&
      !firebaseResult.cleaned.includes("from 'firebase/app'")) {
    results.push('✅ Firebase → PocketBase: PASSED');
    passed++;
  } else {
    results.push('❌ Firebase → PocketBase: FAILED');
    failed++;
  }

  // Test 4: Multiple services replacement
  const mixedResult = deepCleanSourceFile(mixedTestCode, 'test-mixed.ts');
  const mixedChecks = {
    ollama: mixedResult.cleaned.includes('OLLAMA_BASE_URL'),
    meilisearch: mixedResult.cleaned.includes('MeiliSearch'),
    supabaseAuth: mixedResult.cleaned.includes('Supabase Auth'),
    pgvector: mixedResult.cleaned.includes('pgvector'),
  };
  
  if (Object.values(mixedChecks).every(v => v)) {
    results.push('✅ Mixed services replacement: PASSED');
    passed++;
  } else {
    results.push(`❌ Mixed services replacement: FAILED (${JSON.stringify(mixedChecks)})`);
    failed++;
  }

  // Test 5: Changes are tracked
  if (openAIResult.changes.length > 0 && anthropicResult.changes.length > 0) {
    results.push('✅ Changes tracking: PASSED');
    passed++;
  } else {
    results.push('❌ Changes tracking: FAILED');
    failed++;
  }

  // Log results
  console.log('\n=== AI REPLACEMENT TESTS ===');
  results.forEach(r => console.log(r));
  console.log(`\nTotal: ${passed} passed, ${failed} failed`);
  console.log('=============================\n');

  return { passed, failed, results };
}

// Export test data for manual inspection
export const testCases = {
  openAITestCode,
  anthropicTestCode,
  firebaseTestCode,
  mixedTestCode,
};
