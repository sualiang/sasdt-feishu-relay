import crypto from 'node:crypto';

/**
 * 飞书事件回调签名校验
 *
 * 算法：HMAC-SHA256(key=appSecret, data=timestamp + nonce + rawBody)
 * 将结果（hex）与请求头 X-Lark-Signature 比对
 *
 * @param timestamp    - 请求头 X-Lark-Request-Timestamp
 * @param nonce        - 请求头 X-Lark-Request-Nonce
 * @param rawBody      - 原始请求体字符串
 * @param appSecret    - 飞书 App Secret
 * @param expectedSign - 请求头 X-Lark-Signature
 * @returns { valid: boolean, detail?: { hexBody: string } }
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
  const base64Sign = rawDigest.toString('base64');
  if (base64Sign === expectedSign) return true;

  // 也试一下 body + '\n'（Nginx 有时会在 body 后加换行）
  const signStrNl = timestamp + nonce + rawBody + '\n';
  const hmacNl = crypto.createHmac('sha256', appSecret).update(signStrNl, 'utf8').digest('hex');
  if (hmacNl === expectedSign) return true;

  return false;
}

/**
 * 计算 HMAC-SHA256 签名（用于 debug 对比）
 */
export function computeHmacForDebug(
  timestamp: string,
  nonce: string,
  rawBody: string,
  appSecret: string,
): {
  hexWithoutBody: string;
  hexWithBody: string;
  hexWithBodyAndNl: string;
  bodyLength: number;
} {
  // 只验 timestamp+nonce，看 app_secret 对不对
  const noBody = crypto.createHmac('sha256', appSecret)
    .update(timestamp + nonce, 'utf8').digest('hex');
  // 标准算法
  const withBody = crypto.createHmac('sha256', appSecret)
    .update(timestamp + nonce + rawBody, 'utf8').digest('hex');
  // 带换行
  const withBodyNl = crypto.createHmac('sha256', appSecret)
    .update(timestamp + nonce + rawBody + '\n', 'utf8').digest('hex');

  return {
    hexWithoutBody: noBody,
    hexWithBody: withBody,
    hexWithBodyAndNl: withBodyNl,
    bodyLength: rawBody.length,
  };
}

export function generateId(): string {
  return crypto.randomUUID();
}
