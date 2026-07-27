/** 应用配置类型 */
export interface AppConfig {
  port: number;
  nodeEnv: string;

  /** 飞书应用凭证 */
  feishu: {
    appId: string;
    appSecret: string;
    verificationToken: string;
  };

  /** AI API 密钥 */
  ai: {
    deepseekApiKey: string;
    doubaoApiKey: string;
    claudeApiKey: string;
    qianwenApiKey: string;
  };

  /** 日志级别 */
  logLevel: string;

  /** 角色 Prompt 配置 */
  rolePrompts: Record<string, string>;
}
