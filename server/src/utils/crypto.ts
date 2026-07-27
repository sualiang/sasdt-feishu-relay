import crypto from 'node:crypto';

/**
 * 飞书事件回调签名校验
 *
 * 算法：sha256(timestamp + nonce + verificationToken + rawBody)
 * 将结果（hex）与请求头 X-Lark-Signature 比对
 *
 * 注意：事件回调签名用的是 Verification Token（飞书开放平台 → 事件与回调），
 * 不是 App Secret。URL 验证 challenge 不需要签名。
 *
 * @param timestamp         - 请求头 X-Lark-Request-Timestamp
 * @param nonce             - 请求头 X-Lark-Request-Nonce
 * @param rawBody           - 原始请求体（未解析的 JSON 字符串，字节不可变）
 * @param verificationToken - 飞书事件订阅 Verification Token
 * @param expectedSign      - 请求头 X-Lark-Signature
 * @returns 签名是否匹配
 */
export function verifyFeishuSignature(
  timestamp: string,
  nonce: string,
  rawBody: string,
  verificationToken: string,
  expectedSign: string,
): boolean {
  const signStr = timestamp + nonce + verificationToken + rawBody;
  const signature = crypto.createHash('sha256').update(signStr, 'utf8').digest('hex');
  return signature === expectedSign;
}

/**
 * 生成随机 ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}
