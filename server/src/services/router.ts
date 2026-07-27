import { AIAdapter } from '../types/adapter.js';
import { DeepSeekAdapter } from '../adapters/deepseek.js';
import { DoubaoAdapter } from '../adapters/doubao.js';
import { ClaudeAdapter } from '../adapters/claude.js';
import { QianwenAdapter } from '../adapters/qianwen.js';
import { getConfig } from '../config/index.js';
import { contextManager } from './context.js';
import { sendFeishuMessage } from './feishu.js';
import { getLogger } from '../middleware/logger.js';
import { auditLog } from '../utils/audit.js';

/** 角色配置 */
interface RoleConfig {
  role: string;
  displayName: string;
  adapter: AIAdapter | null;
  /** 小克特殊说明：暂不做 AI 处理，回复固定文案 */
  fixedReply?: string;
}

let roles: RoleConfig[] | null = null;

function getRoles(): RoleConfig[] {
  if (roles) return roles;

  const config = getConfig();

  roles = [
    {
      role: 'doubao',
      displayName: '豆包',
      adapter: new DoubaoAdapter(config.ai.doubaoApiKey, config.rolePrompts.doubao),
    },
    {
      role: 'ke',
      displayName: '小克',
      adapter: null,
      fixedReply: '小克（技术总监）已收到，处理后回复。',
    },
    {
      role: 'kai',
      displayName: '小开',
      adapter: new DeepSeekAdapter(config.ai.deepseekApiKey, config.rolePrompts.kai),
    },
    {
      role: 'long',
      displayName: '小龙',
      adapter: new DeepSeekAdapter(config.ai.deepseekApiKey, config.rolePrompts.long),
    },
    {
      role: 'qian',
      displayName: '小千',
      adapter: new QianwenAdapter(config.ai.qianwenApiKey, config.rolePrompts.qian),
    },
  ];

  return roles;
}

/** 角色路由配置（用于校验和查找） */
export const ROLE_NAMES = ['doubao', 'ke', 'kai', 'long', 'qian'] as const;
export type RoleName = (typeof ROLE_NAMES)[number];
export function isValidRole(name: string): name is RoleName {
  return ROLE_NAMES.includes(name as RoleName);
}

/**
 * 处理飞书消息
 * 按角色路由到对应适配器，然后异步回复
 */
export async function handleMessage(
  roleName: RoleName,
  messageText: string,
  chatId: string,
  chatType: string,
  senderId: string,
  sessionId: string,
): Promise<void> {
  const log = getLogger();
  const roleConfig = getRoles().find((r) => r.role === roleName);

  if (!roleConfig) {
    log.warn('未找到角色配置', { role: roleName });
    return;
  }

  log.info('处理消息', { role: roleName, text: messageText.substring(0, 100) });

  // 获取上下文
  const context = contextManager.getOrCreate(sessionId);
  contextManager.addUserMessage(sessionId, messageText);

  const startTime = Date.now();
  let replyText: string;
  let success = true;
  let errorMsg: string | undefined;

  try {
    if (roleConfig.fixedReply) {
      replyText = roleConfig.fixedReply;
    } else if (roleConfig.adapter) {
      const result = await roleConfig.adapter.process(messageText, context);
      replyText = result.text;
    } else {
      replyText = `[${roleConfig.displayName}] 未配置处理逻辑。`;
    }
  } catch (err) {
    success = false;
    errorMsg = err instanceof Error ? err.message : String(err);
    log.error('AI 处理失败', { role: roleName, error: errorMsg });
    replyText = `[${roleConfig.displayName}] 处理失败，请稍后重试。`;
  }

  const durationMs = Date.now() - startTime;

  // 保存回复到上下文
  contextManager.addAssistantMessage(sessionId, replyText);

  // 回复飞书消息
  const feishuStart = Date.now();
  await sendFeishuMessage(chatId, replyText);
  const feishuDurationMs = Date.now() - feishuStart;

  // 审计日志
  auditLog({
    timestamp: new Date().toISOString(),
    role: roleName,
    chatId,
    senderId,
    chatType,
    messageText,
    replyText,
    durationMs,
    adapter: roleConfig.adapter?.name || 'fixed-reply',
    success,
    error: errorMsg,
  });
}
