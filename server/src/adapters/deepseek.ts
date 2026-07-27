import { AIAdapter, AIResponse, MessageContext, MessageHistory } from '../types/adapter.js';

interface ApiKeyConfig {
  apiKey: string;
  apiUrl: string;
  model: string;
  systemPrompt: string;
}

/**
 * DeepSeek API 适配器
 * 调用 https://api.deepseek.com/chat/completions
 */
export class DeepSeekAdapter implements AIAdapter {
  name = 'deepseek';

  private config: ApiKeyConfig;

  constructor(apiKey: string, systemPrompt?: string) {
    this.config = {
      apiKey,
      apiUrl: 'https://api.deepseek.com/chat/completions',
      model: 'deepseek-chat',
      systemPrompt: systemPrompt || '你是一个智能助手，请用中文回答。',
    };
  }

  async process(message: string, context?: MessageContext): Promise<AIResponse> {
    const messages = this.buildMessages(message, context);

    const response = await fetch(this.config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        max_tokens: 2000,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      throw new Error(`DeepSeek API 错误: ${response.status} ${errBody}`);
    }

    const data: any = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    return { text, raw: data };
  }

  private buildMessages(message: string, context?: MessageContext): Array<{ role: string; content: string }> {
    const msgs: Array<{ role: string; content: string }> = [
      { role: 'system', content: this.config.systemPrompt },
    ];

    if (context?.history) {
      for (const h of context.history.slice(-10)) {
        msgs.push({ role: h.role, content: h.content });
      }
    }

    msgs.push({ role: 'user', content: message });
    return msgs;
  }
}
