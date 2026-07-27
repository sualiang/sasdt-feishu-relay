import { Request, Response, NextFunction } from 'express';
import { getLogger } from './logger.js';

/**
 * 全局错误处理中间件
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const log = getLogger();
  log.error('未捕获错误', { message: err.message, stack: err.stack });

  res.status(500).json({
    code: 500,
    message: '内部错误',
  });
}

/**
 * 404 处理中间件
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
  });
}
