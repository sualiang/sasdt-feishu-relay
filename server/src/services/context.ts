import { MessageHistory, MessageContext } from '../types/adapter.js';

/**
 * 上下文管理器
 * 内存存储，按 sessionId 维护历史记录
 * 每个 session 保留最近 20 条消息
 */

const MAX_HISTORY = 20;

interface SessionStore {
  history: MessageHistory[];
  createdAt: number;
}

class ContextManager {
  private sessions: Map<string, SessionStore> = new Map();
  private ttlMs: number;

  constructor(ttlMinutes = 60) {
    this.ttlMs = ttlMinutes * 60 * 1000;
  }

  /** 获取或创建会话上下文 */
  getOrCreate(sessionId: string): MessageContext {
    const now = Date.now();
    let session = this.sessions.get(sessionId);

    if (!session || now - session.createdAt > this.ttlMs) {
      session = { history: [], createdAt: now };
      this.sessions.set(sessionId, session);
    }

    return {
      sessionId,
      history: session.history,
    };
  }

  /** 添加用户消息 */
  addUserMessage(sessionId: string, content: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.history.push({
      role: 'user',
      content,
      timestamp: Date.now(),
    });

    this.trim(session);
  }

  /** 添加助手回复 */
  addAssistantMessage(sessionId: string, content: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.history.push({
      role: 'assistant',
      content,
      timestamp: Date.now(),
    });

    this.trim(session);
  }

  /** 清理超时会话 */
  cleanExpired(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (now - session.createdAt > this.ttlMs) {
        this.sessions.delete(id);
      }
    }
  }

  private trim(session: SessionStore): void {
    if (session.history.length > MAX_HISTORY) {
      session.history = session.history.slice(-MAX_HISTORY);
    }
  }
}

export const contextManager = new ContextManager();

// 每小时清理过期会话
setInterval(() => contextManager.cleanExpired(), 3600000);
