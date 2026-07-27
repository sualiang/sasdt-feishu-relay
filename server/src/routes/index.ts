import { Router } from 'express';
import healthRouter from './health.js';
import webhookRouter from './webhook.js';
import debugRouter from './debug.js';

const router = Router();

router.use('/health', healthRouter);
router.use('/webhook', webhookRouter);
router.use('/debug', debugRouter);

export default router;
