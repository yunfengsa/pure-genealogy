# pure-genealogy 族谱项目 - AI 编码指南

## 项目概述

这是一个基于 **Next.js 15 (App Router)** + **Supabase** 的家族族谱管理应用，使用 TypeScript 开发。

## 技术栈

- **框架**: Next.js 15 (App Router, RSC)
- **后端/数据库**: Supabase (PostgreSQL + Auth + Realtime)
- **UI**: shadcn/ui (new-york 风格) + Tailwind CSS
- **可视化**: @xyflow/react (React Flow) 用于族谱图
- **主题**: next-themes 支持明暗模式

## 关键架构模式

### Supabase 客户端使用规范

项目有三种 Supabase 客户端，**必须根据上下文正确选择**：

| 场景 | 使用文件 | 调用方式 |
|------|----------|----------|
| Client Component | `lib/supabase/client.ts` | `createClient()` 同步 |
| Server Component / Route Handler | `lib/supabase/server.ts` | `await createClient()` 异步 |
| Middleware | `lib/supabase/proxy.ts` | `updateSession(request)` |

```typescript
// ✅ Server Component 中
const supabase = await createClient();
const { data } = await supabase.auth.getClaims();

// ✅ Client Component 中
'use client'
const supabase = createClient();
```

### 路由保护规则

通过 `lib/supabase/proxy.ts` 实现认证中间件：
- 公开路由: `/`, `/noauth/*`, `/auth/*`, `/login/*`
- 受保护路由: 其他所有路径（未登录自动跳转 `/auth/login`）

### 认证流程

- 使用 `supabase.auth.getClaims()` 获取用户信息（比 `getUser()` 更快）
- 登录成功后跳转到 `/protected`
- 认证相关页面位于 `app/auth/` 目录

## 核心功能模块

### 族谱管理 (`app/family-tree/`)
- **成员列表**: 分页展示家族成员，支持搜索。
- **添加/编辑**: 包含成员基本信息、父母关系（`father_id`）、配偶等。

### 族谱可视化 (`app/family-tree/graph/`)
- 基于 `@xyflow/react` 实现。
- 自动生成树形结构图，展示成员关系。

## 数据库 Schema

### family_members 表（族谱核心表）
```sql
id, name, generation, sibling_order, father_id, gender, 
official_position, is_alive, spouse, remarks, updated_at
```
- `father_id` 自引用实现树形结构
- `gender` 限制为 '男' 或 '女'

## 开发命令

```bash
npm run dev    # 启动开发服务器 (localhost:3000)
npm run build  # 生产构建
npm run lint   # ESLint 检查
```

## 组件规范

### 路径别名
```typescript
@/components  → components/
@/lib         → lib/
@/hooks       → hooks/
@/components/ui → shadcn 组件
```

### UI 组件使用
- 使用 `cn()` 函数合并 className: `cn("base-class", className)`
- shadcn 组件位于 `components/ui/`
- 图标使用 `lucide-react`

### 实时功能
使用 `hooks/use-realtime-chat.tsx` 作为 Supabase Realtime 的参考实现。

## 环境变量

必需配置 `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```