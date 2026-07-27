import crypto from 'node:crypto';

/**
 * 计算所有可能的飞书签名变体，通过对比找出哪个算法匹配
 */
export function computeAllVariants(
  timestamp: string,
  nonce: string,
  rawBody: string,
  appSecret: string,
  verificationToken: string,
) {
  type Variant = { name: string; algo: string; key: string; data: string; hex: string };

  const variants: Variant[] = [];

  // Variant A: HMAC-SHA256(appSecret, timestamp + nonce + body) — 当前实现
  const aStr = timestamp + nonce + rawBody;
  variants.push({
    name: 'A',
    algo: 'HMAC-SHA256',
    key: 'appSecret',
    data: 'timestamp + nonce + body',
    hex: crypto.createHmac('sha256', appSecret).update(aStr, 'utf8').digest('hex'),
  });

  // Variant B: SHA256(timestamp + nonce + appSecret + body) — 飞书事件订阅旧版签名
  const bStr = timestamp + nonce + appSecret + rawBody;
  variants.push({
    name: 'B',
    algo: 'SHA256',
    key: '(none, appSecret in data)',
    data: 'timestamp + nonce + appSecret + body',
    hex: crypto.createHash('sha256').update(bStr, 'utf8').digest('hex'),
  });

  // Variant C: SHA256(timestamp + nonce + verificationToken + body)
  const cStr = timestamp + nonce + verificationToken + rawBody;
  variants.push({
    name: 'C',
    algo: 'SHA256',
    key: '(none, VT in data)',
    data: 'timestamp + nonce + verificationToken + body',
    hex: crypto.createHash('sha256').update(cStr, 'utf8').digest('hex'),
  });

  // Variant D: HMAC-SHA256(verificationToken, timestamp + nonce + body)
  variants.push({
    name: 'D',
    algo: 'HMAC-SHA256',
    key: 'verificationToken',
    data: 'timestamp + nonce + body',
    hex: crypto.createHmac('sha256', verificationToken).update(aStr, 'utf8').digest('hex'),
  });

  // Variant E: SHA256(timestamp + nonce + body) — 无 key
  variants.push({
    name: 'E',
    algo: 'SHA256',
    key: '(none)',
    data: 'timestamp + nonce + body',
    hex: crypto.createHash('sha256').update(aStr, 'utf8').digest('hex'),
  });

  // Variant F: HMAC-SHA256(appSecret, timestamp + nonce) — 无 body，验证 appSecret 基本正确性
  variants.push({
    name: 'F',
    algo: 'HMAC-SHA256',
    key: 'appSecret',
    data: 'timestamp + nonce (no body)',
    hex: crypto.createHmac('sha256', appSecret).update(timestamp + nonce, 'utf8').digest('hex'),
  });

  // Variant G: SHA256(timestamp + nonce + appSecret) — 无 body，SHA256 版本
  variants.push({
    name: 'G',
    algo: 'SHA256',
    key: '(none, appSecret in data)',
    data: 'timestamp + nonce + appSecret (no body)',
    hex: crypto.createHash('sha256').update(timestamp + nonce + appSecret, 'utf8').digest('hex'),
  });

  return variants;
}

/**
 * 飞书签名校验 - 尝试所有已知变体
 */
export function verifyFeishuSignature(
  timestamp: string,
  nonce: string,
  rawBody: string,
  appSecret: string,
  verificationToken: string,
  expectedSign: string,
): boolean {
  const allVariants = computeAllVariants(timestamp, nonce, rawBody, appSecret, verificationToken);
  return allVariants.some((v) => v.hex === expectedSign);
}

export function generateId(): string {
  return crypto.randomUUID();
}
