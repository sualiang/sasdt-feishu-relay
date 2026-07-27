import { Router, Request, Response } from 'express';
import { getLogger } from '../middleware/logger.js';
import { handleMessage, isValidRole, RoleName, ROLE_NAMES } from '../services/router.js';

const router = Router();

/**
 * GET /webhook/:role
 * 飞书事件订阅 — URL 验证（Challenge）
 * 飞书 GET 请求带 challenge 参数，原样返回
 */
router.get('/:role', (req: Request, res: Response) => {
  const { role } = req.params;
  const { challenge } = req.query;

  if (!isValidRole(role)) {
    res.status(404).json({ code: 404, message: `未知角色: ${role}` });
    return;
  }

  if (challenge) {
    // 飞书 URL 验证
    res.json({ challenge });
    return;
  }

  res.json({ code: 0, message: `${role} webhook 就绪` });
});

/**
 * POST /webhook/:role
 * 飞书事件回调接收
 * 处理 im.message.receive_v1 事件
 */
router.post('/:role', async (req: Request, res: Response) => {
  const { role } = req.params;
  const log = getLogger();

  if (!isValidRole(role)) {
    res.status(404).json({ code: 404, message: `未知角色: ${role}` });
    return;
  }

  const body = req.body;

  // 处理 URL 验证挑战
  if (body.type === 'url_verification') {
    res.json({ challenge: body.challenge });
    return;
  }

  // 处理事件回调
  if (body.header?.event_type === 'im.message.receive_v1') {
    const event = body.event;
    log.info('收到飞书消息', {
      role,
      chatType: event.message.chat_type,
      messageType: event.message.message_type,
      chatId: event.message.chat_id,
      senderId: event.sender.sender_id.open_id,
    });

    // 仅处理文本消息
    if (event.message.message_type !== 'text') {
      res.json({ code: 0, message: '非文本消息，跳过' });
      return;
    }

    // 提取消息文本
    let messageText = '';
    try {
      const content = JSON.parse(event.message.content);
      messageText = content.text || '';
    } catch {
      messageText = event.message.content;
    }

    // 群聊 @ 清洗
    if (event.message.chat_type === 'group') {
      messageText = messageText.replace(/@_user_\d+/g, '').trim();
    }

    if (!messageText) {
      res.json({ code: 0, message: '空消息' });
      return;
    }

    // 立即回复 200（飞书要求 3 秒内应答）
    res.json({ code: 0, message: 'ok' });

    // 异步处理消息
    const sessionId = `${role}:${event.message.chat_id}:${event.sender.sender_id.open_id}`;
    handleMessage(role as RoleName, messageText, event.message.chat_id, event.message.chat_type, event.sender.sender_id.open_id, sessionId)
      .catch((err) => log.error('消息处理失败', { error: err.message }));
    return;
  }

  // 未知事件类型
  log.warn('未知事件类型', { eventType: body.header?.event_type });
  res.json({ code: 0, message: 'unknown event' });
});

export default router;
