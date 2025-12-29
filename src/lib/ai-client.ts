/**
 * Client IA Configurable - Compatible Ollama, OpenRouter, OpenAI
 * Généré par InoPay Liberation Pack
 */

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIConfig {
  provider: 'ollama' | 'openrouter' | 'openai' | 'custom';
  baseUrl?: string;
  apiKey?: string;
  model?: string;
}

const DEFAULT_CONFIGS: Record<string, Partial<AIConfig>> = {
  ollama: {
    baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama2'
  },
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free'
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
  }
};

export class AIClient {
  private config: AIConfig;

  constructor(config?: Partial<AIConfig>) {
    const provider = config?.provider || (process.env.AI_PROVIDER as any) || 'ollama';
    this.config = {
      provider,
      ...DEFAULT_CONFIGS[provider],
      ...config
    };
  }

  async chat(messages: AIMessage[], options?: { stream?: boolean }): Promise<string> {
    const { provider, baseUrl, apiKey, model } = this.config;

    if (provider === 'ollama') {
      return this.chatOllama(messages);
    }

    // OpenAI-compatible API (OpenRouter, OpenAI, etc.)
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
        ...(provider === 'openrouter' && { 'HTTP-Referer': process.env.APP_URL || 'http://localhost' })
      },
      body: JSON.stringify({
        model,
        messages,
        stream: options?.stream || false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI Error: ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async chatOllama(messages: AIMessage[]): Promise<string> {
    const response = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama Error: ${await response.text()}`);
    }

    const data = await response.json();
    return data.message.content;
  }

  async *streamChat(messages: AIMessage[]): AsyncGenerator<string> {
    const { provider, baseUrl, apiKey, model } = this.config;

    if (provider === 'ollama') {
      yield* this.streamOllama(messages);
      return;
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify({ model, messages, stream: true })
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

      for (const line of lines) {
        const json = line.slice(6);
        if (json === '[DONE]') return;
        try {
          const parsed = JSON.parse(json);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {}
      }
    }
  }

  private async *streamOllama(messages: AIMessage[]): AsyncGenerator<string> {
    const response = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        stream: true
      })
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      try {
        const parsed = JSON.parse(chunk);
        if (parsed.message?.content) yield parsed.message.content;
      } catch {}
    }
  }
}

// Instance par défaut
export const ai = new AIClient();

// Usage:
// import { ai } from '@/lib/ai-client';
// const response = await ai.chat([{ role: 'user', content: 'Bonjour!' }]);
