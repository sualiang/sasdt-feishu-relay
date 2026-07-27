/** 飞书事件回调 — 请求头 */
export interface FeishuHeaders {
  timestamp: string;
  nonce: string;
  signature: string;
}

/** 飞书事件回调 — 挑战请求 */
export interface FeishuChallengeRequest {
  challenge: string;
  token: string;
  type: 'url_verification';
}

/** 飞书消息事件 sender */
export interface FeishuSender {
  sender_id: {
    union_id: string;
    user_id: string;
    open_id: string;
  };
  sender_type: 'user' | 'bot';
  tenant_key: string;
}

/** 飞书消息体 */
export interface FeishuMessage {
  message_id: string;
  root_id: string;
  parent_id: string;
  create_time: string;
  chat_id: string;
  chat_type: 'group' | 'p2p';
  message_type: 'text' | 'image' | 'post' | 'file';
  content: string; // JSON 字符串
}

/** 飞书消息事件 Payload */
export interface FeishuEvent {
  schema: string;
  header: {
    event_id: string;
    token: string;
    create_time: string;
    event_type: string;
    app_id: string;
  };
  event: {
    sender: FeishuSender;
    message: FeishuMessage;
  };
}

/** 飞书回调统一请求体（挑战 或 事件） */
export type FeishuCallbackBody = FeishuChallengeRequest | FeishuEvent;

/** 飞书 API 发送消息请求 */
export interface FeishuSendMessageRequest {
  receive_id: string;
  msg_type: 'text' | 'post' | 'image' | 'interactive';
  content: string;
}

/** 飞书 API 响应 */
export interface FeishuApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

/** 飞书 token 响应 */
export interface FeishuTokenResponse {
  access_token: string;
  token_type: string;
  expire: number;
}
