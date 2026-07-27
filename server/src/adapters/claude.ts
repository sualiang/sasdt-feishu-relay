import { AIAdapter, AIResponse, MessageContext } from '../types/adapter.js';

interface ApiKeyConfig {
  apiKey: string;
  apiUrl: string;
  model: string;
  systemPrompt: string;
}

/**
 * Claude API 适配器
 * 调用 https://api.anthropic.com/v1/messages
 */
export class ClaudeAdapter implements AIAdapter {
  name = 'claude';

  private config: ApiKeyConfig;

  constructor(apiKey: string, systemPrompt?: string) {
    this.config = {
      apiKey,
      apiUrl: 'https://api.anthropic.com/v1/messages',
      model: 'claude-sonnet-4-20250514',
      systemPrompt: systemPrompt || '你是一个智能助手，请用中文回答。',
    };
  }

  async process(message: string, context?: MessageContext): Promise<AIResponse> {
    const systemPrompt = this.config.systemPrompt;

    const messages: Array<{ role: string; content: string }> = [];

    if (context?.history) {
      for (const h of context.history.slice(-10)) {
        messages.push({ role: h.role, content: h.content });
      }
    }

    messages.push({ role: 'user', content: message });

    const response = await fetch(this.config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        system: systemPrompt,
        messages,
        max_tokens: 2000,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      throw new Error(`Claude API 错误: ${response.status} ${errBody}`);
    }

    const data: any = await response.json();
    const text = data.content?.[0]?.text || '';

    return { text, raw: data };
  }
}
