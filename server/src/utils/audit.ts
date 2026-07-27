import { getLogger } from '../middleware/logger.js';

/** 审计日志条目 */
interface AuditEntry {
  timestamp: string;
  role: string;
  chatId: string;
  senderId: string;
  chatType: string;
  messageText: string;
  replyText: string;
  durationMs: number;
  adapter: string;
  success: boolean;
  error?: string;
}

/**
 * 审计日志
 * 记录每条消息的处理过程，输出到 stdout（Docker 日志）
 */
export function auditLog(entry: AuditEntry): void {
  const log = getLogger();
  log.info('[AUDIT] 消息处理记录', {
    type: 'audit',
    ...entry,
    messageText: entry.messageText.substring(0, 500),
    replyText: entry.replyText.substring(0, 500),
  });
}
