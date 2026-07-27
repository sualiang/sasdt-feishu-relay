import crypto from 'node:crypto';

/**
 * 飞书签名校验
 *
 * 算法：sha256(timestamp + nonce + appSecret + rawBody)
 * 将结果与请求头 X-Lark-Signature 比对
 *
 * @param timestamp     - 请求头 X-Lark-Request-Timestamp
 * @param nonce         - 请求头 X-Lark-Request-Nonce
 * @param rawBody       - 原始请求体（未解析的 JSON 字符串）
 * @param appSecret     - 飞书应用凭证 app_secret
 * @param expectedSign  - 请求头 X-Lark-Signature
 * @returns 签名是否匹配
 */
export function verifyFeishuSignature(
  timestamp: string,
  nonce: string,
  rawBody: string,
  appSecret: string,
  expectedSign: string,
): boolean {
  const signStr = timestamp + nonce + appSecret + rawBody;
  const signature = crypto.createHash('sha256').update(signStr, 'utf8').digest('hex');
  return signature === expectedSign;
}

/**
 * 生成随机 ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}
