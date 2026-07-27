import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /health
 * 健康检查端点
 * 小龙的 Nginx 和 Docker 健康检查都会用这个端点
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    code: 0,
    message: 'ok',
    data: {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
