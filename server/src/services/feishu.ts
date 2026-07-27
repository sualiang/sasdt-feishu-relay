import { getConfig } from '../config/index.js';
import { withRetry } from '../utils/retry.js';
import { getLogger } from '../middleware/logger.js';
import type { FeishuTokenResponse, FeishuApiResponse } from '../types/feishu.js';

let tokenCache: { token: string; expiresAt: number } | null = null;

/**
 * 获取飞书 tenant_access_token
 * 缓存直到过期前 5 分钟
 */
async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && now < tokenCache.expiresAt - 300000) {
    return tokenCache.token;
  }

  const config = getConfig();
  const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: config.feishu.appId,
      app_secret: config.feishu.appSecret,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`获取飞书 token 失败: ${response.status}`);
  }

  const data: FeishuTokenResponse = await response.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: now + data.expire * 1000,
  };

  return data.access_token;
}

/**
 * 发送飞书消息
 * POST https://open.feishu.cn/open-apis/im/v1/messages
 */
export async function sendFeishuMessage(
  chatId: string,
  text: string,
): Promise<void> {
  const log = getLogger();
  try {
    const token = await withRetry(() => getAccessToken(), { maxRetries: 2 });
    const body = JSON.stringify({
      receive_id: chatId,
      msg_type: 'text',
      content: JSON.stringify({ text }),
    });

    const response = await fetch(
      `https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body,
        signal: AbortSignal.timeout(10000),
      },
    );

    const data: FeishuApiResponse = await response.json();
    if (data.code !== 0) {
      log.error('发送飞书消息失败', { code: data.code, message: data.message });
      if (data.code === 99991668) {
        log.error('错误 99991668 常见原因：'
          + '1. 机器人未添加到群聊 — 请手动将机器人拉入群；'
          + '2. 应用权限不足 — 请在飞书开放平台检查 im:message 权限并重新发布；'
          + '3. chat_id 错误 — 确认收到的 chat_id 与发送时一致');
      }
    }
  } catch (err) {
    log.error('发送飞书消息异常', { error: err instanceof Error ? err.message : String(err) });
  }
}
