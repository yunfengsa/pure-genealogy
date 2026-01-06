# pure-genealogy 族谱项目 - AI 编码指南

## 项目概述

这是一个基于 **Next.js 15 (App Router)** + **Supabase** 的家族族谱管理应用，使用 TypeScript 开发。
项目已进行**全面中文化**（zh-CN），包括 UI 文案、日期格式及元数据。

## 技术栈

- **框架**: Next.js 15 (App Router, RSC)
- **后端/数据库**: Supabase (PostgreSQL + Auth + Realtime)
- **UI**: shadcn/ui (new-york 风格) + Tailwind CSS
- **可视化**: 
    - `@xyflow/react` (React Flow) 用于 2D 族谱图
    - `react-force-graph-3d` 用于 3D 族谱图
    - `recharts` 用于统计仪表盘
- **富文本**: `slate`, `slate-react`, `slate-history` 用于生平事迹编辑
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
- 登录成功后跳转到 `/`
- 认证相关页面位于 `app/auth/` 目录
- **登录体验优化**: 
    - 采用水墨山水背景（`login-bg.jpg`）及毛玻璃效果，增强家族文化氛围。
    - 登录按钮集成 `Loader2` 加载动画，提供明确的交互反馈。

### 数据缓存与刷新

为确保族谱数据在不同视图（列表、2D图、3D图、时间轴）之间保持同步，在 `app/family-tree/actions.ts` 中的所有数据变更操作（创建、更新、删除、批量导入）必须触发路径重验证：

```typescript
// 必须使用 "layout" 类型以失效整个路由段的缓存
revalidatePath("/family-tree", "layout");
```

## 核心功能模块

### 族谱管理 (`app/family-tree/`)
- **成员列表**: 分页展示家族成员，支持搜索。已针对移动端优化，工具栏支持自动换行，表格支持横向滚动。
- **添加/编辑**: 
    - 包含成员基本信息、父母关系（`father_id`）、配偶、生日（`birthday`）、居住地（`residence_place`）等。
    - **生平事迹**: 使用富文本编辑器（Slate.js）替代原备注字段，支持加粗、斜体、下划线，最大 500 字。
    - **弹窗优化**: 采用固定头部/底部 + 滚动内容区域的设计，防止内容过长溢出；点击遮罩不关闭以防数据丢失。
- **详情展示 (Living Book)**: 
    - `MemberDetailDialog` 采用 **3D 翻书/画卷** 的交互设计。
    - **内容分层**: 分为“基本信息”正面和“生平事迹”背面，支持平滑的 3D 旋转切换。
    - **视觉美化**: 采用纸张质感背景（`#fdfbf7` / `stone-900`）、衬线字体（`font-serif`）及装饰性边框。
    - **动效**: 生平事迹内容支持**逐字书写/毛笔扫过**（Brush Reveal）的动效，增强代入感。
    - **响应式**: 适配 PC（书卷比例）与移动端（全屏卡片），且完美支持明暗模式切换。
- **通用组件**: `RichTextViewer` 支持 `animate` 属性，用于触发逐字显示的艺术效果。

### 族谱可视化 (`app/family-tree/graph/`)
- 基于 `@xyflow/react` 实现。
- 自动生成树形结构图，展示成员关系。
- **节点视觉优化**:
    - **状态区分**: 显著区分“在世”与“已故”节点。已故节点采用 `bg-muted/50` 背景、脱色边框及 dimmed 文字，视觉上更暗淡，突出活跃成员。
    - **可读性**: 已故节点的名字使用 `text-foreground/80`，在保持暗淡感的同时确保信息清晰易读。
- **移动端优化**: 采用全宽透明工具栏，搜索框居左，操作按钮居右。在窄屏下按钮自动隐藏文字仅保留图标，防止 UI 重叠。
- **图片导出 (Export)**:
    - **Canvas 合成**: 摒弃单纯的 CSS 截图，采用 HTML5 Canvas 进行多层合成（背景 + 水印 + 族谱节点），彻底解决背景丢失问题。
    - **视觉增强**: 自动叠加水墨山水背景（`login-bg.jpg`）与当前用户邮箱的水印（平铺、低透明度），提升专业感与专属感。
    - **体积优化**: 导出格式优化为 JPEG (85% 质量, 2.0 倍率)，在保证高清打印质量的同时显著降低文件体积。
- 详情弹窗复用 `MemberDetailDialog`。

### 3D 族谱可视化 (`app/family-tree/graph-3d/`)
- 基于 `react-force-graph-3d` 实现。
- 提供三维视角的力导向图，支持全屏、搜索定位、节点点击详情等功能。
- **自动巡游 (Auto Tour)**:
    - **路径规划**: 基于 BFS 算法自动计算任意两名族人之间的最短关系路径。
    - **沉浸式体验**: 自动移动相机跟随路径巡游，支持暂停、继续及进度追踪。
    - **UI 交互**: 提供专用的巡游配置弹窗与悬浮控制台。
- **移动端优化**: 页面头部标题与切换按钮在移动端垂直堆叠显示。
- 使用 `three-spritetext` 渲染清晰的文字标签。
- 详情弹窗复用 `MemberDetailDialog`.

### 统计与分析 (`app/family-tree/statistics/`)
- 基于 `recharts` 实现的家族数据仪表盘。
- **可视化统计**:
    - **数据概览**: 总人数、男性比例、在世人数、世代总数。
    - **性别/状态比例**: 饼图展示家族成员性别分布及在世与已故比例。
    - **世代分布**: 柱状图展示每一世代的成员增长趋势。
    - **年龄分布**: 柱状图展示在世成员的年龄段分布（基于生日数据）。
    - **字辈趋势**: 自动统计姓名中第二个字（通常为字辈）的出现频率。

## 响应式与移动端规范

### 导航栏 (`components/mobile-nav.tsx`)
- 移动端使用 `MobileNav`（下拉菜单）替代桌面端水平导航。
- `AuthButton` 在移动端会自动调整为垂直布局，并对过长的邮箱地址进行截断处理。

### 布局工具类使用
- 优先使用 Tailwind 的响应式前缀（如 `md:flex`, `lg:row`）。
- 按钮组在移动端应使用 `flex-wrap` 以防溢出。
- 对于复杂的工具栏（如 Graph 页面），使用 `pointer-events-none` 配合内部元素的 `pointer-events-auto`，确保 UI 控件不会阻碍底层画布的交互。
- 移动端按钮应尽量移除文字说明 (`hidden sm:inline`) 仅保留图标，以节省空间。

## 数据库 Schema

### family_members 表（族谱核心表）
```sql
id, name, generation, sibling_order, father_id, gender, 
official_position, is_alive, spouse, remarks, birthday, death_date, residence_place, updated_at
```
- `father_id` 自引用实现树形结构
- `gender` 限制为 '男' 或 '女'
- `remarks` 存储生平事迹 (Slate JSON string)
- `birthday` 类型为 `date`
- `residence_place` 类型为 `text`

## 开发命令

```bash
npm run dev    # 启动开发服务器 (localhost:3000)
npm run build  # 生产构建
```

## 组件规范

### 路径别名
```typescript
@/components  → components/
@/lib         → lib/
@/hooks       → hooks/
@/components/ui → shadcn 组件
@/components/rich-text → 富文本编辑器组件
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
