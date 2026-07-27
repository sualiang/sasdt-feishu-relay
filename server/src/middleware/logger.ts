import winston from 'winston';
import { getConfig } from '../config/index.js';

let logger: winston.Logger | null = null;

export function getLogger(): winston.Logger {
  if (!logger) {
    const config = getConfig();
    logger = winston.createLogger({
      level: config.logLevel,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
        }),
      ),
      transports: [new winston.transports.Console()],
    });
  }
  return logger;
}

/**
 * Express 请求日志中间件
 */
export function requestLogger(req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction): void {
  const log = getLogger();
  log.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    query: JSON.stringify(req.query),
  });
  next();
}

/**
 * Express 响应时间日志中间件
 */
export function responseTime(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = getLogger();
    log.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
}
