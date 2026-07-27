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

// raw body 保留（飞书签名校验需要原始请求体）
app.use(express.json({
  verify: (_req, _res, buf) => {
    (_req as any).rawBody = buf.toString('utf8');
  },
}));
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
