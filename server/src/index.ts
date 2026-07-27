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

// 飞书 Webhook 路径：先用 express.text 获取原始 body 字符串
// 保证签名使用的原始字节与飞书发送的完全一致
app.use('/webhook', express.text({ type: '*/*' }));
// Webhook 路径：保存 rawBody（原始字符串），再 parse JSON
app.use('/webhook', (req, _res, next) => {
  if (typeof req.body === 'string') {
    (req as any).rawBody = req.body;
    try {
      req.body = JSON.parse(req.body);
    } catch { /* 保持原样 */ }
  }
  next();
});
// 其他路径用标准 JSON 解析
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
