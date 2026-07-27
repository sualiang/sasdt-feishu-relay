import { Request, Response, NextFunction } from 'express';
import { getConfig } from '../config/index.js';
import { verifyFeishuSignature, computeAllVariants } from '../utils/crypto.js';
import { getLogger } from './logger.js';

/**
 * 飞书签名校验中间件
 *
 * 校验请求头：
 * - X-Lark-Request-Timestamp
 * - X-Lark-Request-Nonce
 * - X-Lark-Signature
 *
 * 仅对 POST /webhook/* 路径生效
 */
export function feishuSignMiddleware(req: Request, res: Response, next: NextFunction): void {
  // 仅对 webhook POST 请求校验
  if (req.method !== 'POST' || !req.path.startsWith('/webhook')) {
    next();
    return;
  }

  // 飞书 URL 验证（type=url_verification）不需要签名头
  if (req.body?.type === 'url_verification') {
    next();
    return;
  }

  const timestamp = req.headers['x-lark-request-timestamp'] as string | undefined;
  const nonce = req.headers['x-lark-request-nonce'] as string | undefined;
  const signature = req.headers['x-lark-signature'] as string | undefined;

  if (!timestamp || !nonce || !signature) {
    getLogger().warn('飞书签名校验失败：缺少请求头', {
      hasTimestamp: !!timestamp,
      hasNonce: !!nonce,
      hasSignature: !!signature,
    });
    res.status(401).json({ code: 401, message: '签名校验失败：缺少签名头' });
    return;
  }

  const config = getConfig();
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);

  // 飞书事件回调签名：尝试所有已知变体
  const isValid = verifyFeishuSignature(
    timestamp,
    nonce,
    rawBody,
    config.feishu.appSecret,
    config.feishu.verificationToken,
    signature,
  );

  if (!isValid) {
    const variants = computeAllVariants(timestamp, nonce, rawBody, config.feishu.appSecret, config.feishu.verificationToken);
    const variantLog: Record<string, string> = {};
    for (const v of variants) {
      variantLog[v.name] = v.hex.substring(0, 16) + '...';
    }
    getLogger().warn('飞书签名校验失败：签名不匹配', {
      expected: signature.substring(0, 16) + '...',
      bodyLength: rawBody.length,
      ...variantLog,
    });
    res.status(401).json({ code: 401, message: '签名校验失败：签名无效' });
    return;
  }

  next();
}
