# pure-genealogy 族谱项目 - AI 编码指南

## 项目概述

基于 **Next.js 15 (App Router)** + **Supabase** 的家族族谱管理应用，TypeScript 开发。

## 技术栈

- **框架**: Next.js 15 (App Router, RSC)
- **后端/数据库**: Supabase (PostgreSQL + Auth + Realtime)
- **UI**: shadcn/ui (new-york 风格) + Tailwind CSS + lucide-react 图标
- **可视化**: @xyflow/react 实现族谱关系图
- **主题**: next-themes 明暗模式

## Supabase 客户端规范（必读）

**必须根据上下文选择正确的客户端**：

| 场景 | 文件 | 调用方式 |
|------|------|----------|
| Client Component | `lib/supabase/client.ts` | `createClient()` 同步 |
| Server Component / Server Actions | `lib/supabase/server.ts` | `await createClient()` 异步 |
| Middleware | `lib/supabase/middleware.ts` | `updateSession(request)` |

```typescript
// ✅ Server Actions 中 (app/family-tree/actions.ts 参考)
"use server";
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();

// ✅ Client Component 中
'use client'
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
```

## 页面开发模式

### Server Component + Client Component 分离模式
参考 `app/family-tree/` 目录结构：
- `page.tsx` - 页面入口，处理 URL 参数，使用 Suspense 包裹
- `*-loader.tsx` - Server Component，负责数据获取
- `*-table.tsx` / `*-graph.tsx` - Client Component (`"use client"`)，负责交互
- `actions.ts` - Server Actions (`"use server"`)，处理 CRUD

```tsx
// page.tsx 标准模式
export default function Page({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<Skeleton />}>
      <DataLoader searchParams={searchParams} />
    </Suspense>
  );
}
```

### Server Actions 返回格式
```typescript
// 统一返回格式
{ success: boolean; error: string | null }
// 或带数据
{ data: T[]; count: number; error: string | null }
```

### 批量查询关联数据（避免 JOIN）
```typescript
const fatherIds = data.map(item => item.father_id).filter(Boolean);
const { data: fathers } = await supabase
  .from("family_members")
  .select("id, name")
  .in("id", fatherIds);
const fatherMap = Object.fromEntries(fathers.map(f => [f.id, f.name]));
```

## React Flow 可视化开发

参考 `app/family-tree/graph/` 目录：
- 自定义节点定义在 `family-node.tsx`，使用 `memo()` 优化
- 节点数据类型需包含 `[key: string]: unknown` 索引签名
- CSS 导入使用 `// @ts-expect-error` 注释抑制类型错误
- 主题适配：使用 CSS 变量 `hsl(var(--foreground))` 等

```tsx
// 自定义节点数据类型
export interface FamilyNodeData extends FamilyMemberNode {
  isHighlighted?: boolean;
  [key: string]: unknown;  // 必需的索引签名
}
```

## 路由与认证

- 公开路由: `/`, `/noauth/*`, `/auth/*`, `/login/*`
- 受保护路由: 其他所有路径（自动跳转 `/auth/login`）
- 认证检查使用 `supabase.auth.getClaims()`（比 `getUser()` 更快）

## 数据库 Schema

### family_members 表
```sql
id, name, generation, sibling_order, father_id, gender, 
official_position, is_alive, spouse, remarks, updated_at
```
- `father_id` 自引用实现树形结构
- `gender` 限制为 '男' 或 '女'
- 完整 SQL 见 `.github/family_members.sql`

## 组件规范

### 路径别名
```typescript
@/components/ui  → shadcn 组件
@/lib/utils      → cn() 函数
@/hooks          → 自定义 hooks
```

### UI 模式
- 使用 `cn()` 合并 className
- 弹窗使用 shadcn Dialog 组件
- 表格使用 shadcn Table + 手动分页
- 图标统一使用 lucide-react

## 开发命令

```bash
npm run dev    # localhost:3000
npm run build  # 生产构建
npm run lint   # ESLint 检查
```

## 环境变量

`.env.local` 必需：
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

## 相关指令文件

- `.github/instructions/react-flow.instructions.md` - React Flow 详细用法
