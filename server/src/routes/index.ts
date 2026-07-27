import { Router } from 'express';
import healthRouter from './health.js';
import webhookRouter from './webhook.js';

const router = Router();

router.use('/health', healthRouter);
router.use('/webhook', webhookRouter);

export default router;
