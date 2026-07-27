import { Router, Request, Response } from 'express';
import { computeAllVariants, verifyFeishuSignature } from '../utils/crypto.js';
import { getConfig } from '../config/index.js';

const router = Router();

/**
 * POST /debug/hmac
 * 调试接口：传入飞书请求参数，对比所有签名变体
 * 用于快速确定飞书实际使用的是哪种签名算法
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
  const variants = computeAllVariants(timestamp, nonce, rawBody, config.feishu.appSecret, config.feishu.verificationToken);

  const results: Record<string, string> = {};
  for (const v of variants) {
    results[v.name] = `${v.hex} (algo=${v.algo}, key=${v.key}, data="${v.data}")${v.hex === expected ? ' ← 匹配!' : ''}`;
  }

  const anyMatch = variants.some((v) => v.hex === expected);

  res.json({
    code: 0,
    message: anyMatch ? '✅ 找到匹配的签名算法' : '❌ 所有变体均不匹配',
    data: {
      expected,
      bodyLength: rawBody.length,
      appSecretPrefix: config.feishu.appSecret.substring(0, 6) + '...',
      verificationTokenPrefix: config.feishu.verificationToken.substring(0, 6) + '...',
      results,
    },
  });
});

export default router;
