import { Router, Request, Response } from 'express';
import { computeHmacForDebug, verifyFeishuSignature } from '../utils/crypto.js';
import { getConfig } from '../config/index.js';

const router = Router();

/**
 * POST /debug/hmac
 * 调试接口：传入飞书请求参数，对比服务端算出的 HMAC 和飞书给的签名
 * 用于排查签名校验不通过的原因
 *
 * @body timestamp  - X-Lark-Request-Timestamp
 * @body nonce      - X-Lark-Request-Nonce
 * @body body       - 原始请求体字符串
 * @body expected   - X-Lark-Signature
 */
router.post('/hmac', (req: Request, res: Response) => {
  const { timestamp, nonce, body: rawBody, expected } = req.body;

  if (!timestamp || !nonce || !rawBody || !expected) {
    res.json({
      code: 400,
      message: '缺少参数，需要 timestamp, nonce, body, expected',
      data: null,
    });
    return;
  }

  const config = getConfig();
  const computed = computeHmacForDebug(timestamp, nonce, rawBody, config.feishu.appSecret);

  const valid = verifyFeishuSignature(timestamp, nonce, rawBody, config.feishu.appSecret, expected);

  const results: Record<string, string> = {
    hexWithoutBody: computed.hexWithoutBody,
    hexWithBody: computed.hexWithBody,
    hexWithBodyAndNl: computed.hexWithBodyAndNl,
  };
  // 标记哪个匹配
  for (const [key, val] of Object.entries(results)) {
    results[key] = val + (val === expected ? ' ← 匹配!' : '');
  }

  res.json({
    code: 0,
    message: valid ? '签名校验通过' : '签名校验不通过',
    data: {
      bodyLength: computed.bodyLength,
      appSecretPrefix: config.feishu.appSecret.substring(0, 4) + '...',
      expected: expected,
      results,
    },
  });
});

export default router;
