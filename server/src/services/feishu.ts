import { getConfig } from '../config/index.js';
import { withRetry } from '../utils/retry.js';
import { getLogger } from '../middleware/logger.js';
import type { FeishuTokenResponse, FeishuApiResponse } from '../types/feishu.js';

let tokenCache: { token: string; expiresAt: number } | null = null;

/**
 * 获取飞书 tenant_access_token
 * 缓存直到过期前 5 分钟
 * forceRefresh=true 时强制刷新（用于 99991668 等权限错误后重试）
 */
async function getAccessToken(forceRefresh = false): Promise<string> {
  const now = Date.now();
  if (!forceRefresh && tokenCache && now < tokenCache.expiresAt - 300000) {
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
    const errBody = await response.text().catch(() => '');
    throw new Error(`获取飞书 token 失败: ${response.status} ${errBody}`);
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
    log.info('[FeishuMsg] token 获取成功', {
      tokenPrefix: token.substring(0, 8) + '...',
      tokenLength: token.length,
      cacheHit: tokenCache?.token === token ? 'cache' : 'fresh',
    });

    const body = JSON.stringify({
      receive_id: chatId,
      msg_type: 'text',
      content: JSON.stringify({ text }),
    });
    log.info('[FeishuMsg] 准备发送', {
      url: `https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id`,
      chatIdPrefix: chatId.substring(0, 10) + '...',
      bodyPreview: body.substring(0, 200),
      authorizationPrefix: `Bearer ${token.substring(0, 8)}...`,
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

    const httpStatus = response.status;
    const respBody = await response.text();
    log.info('[FeishuMsg] 响应', {
      httpStatus,
      bodyPrefix: respBody.substring(0, 300),
      bodyLength: respBody.length,
    });
    let data: FeishuApiResponse;
    try {
      data = JSON.parse(respBody);
    } catch {
      log.error('发送飞书消息：非 JSON 响应', { httpStatus, respBody: respBody.substring(0, 500) });
      return;
    }

    if (data.code !== 0) {
      // 飞书 API 错误体字段名不统一，可能为 msg 或 message
      const dataAny = data as any;
      const errMsg = dataAny.msg || dataAny.message || String(data.code);
      log.error('发送飞书消息失败', {
        code: data.code,
        message: errMsg,
        httpStatus,
        chatIdPrefix: chatId.substring(0, 10) + '...',
      });

      // 99991668：可能 token 权限不足，强制刷新 token 后重试一次
      if (data.code === 99991668) {
        log.info('尝试刷新 token 后重试...');
        try {
          const newToken = await getAccessToken(true);
          const retryResp = await fetch(
            `https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${newToken}`,
              },
              body,
              signal: AbortSignal.timeout(10000),
            },
          );
          const retryData: FeishuApiResponse = await retryResp.json();
          if (retryData.code !== 0) {
            log.error('刷新 token 后重试仍然失败', {
              code: retryData.code,
              message: retryData.message,
            });
            log.error('99991668 可能原因：'
              + '1. 飞书应用未添加 im:message 权限 — 请在开放平台检查；'
              + '2. 权限变更后未重新发布 — 必须发布新版本才能生效；'
              + '3. 机器人未加入群聊 — 在群设置中添加机器人；'
              + '4. 如果私聊报错 — 需要用户先主动给机器人发一条消息');
          } else {
            log.info('刷新 token 后重试成功 ✅');
          }
        } catch (retryErr) {
          log.error('刷新 token 重试异常', { error: retryErr instanceof Error ? retryErr.message : String(retryErr) });
        }
      }
    }
  } catch (err) {
    log.error('发送飞书消息异常', { error: err instanceof Error ? err.message : String(err) });
  }
}
