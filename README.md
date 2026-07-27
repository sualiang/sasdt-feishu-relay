# SASDT 飞书中转服务

为 SASDT 体系 5 个角色提供统一的飞书 Bot 消息中转服务。

## 架构

```
飞书服务器 → Nginx(443) → Express(3000) → AI 适配器 → AI API
                 ↓
           健康检查 /health
                 ↓
           审计日志 stdout
```

## 5 个 Webhook 端点

| 路径 | 角色 | 后端 AI | 说明 |
|------|------|---------|------|
| `/webhook/doubao` | 豆包 | 豆包 API | 项目总监 |
| `/webhook/ke` | 小克 | 固定回复 | 技术总监（暂不接 AI） |
| `/webhook/kai` | 小开 | DeepSeek | 开发工程师 |
| `/webhook/long` | 小龙 | DeepSeek | 运维 |
| `/webhook/qian` | 小千 | 千问 API | 项目审计 |

## 快速开始

### 开发

```bash
cd server
cp .env.example .env   # 填入实际配置
npm install
npm run dev            # 热重载开发模式
```

### 构建

```bash
npm run build          # 编译到 dist/
npm start              # 生产运行
```

### Docker 部署

```bash
# 1. 配置 .env
cp server/.env.example server/.env
# 编辑 server/.env 填入实际值

# 2. 构建并启动
docker compose up -d

# 3. 查看日志
docker logs -f sasdt-feishu-relay

# 4. 健康检查
curl http://localhost:3000/health
```

## 目录结构

```
feishu-bot-relay/
├── CLAUDE.md                    # 项目上下文
├── MCP/                         # 项目知识库
├── server/
│   └── src/
│       ├── index.ts             # Express 启动入口
│       ├── config/              # 配置管理
│       ├── routes/              # Webhook + Health 路由
│       ├── middleware/          # 签名校验、日志、错误处理
│       ├── services/            # 飞书 API、角色路由、上下文
│       ├── adapters/            # AI 适配器（DeepSeek/豆包/Claude/千问）
│       ├── types/               # TypeScript 类型
│       └── utils/               # 工具函数
├── Dockerfile                   # 多阶段构建
├── docker-compose.yml           # Docker Compose
├── hooks/                       # Git hooks
└── secrets/                     # 凭据（受 .gitignore 保护）
```

## 环境变量

参见 `server/.env.example`。

## 飞书配置

1. 在[飞书开放平台](https://open.feishu.cn)创建应用
2. 开启 **机器人** 能力
3. 配置事件订阅：
   - 事件：`im.message.receive_v1`
   - 请求地址：`https://your-domain.com/webhook/event`
4. 获取 `FEISHU_APP_ID`、`FEISHU_APP_SECRET`、`FEISHU_VERIFICATION_TOKEN`
5. 发布应用并添加机器人到群聊

## 健康检查

```bash
GET /health

# 成功响应
{ "status": "ok", "uptime": 12345, "timestamp": "2026-07-26T12:00:00.000Z" }
```
