import express from 'express';
import cors from 'cors';
import { loadConfig, getConfig } from './config/index.js';
import { getLogger, requestLogger, responseTime } from './middleware/logger.js';
import { feishuSignMiddleware } from './middleware/feishu-sign.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import routes from './routes/index.js';

// 启动时加载并校验配置
loadConfig();
const config = getConfig();
const log = getLogger();

const app = express();

// ============================================================
// 基础中间件
// ============================================================

// 手动捕获 Webhook POST 的原始 body 字节
// 不依赖 express.text / express.json，直接从 stream 抓原始 buffer
// 确保 HMAC-SHA256 使用的字节与飞书发出的完全一致
app.use('/webhook', (req, res, next) => {
  if (req.method !== 'POST') { next(); return; }
  const chunks: Buffer[] = [];
  req.on('data', (chunk: Buffer) => chunks.push(chunk));
  req.on('end', () => {
    const rawBuf = Buffer.concat(chunks);
    // 存原始 buffer 的 UTF-8 字符串版本（用于 HMAC 和 JSON 解析）
    const rawStr = rawBuf.toString('utf8');
    (req as any).rawBody = rawStr;
    try { req.body = JSON.parse(rawStr); } catch { req.body = {}; }
    next();
  });
  req.on('error', () => next());
});
// 非 Webhook 路径用标准 JSON 解析
app.use(express.json());
app.use(cors());
app.use(requestLogger);
app.use(responseTime);

// 飞书签名校验（仅对 webhook POST 生效）
app.use(feishuSignMiddleware);

// ============================================================
// 路由
// ============================================================

app.use(routes);

// ============================================================
// 错误处理
// ============================================================

app.use('/api/*', notFoundHandler);
app.use(errorHandler);

// ============================================================
// 启动
// ============================================================

app.listen(config.port, () => {
  log.info(`SASDT 飞书中转服务已启动`, {
    port: config.port,
    env: config.nodeEnv,
    health: `http://localhost:${config.port}/health`,
  });
});

export default app;
