# 族谱管理系统 (Family Genealogy)

<p align="center">
  <img alt="pure-genealogy Tree" src="app/opengraph-image.png" width="800">
</p>

<p align="center">
  一个基于 Next.js 15 和 Supabase 构建的现代化、全中文家族族谱管理系统。
</p>

## ✨ 项目亮点

- **现代化技术栈**: 采用最新的 Next.js 15 (App Router) 和 React 19。
- **全栈解决方案**: 后端使用 Supabase，提供数据库、认证和实时功能。
- **全中文化界面**: 深度适配中文语境，包括 UI 文案、日期展示及系统元数据。
- **多维度可视化**:
  - **2D 树形图**: 使用 React Flow (@xyflow/react) 自动生成动态交互的家族树。
  - **3D 力导向图**: 基于 `react-force-graph-3d` 提供酷炫的三维视角家族关系网。
- **完备的成员档案**: 支持详细的成员信息管理，包括世代、排行、生日、居住地、配偶及官职等。

## 🛠️ 技术栈

- **框架**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions)
- **数据库 & 认证**: [Supabase](https://supabase.com/) (PostgreSQL)
- **UI 组件库**: [shadcn/ui](https://ui.shadcn.com/)
- **样式**: [Tailwind CSS](https://tailwindcss.com/)
- **可视化**: 
  - [@xyflow/react](https://reactflow.dev/) (2D 族谱图)
  - [react-force-graph-3d](https://github.com/vasturiano/react-force-graph-3d) (3D 族谱图)
- **图标**: [Lucide React](https://lucide.dev/)

## 🚀 主要功能

### 1. 族谱成员管理 (`/family-tree`)
- **列表展示**: 分页显示家族成员，支持姓名实时搜索。
- **详细档案**: 记录成员姓名、世代、排行、父亲、性别、生日、居住地、官职、在世状态、配偶及备注。
- **便捷编辑**: 统一的弹窗式新增与编辑体验。

### 2. 族谱可视化
- **2D 视图 (`/family-tree/graph`)**: 自动布局生成的树形结构，支持缩放、拖拽和成员详情查看。
- **3D 视图 (`/family-tree/graph-3d`)**: 全方位、可交互的三维力导向图，支持搜索定位和沉浸式查看。
- **统一详情**: 无论在何种视图下，点击成员均可弹出一致的详细信息面板。

### 3. 用户系统
- **安全认证**: 基于 Supabase Auth 的注册、登录、找回密码及重置密码流程。
- **路由保护**: 核心管理功能受权限控制，确保家族数据安全。

## 📦 快速开始

### 1. 克隆项目

```bash
git clone
cd pure-genealogy
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` (如果没有则新建) 为 `.env.local` 并填入 Supabase 项目配置：

```env
NEXT_PUBLIC_SUPABASE_URL=你的_Supabase_项目_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=你的_Supabase_Anon_Key
```

### 4. 初始化数据库

在 Supabase 项目的 SQL Editor 中执行以下脚本（完整脚本见 `.github/family_members.sql`）：

```sql
CREATE TABLE family_members (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name text NOT NULL,
    generation integer,
    sibling_order integer,
    father_id bigint REFERENCES family_members(id),
    gender text CHECK (gender IN ('男', '女')),
    official_position text,
    is_alive boolean DEFAULT true,
    spouse text,
    remarks text,
    birthday date,
    residence_place text,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX idx_family_members_father_id ON family_members(father_id);
CREATE INDEX idx_family_members_name ON family_members(name);
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 即可看到应用。

## 📂 项目结构

```
/
├── app/                  # Next.js App Router 目录
│   ├── auth/             # 认证相关页面 (登录、注册、密码重置)
│   ├── family-tree/      # 族谱管理功能
│   │   ├── graph/        # 2D 族谱可视化
│   │   ├── graph-3d/     # 3D 族谱可视化
│   │   └── page.tsx      # 成员列表管理
│   └── protected/        # 受保护的示例页面
├── components/           # React 组件
│   ├── ui/               # shadcn/ui 通用 UI 组件
│   └── ...               # 业务逻辑组件
├── lib/                  # 工具库及配置
└── hooks/                # 自定义 Hooks
```

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。
