import { config as dotenvConfig } from 'dotenv';
import { AppConfig } from '../types/config.js';

dotenvConfig({ path: '.env' });
dotenvConfig({ path: '.env.local' });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[Config] 缺少必要环境变量: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

let _config: AppConfig | null = null;

export function loadConfig(): AppConfig {
  if (_config) return _config;

  _config = {
    port: parseInt(optionalEnv('PORT', '3000'), 10),
    nodeEnv: optionalEnv('NODE_ENV', 'development'),

    feishu: {
      appId: requireEnv('FEISHU_APP_ID'),
      appSecret: requireEnv('FEISHU_APP_SECRET'),
      verificationToken: requireEnv('FEISHU_VERIFICATION_TOKEN'),
    },

    ai: {
      deepseekApiKey: optionalEnv('DEEPSEEK_API_KEY', ''),
      doubaoApiKey: optionalEnv('DOUBAO_API_KEY', ''),
      claudeApiKey: optionalEnv('CLAUDE_API_KEY', ''),
      qianwenApiKey: optionalEnv('QIANWEN_API_KEY', ''),
    },

    logLevel: optionalEnv('LOG_LEVEL', 'info'),

    rolePrompts: {
      doubao: optionalEnv('PROMPT_DOUBAO', '你是豆包，SASDT 体系的项目总监。负责接收需求、验收测试、全线联调。请用中文专业地回答。'),
      ke: optionalEnv('PROMPT_KE', '你是小克，SASDT 体系的技术总监。负责架构设计、代码审计。'),
      kai: optionalEnv('PROMPT_KAI', '你是小开，SASDT 体系的开发工程师。负责编码实现。请用中文回答。'),
      long: optionalEnv('PROMPT_LONG', '你是小龙，SASDT 体系的运维。负责环境搭建、部署上线、服务器运维。请用中文回答。'),
      qian: optionalEnv('PROMPT_QIAN', '你是小千，SASDT 体系的项目审计。负责代码审计、规则检查。请用中文回答。'),
    },
  };

  return _config;
}

export function getConfig(): AppConfig {
  if (!_config) return loadConfig();
  return _config;
}
