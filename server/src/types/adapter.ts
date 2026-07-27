/** 消息上下文 */
export interface MessageContext {
  sessionId: string;
  history: MessageHistory[];
}

/** 历史消息 */
export interface MessageHistory {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

/** AI 适配器响应 */
export interface AIResponse {
  text: string;
  raw?: unknown;
}

/** AI 适配器接口 */
export interface AIAdapter {
  name: string;
  process(message: string, context?: MessageContext): Promise<AIResponse>;
}
