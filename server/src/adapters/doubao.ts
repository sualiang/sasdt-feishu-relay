import { AIAdapter, AIResponse, MessageContext } from '../types/adapter.js';

/**
 * 豆包 API 适配器
 * 通过火山引擎方舟 API 调用
 * 未配置 API Key 时自动降级为 Echo 模式
 */
export class DoubaoAdapter implements AIAdapter {
  name = 'doubao';

  private apiKey: string;
  private systemPrompt: string;
  /** 是否为透传/echo 模式（无 API Key 时启用） */
  private echoMode: boolean;

  constructor(apiKey: string, systemPrompt?: string) {
    this.apiKey = apiKey;
    this.systemPrompt = systemPrompt || '你是豆包，一个智能助手，请用中文回答。';
    this.echoMode = !apiKey;
  }

  async process(message: string, _context?: MessageContext): Promise<AIResponse> {
    // 无 API Key 时降级为 Echo 模式
    if (this.echoMode) {
      return {
        text: `[豆包 Echo] ${message}`,
        raw: { mode: 'echo' },
      };
    }

    try {
      const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'ep-20240601000000-xxxxx',
          messages: [
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: message },
          ],
          max_tokens: 2000,
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        throw new Error(`豆包 API 错误: ${response.status} ${errBody}`);
      }

      const data: any = await response.json();
      const text = data.choices?.[0]?.message?.content || '';
      return { text, raw: data };
    } catch (err) {
      return { text: `[豆包] API 调用失败: ${err instanceof Error ? err.message : '未知错误'}` };
    }
  }
}
