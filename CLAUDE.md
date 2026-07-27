# SASDT 飞书中转服务 — 项目上下文

> 本项目的开发遵循 **SASDT 全局规则体系**。
> 全局规则参见：`.claude/SASDT/README.md`
>
> **版本**：V1.0 | **最后更新**：2026-07-26 | **维护人**：技术总监（小克）

---

## 项目定位

为 SASDT 体系 5 个角色提供统一的飞书 Bot 消息中转服务。接收飞书 Webhook 事件，按路由分发给对应角色（豆包/小克/小开/小龙/小千）。

相当于团队的**神经中枢**——所有飞书消息先进来，再转发给对应 AI 角色处理。

## 技术栈

| 层级 | 技术 |
|------|------|
| 运行时 | Node.js 22+ |
| 语言 | TypeScript 5.x (strict 模式) |
| 框架 | Express 4 + 中间件模式 |
| 构建 | tsc 编译，输出到 `dist/` |
| 部署 | Docker + Docker Compose |
| 服务器 | 175.24.200.63，Nginx 反代 |
| PM2 | 容器内进程管理 |

## 部署信息

| 项目 | 值 |
|------|----|
| 服务器 | 175.24.200.63 |
| 内部端口 | 3000 |
| 外部端口 | 443（Nginx HTTPS） |
| Webhook 路径 | `/webhook/:role`（5 个角色） |
| 部署方式 | Docker Compose |
| 代码仓库 | GitHub `suailiang/sasdt-feishu-relay` |

## 目录结构

```
feishu-bot-relay/
├── CLAUDE.md                         ← 本文件
├── MCP/                              ← 项目知识库
│   ├── 项目概览.md
│   ├── 架构设计.md
│   ├── 重要决策.md
│   └── 进度跟踪.md
├── hooks/                            ← Hooks 熔断脚本
│   ├── pre-hooks/
│   ├── post-hooks/
│   └── stop-hooks/
├── secrets/                          ← 凭据（.gitignore 保护）
├── server/                           ← 源码
│   ├── src/
│   │   ├── index.ts                  ← 入口
│   │   ├── config/                   ← 配置
│   │   ├── routes/                   ← 路由
│   │   ├── services/                 ← 业务逻辑
│   │   ├── adapters/                 ← AI 适配器
│   │   ├── middleware/               ← 中间件
│   │   ├── types/                    ← 类型定义
│   │   └── utils/                    ← 工具函数
│   ├── package.json
│   └── tsconfig.json
├── Dockerfile
├── docker-compose.yml
└── .gitignore
```

## 团队角色（本项目的参与方）

| 角色 | 名字 | 本项目中做什么 |
|------|------|--------------|
| 项目总监 | **豆包** | 验收测试、全线联调 |
| 技术总监 | **小克** | 架构设计、代码审计 |
| 开发工程师 | **小开** | 编码实现 |
| 运维 | **小龙** | 环境搭建、部署上线 |
| 项目审计 | **小千** | 代码审计、规则检查 |
