import { AIAdapter, AIResponse, MessageContext } from '../types/adapter.js';

/**
 * 豆包 API 适配器
 * 通过豆包桌面客户端 API 调用
 * TODO: 待豆包 API 地址确认后实现
 */
export class DoubaoAdapter implements AIAdapter {
  name = 'doubao';

  private apiKey: string;
  private systemPrompt: string;

  constructor(apiKey: string, systemPrompt?: string) {
    this.apiKey = apiKey;
    this.systemPrompt = systemPrompt || '你是豆包，一个智能助手，请用中文回答。';
  }

  async process(message: string, _context?: MessageContext): Promise<AIResponse> {
    // 豆包 API 待接入，暂返回占位
    if (!this.apiKey) {
      return { text: `[豆包] 收到消息，API 尚未配置。内容：${message.substring(0, 100)}` };
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
