import { AIAdapter, AIResponse, MessageContext } from '../types/adapter.js';

interface ApiKeyConfig {
  apiKey: string;
  apiUrl: string;
  model: string;
  systemPrompt: string;
}

/**
 * 千问 API 适配器
 * 调用阿里云通义千问 API
 */
export class QianwenAdapter implements AIAdapter {
  name = 'qianwen';

  private config: ApiKeyConfig;

  constructor(apiKey: string, systemPrompt?: string) {
    this.config = {
      apiKey,
      apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      model: 'qwen-plus',
      systemPrompt: systemPrompt || '你是一个智能助手，请用中文回答。',
    };
  }

  async process(message: string, context?: MessageContext): Promise<AIResponse> {
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: this.config.systemPrompt },
    ];

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
      throw new Error(`千问 API 错误: ${response.status} ${errBody}`);
    }

    const data: any = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    return { text, raw: data };
  }
}
