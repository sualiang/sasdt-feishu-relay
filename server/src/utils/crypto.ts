import crypto from 'node:crypto';

/**
 * 飞书事件回调签名校验
 *
 * 算法：HMAC-SHA256(key=appSecret, data=timestamp + nonce + rawBody)
 * 将结果（hex）与请求头 X-Lark-Signature 比对
 *
 * 飞书事件订阅有 2 种验证模式：
 * 1. 明文模式 — 只比对请求体中的 token 字段 vs Verification Token
 * 2. 签名模式 — 请求头有 X-Lark-Signature，
 *    算法为 HMAC-SHA256(appSecret, timestamp + nonce + body)，hex 输出
 *
 * @param timestamp    - 请求头 X-Lark-Request-Timestamp
 * @param nonce        - 请求头 X-Lark-Request-Nonce
 * @param rawBody      - 原始请求体字符串（必须与飞书发送的字节完全一致）
 * @param appSecret    - 飞书 App Secret（HMAC 密钥，不是 Verification Token）
 * @param expectedSign - 请求头 X-Lark-Signature
 * @returns 签名是否匹配
 */
export function verifyFeishuSignature(
  timestamp: string,
  nonce: string,
  rawBody: string,
  appSecret: string,
  expectedSign: string,
): boolean {
  const signStr = timestamp + nonce + rawBody;
  const hmac = crypto.createHmac('sha256', appSecret)
    .update(signStr, 'utf8');
  const rawDigest = hmac.digest();
  const hexSign = rawDigest.toString('hex');
  if (hexSign === expectedSign) return true;
  // 飞书签名也可能用 base64 编码
  const base64Sign = rawDigest.toString('base64');
  return base64Sign === expectedSign;
}


/**
 * 生成随机 ID
 */
export function generateId(): string {
  return crypto.randomUUID();
}
