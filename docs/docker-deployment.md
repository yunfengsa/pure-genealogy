# Docker 部署与运维

2026-10-16 已发布 `onehacker/pure-genealogy:2026.10.16` 与 `latest`，两者均支持 `linux/amd64`、`linux/arm64`。已从 Docker Hub 重新读取并核对两个标签指向相同镜像。建议生产使用版本标签便于回滚。

应用镜像：`docker.io/onehacker/pure-genealogy`，支持 `linux/amd64`、`linux/arm64`。建议生产部署指定已经验证的版本标签；`latest` 用于跟随最新发布。

一个部署共享一份族谱，所有已登录用户都可以查看、增删改成员。这里的“管理员创建账号”是服务端创建用户的运维操作，应用没有不同管理级别或多租户隔离。

## 方式一：连接已有 Supabase

适用于 Supabase Cloud 或已有的完整官方自托管栈。主机需要 Docker 与 Compose v2.20 或更高版本，不需要安装 Node；本文统一以支持 `up --wait` 的版本为基础。

```bash
git clone https://github.com/yunfengsa/pure-genealogy.git
cd pure-genealogy
cp .env.example .env
chmod 600 .env
```

编辑 `.env`：

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=你的_publishable_key_或_anon_JWT
NEXT_PUBLIC_FAMILY_SURNAME="刘"
GENEALOGY_IMAGE=onehacker/pure-genealogy:latest
APP_PORT=3000
SUPABASE_INTERNAL_URL=
```

在 Supabase SQL Editor 中执行仓库文件 [`docker/self-hosted/family-members.sql`](../docker/self-hosted/family-members.sql)。该文件包含现有 `family_members` 全部字段、索引、RLS、表与序列授权；只对新安装执行一次。已有数据库先备份并核对结构，不重复建表。匿名用户没有族谱权限，`authenticated` 用户可读写共享族谱。

在 Supabase Dashboard 的 Authentication → Users 中创建首位用户并确认邮箱。若不希望开放注册，在 Authentication 设置中关闭新用户注册。随后启动应用：

```bash
docker compose --env-file .env -f compose.yml pull
docker compose --env-file .env -f compose.yml up -d
docker compose --env-file .env -f compose.yml ps
curl -f http://localhost:3000/api/health
```

浏览器访问 `http://localhost:3000`，登录刚创建的账号。`/api/health` 只检查应用存活，不代表外部 Supabase 可用；登录与成员查询可验证外部服务连接。

## 方式二：一起运行精简自托管 Supabase

这个 Compose 启动五项服务：应用、`postgres:17-alpine`、`supabase/gotrue:v2.196.0`、`postgrest/postgrest:v14.17`、`nginx:1.28-alpine`。固定服务版本随仓库维护；Postgres 与 Nginx 的标签固定主版本系列，生产需要完全可复现时可在验证后锁定镜像 digest。

只公开应用 `3000` 与 API 网关 `8000`，数据库没有主机端口。网关只提供 Auth 和 REST API，不提供 Studio、Storage、Realtime、Edge Functions。仓库中的聊天示例组件需要另行接入 Realtime，不在这套精简服务范围内。需要这些能力时使用[完整官方自托管方案](https://supabase.com/docs/guides/self-hosting/docker)，再按方式一连接。

在项目根目录执行（Node 22 或更高）：

```bash
git clone https://github.com/yunfengsa/pure-genealogy.git
cd pure-genealogy
node scripts/setup-self-hosted.mjs \
  --site-url http://localhost:3000 \
  --supabase-url http://localhost:8000 \
  --surname 刘
docker compose --env-file .env.self-hosted -f compose.self-hosted.yml pull
docker compose --env-file .env.self-hosted -f compose.self-hosted.yml up -d
docker compose --env-file .env.self-hosted -f compose.self-hosted.yml ps
node --env-file=.env.self-hosted scripts/create-admin.mjs admin@example.com
```

最后一条命令交互输入至少 12 字符密码且不回显，调用 Auth admin API 创建并确认邮箱；不会把用户直接插入 `auth.users`。浏览器访问 `http://localhost:3000` 登录。默认 `DISABLE_SIGNUP=true`，注册页面不能创建新账号；添加其他家人时再次运行管理脚本。

生成器随机创建三个独立数据库口令、48 字节 JWT secret、HS256 anon 与 service_role JWT，API 密钥有效十年；用户会话 access token 有效一小时并可刷新。配置写到根目录 `.env.self-hosted`，权限为 `0600`；文件已存在会拒绝覆盖。请备份并保留这些值，不因重启或升级重新生成。

局域网部署应在首次生成时用 NAS/服务器的实际地址，例如 `--site-url http://192.168.1.20:3000 --supabase-url http://192.168.1.20:8000`。`localhost` 总是浏览器所在设备，手机访问 NAS 时不能填写 `localhost`。

### NAS 没有 Node

以下是 Linux NAS 的等价命令，使用临时 Node 容器运行脚本；`--user` 让配置文件归当前用户所有：

```bash
docker run --rm --user "$(id -u):$(id -g)" \
  -v "$PWD:/work" -w /work node:22-bookworm-slim \
  node scripts/setup-self-hosted.mjs \
  --site-url http://192.168.1.20:3000 \
  --supabase-url http://192.168.1.20:8000
docker compose --env-file .env.self-hosted -f compose.self-hosted.yml up -d
docker run --rm -it --network host --user "$(id -u):$(id -g)" \
  -v "$PWD:/work:ro" -w /work node:22-bookworm-slim \
  node --env-file=.env.self-hosted scripts/create-admin.mjs admin@example.com
```

`--network host` 用于让临时容器访问 NAS 主机上的 API，也兼容配置为 `localhost:8000` 的 Linux 部署。Docker Desktop 的 host 网络需要另行启用；也可始终使用主机实际局域网地址。这里由 Node 的 `--env-file` 读取配置，避免 Docker `--env-file` 与 Compose 对引号的解析差异。

自动化非 TTY 环境可通过 `ADMIN_PASSWORD` 环境变量提供密码。不要将明文写在命令行或脚本仓库中。交互终端可先安全读取，再传给进程：

```bash
read -rs -p '账号密码：' ADMIN_PASSWORD
export ADMIN_PASSWORD
node --env-file=.env.self-hosted scripts/create-admin.mjs admin@example.com
unset ADMIN_PASSWORD
```

上面的 `read` 语法适用于 Bash。创建账号脚本不打印密码、服务密钥或 Auth 返回正文。

## 地址、参数与公网 HTTPS

| 参数 | 用途 / 默认值 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 浏览器可访问的 HTTP(S) API 根地址，自托管时为网关地址；不能是 PostgreSQL 连接串 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 浏览器公开的 publishable key 或 anon JWT；自托管生成器填 anon JWT |
| `NEXT_PUBLIC_FAMILY_SURNAME` | 族谱姓氏，默认“刘” |
| `SUPABASE_INTERNAL_URL` | 仅服务端网络地址；精简栈默认 `http://gateway:8000`，已有 Supabase 可留空 |
| `SITE_URL` | 自托管应用的浏览器公开地址，同时作为 Auth 默认回调与网关 CORS 允许来源 |
| `APP_PORT` / `API_PORT` | 主机监听端口，默认 `3000` / `8000`；生成器不根据公开 HTTPS 端口修改它们 |
| `BIND_ADDRESS` | 精简栈监听地址，默认 `0.0.0.0`；反向代理位于本机时可追加 `BIND_ADDRESS=127.0.0.1` |
| `GENEALOGY_IMAGE` | 应用镜像及标签 |
| `DISABLE_SIGNUP` | 默认 `true`，只由运维创建账号 |
| `POSTGRES_PASSWORD` | 数据库超级用户口令，只供数据库容器使用 |
| `AUTH_DB_PASSWORD` / `REST_DB_PASSWORD` | Auth 与 PostgREST 各自的数据库登录口令 |
| `JWT_SECRET` / `SERVICE_ROLE_KEY` | 服务端密钥，不得放进任何 `NEXT_PUBLIC_*` 参数 |
| `ANON_KEY` | 网关公开 API key，须与公开配置里的 anon key 保持一致 |

同一应用镜像启动时读取三个公开参数，不需要重建。`SUPABASE_INTERNAL_URL` 只改变 SSR 到 Supabase 的网络路径，cookie 名称仍从公开 URL 派生，使浏览器与 SSR 共享身份。请让内部地址与公开地址指向同一 Supabase。所有授权用户共享该服务的数据。

公网部署推荐两个 HTTPS 域名，例如应用 `https://genealogy.example.com`、API `https://api.example.com`。分别反向代理到 `3000` 与 `8000`，代理须保留 Host、Authorization、apikey 等请求头与查询参数；网关按 `SITE_URL` 返回 CORS，不能把浏览器 Origin 改成内部主机名。站点使用 HTTPS 时 API 也必须使用 HTTPS。

自托管配置：`SITE_URL=https://genealogy.example.com`、`NEXT_PUBLIC_SUPABASE_URL=https://api.example.com`，内部 URL 仍可为 `http://gateway:8000`。Auth 的公开验证链接由 `API_EXTERNAL_URL`（Compose 自动使用公开 API 地址）生成，允许回调为 `SITE_URL/auth/confirm` 与 `SITE_URL/auth/update-password`。外部模式应在 Dashboard 中配置 Site URL 与相同回调地址。

修改配置后运行相应 `docker compose ... up -d` 以重新创建需要变更的容器。精简栈若重新创建 Auth 或 REST，还需执行 `docker compose --env-file .env.self-hosted -f compose.self-hosted.yml restart gateway`，让 Nginx 重新解析服务地址。初始化 SQL 仅在空数据目录执行，修改环境变量里的数据库口令不会自动修改现有角色口令；不要直接重生成配置覆盖旧口令。JWT secret 轮换还需同步生成两种 API key，并使现有用户重新登录。

Next.js 为每次容器启动的动态配置关闭 `cacheComponents`，根布局读取请求时配置，保留页面中的 Suspense；这使同一构建可以用于不同 Supabase 项目和姓氏。

## SMTP 与找回密码

不配置 SMTP 时，管理脚本创建并确认的账号可以登录；邮件找回密码不可用。仅配置 SMTP 连接还不够，SSR 应用需要正确的 token_hash 邮件模板。

在 `.env.self-hosted` 填写 `SMTP_HOST`、`SMTP_PORT`（默认 `587`）、`SMTP_USER`、`SMTP_PASS`、`SMTP_ADMIN_EMAIL`（发信地址）、`SMTP_SENDER_NAME`。再将以下 HTML 放到 Auth 容器可访问的稳定 HTTPS URL，例如 `https://static.example.com/genealogy-recovery.html`：

```html
<h2>重置族谱账号密码</h2>
<p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=recovery&amp;next=/auth/update-password">设置新密码</a></p>
```

配置 `MAILER_TEMPLATES_RECOVERY=https://static.example.com/genealogy-recovery.html`，重新创建 Auth 容器：

```bash
docker compose --env-file .env.self-hosted -f compose.self-hosted.yml up -d auth
docker compose --env-file .env.self-hosted -f compose.self-hosted.yml restart gateway
```

应用的 `/auth/confirm` 将 token_hash 交给 `verifyOtp`，设置 SSR cookie 后转到 `/auth/update-password`。不要把默认 `{{ .ConfirmationURL }}` 的 URL fragment 流程当成已适配本应用的密码恢复流程；仅把邮件地址指向 `/auth/update-password` 也不够。外部 Supabase 在 Dashboard 的 Reset Password 邮件模板填写同一 HTML。

精简栈默认关闭注册，也不使用邀请邮件。若自行开启注册、邀请或 OAuth，需要按[邮件模板文档](https://supabase.com/docs/guides/auth/auth-email-templates)和[SSR 邮箱确认说明](https://supabase.com/docs/guides/auth/server-side/nextjs)设置相应模板、提供商与回调。确认邮箱模板可使用 `/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/`，并在 GoTrue 中配置对应 `GOTRUE_MAILER_TEMPLATES_CONFIRMATION`。不要将 `next` 指向外部域名。

网关对 `/auth/v1/verify`、`/auth/v1/callback`、`/auth/v1/authorize` 保留官方公开跳转语义，浏览器无需 apikey 头；其他 Auth 与 REST 路由必须有正确 apikey，用户 Authorization token 原样传递，缺省使用 anon token。service_role 仍由 Auth / PostgREST 验证，不能把它当浏览器 key 使用。

## 同源部署（单域名）

默认形态把 API 网关挂在独立域名上（浏览器跨域请求 `/auth/v1`、`/rest/v1`）。个人自托管通常只有一个域名，此时可让 API 与页面同源：

1. 应用侧留空 `NEXT_PUBLIC_SUPABASE_URL`，服务端保留 `SUPABASE_INTERNAL_URL=http://gateway:8000`；容器启动校验会要求内部地址存在。
2. 反向代理把站点域名下的 `/auth/v1`、`/rest/v1` 转发到 `gateway:8000`，其余路径转发到应用 `3000`。
3. Auth 的 `API_EXTERNAL_URL` 填站点地址（本仓库 Compose 已按此回落到 `SITE_URL`）。

同源后浏览器只请求当前域名：没有跨域预检，也不需要维护 CORS 白名单；会话 cookie 名固定为 `sb-auth-token`，与访问域名无关。反向代理若改写 Host 头也不影响 API 地址，因为地址由浏览器按 `window.location.origin` 决定。

## 数据持久化、备份与恢复

Compose 项目名默认 `pure-genealogy`，数据库使用 `db-data` 命名卷与卷内 `pgdata` 目录。`docker compose down` 保留数据卷；`down -v` 会删除族谱与全部账号。请保持项目名及原配置文件不变。备份数据库与 `.env.self-hosted`，二者都含敏感信息。

在线逻辑备份（包含 Auth 账号、族谱、序列与策略）：

```bash
umask 077
mkdir -p backups
backup_file="backups/genealogy-$(date +%F-%H%M%S).sql"
docker compose --env-file .env.self-hosted -f compose.self-hosted.yml \
  exec -T db pg_dump -U postgres -d postgres --clean --if-exists > "$backup_file"
```

备份失败时不要把输出文件当成功备份；检查命令退出状态与文件大小，并定期在隔离环境试恢复。`pg_dump` 不导出数据库登录角色。恢复到新数据卷时，应先用原 `.env.self-hosted` 初始化空数据库，以创建角色与口令；下面的 `up -d --wait db` 会等待初始化 SQL 完成且数据库健康后再返回。确认该命令成功，再停止业务服务并导入备份，避免与新卷初始化竞争：

```bash
docker compose --env-file .env.self-hosted -f compose.self-hosted.yml up -d --wait db
docker compose --env-file .env.self-hosted -f compose.self-hosted.yml stop app gateway rest auth
docker compose --env-file .env.self-hosted -f compose.self-hosted.yml \
  exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 < backups/需要恢复的备份.sql
docker compose --env-file .env.self-hosted -f compose.self-hosted.yml up -d
```

恢复会替换目标数据库里备份涵盖的同名对象；执行前核对环境与备份。备份可直接迁往同主版本 PostgreSQL；跨 PostgreSQL 主版本按官方升级流程单独演练。

## 升级与排错

先备份，再把 `GENEALOGY_IMAGE` 改为目标版本，然后：

```bash
docker compose --env-file .env.self-hosted -f compose.self-hosted.yml pull
docker compose --env-file .env.self-hosted -f compose.self-hosted.yml up -d
docker compose --env-file .env.self-hosted -f compose.self-hosted.yml restart gateway
docker compose --env-file .env.self-hosted -f compose.self-hosted.yml ps
docker compose --env-file .env.self-hosted -f compose.self-hosted.yml logs --tail=100 app auth rest gateway
```

升级应用不需要 `down -v`。服务版本升级应阅读对应上游迁移说明，不能直接把旧 PostgreSQL 数据目录交给不同主版本。应用回滚可恢复旧镜像标签；数据库/Auth schema 变更的回滚应使用演练过的数据库备份。

若应用健康但无法登录，核对浏览器可访问 API、公开 anon key、内部 URL、Site URL 与回调；检查 Auth/PostgREST 健康状态。不能通过给匿名角色开放成员权限来绕过登录问题。网关关闭访问日志以避免邮件验证 token 出现在 URL 日志中；外部反向代理也应避免记录验证链接的查询参数。不要公开完整配置输出、数据库备份或服务日志中的用户信息。

## 多架构构建与发布

发布脚本默认只构建，显式 `--push` 才发布到 Docker Hub。版本标签与 `latest` 均包含 amd64、arm64；镜像不包含构建机器的 `.env*`、账号密码或 service_role。发布前完成测试、真实镜像启动与功能检查，凭据只通过 CLI 登录。

脚本统一使用完整 registry 引用，默认发布 `docker.io/onehacker/pure-genealogy:<版本>` 与 `docker.io/onehacker/pure-genealogy:latest`。`GENEALOGY_REPOSITORY=myteam/genealogy` 等短名也会补上 `docker.io/`；已带域名、端口或 `localhost` 的 registry 保持原样。Apple container 1.1.0 推送短名会报 `could not extract host from reference`，手动推送也应使用完整引用。

Apple container 1.1.0：

```bash
container system start
container registry login docker.io
bash scripts/publish-image.sh --engine container --version 2026.10.16
# 验证后显式发布；此命令会复用构建缓存
bash scripts/publish-image.sh --engine container --version 2026.10.16 --push
```

脚本用 `pwd -P` 解析物理 context 路径。本机实测 Apple container 1.1.0 在 `/tmp` 与 `/private/tmp` 会遗漏目录，脚本在此路径直接拒绝构建；请将项目放到用户目录。若已有 builder 的 CPU/内存不够，可先 `container builder stop`，再运行脚本；脚本向 build 传入默认 6 CPU / 8G，可通过 `BUILD_CPUS`、`BUILD_MEMORY` 调整。Apple container 本身不负责解析 Docker Compose，Mac 可用 Docker Desktop 运行上面的 Compose 部署，或自行按相同环境与网络配置启动各容器。

Docker buildx：

```bash
docker buildx create --name genealogy-builder --use
docker login
bash scripts/publish-image.sh --engine buildx --version 2026.10.16
# 验证后显式发布
bash scripts/publish-image.sh --engine buildx --version 2026.10.16 --push
docker buildx imagetools inspect docker.io/onehacker/pure-genealogy:2026.10.16
docker buildx imagetools inspect docker.io/onehacker/pure-genealogy:latest
```

Linux amd64 主机交叉构建 arm64 需要可用的 QEMU/binfmt 或原生多节点 builder。buildx 默认构建结果保存在 `docker-output/<版本>.tar` OCI 归档，不自动加载到经典 Docker 镜像存储；部署通常使用发布后的 registry 镜像。`--push` 模式直接发布两个标签。手动等价命令为：

```bash
docker buildx build --platform linux/amd64,linux/arm64 \
  -t docker.io/onehacker/pure-genealogy:2026.10.16 \
  -t docker.io/onehacker/pure-genealogy:latest --push .
```

GitHub Actions 的 `.github/workflows/docker-image.yml` 仅接受手动触发或 `v*` 版本标签。仓库配置 secrets `DOCKERHUB_USERNAME`、`DOCKERHUB_TOKEN` 后可用；目标仓库为 `onehacker/pure-genealogy`。普通分支或 PR 不触发发布。

运行依赖已固定 Next.js 16.4.2 并更新兼容范围内的已知修复；`xlsx@0.18.5` 的现有 npm 安全告警暂无 npm 修复版本，保留以兼容现有 Excel 导入，不宣称已消除该存量风险。

参考：[Supabase 自托管](https://supabase.com/docs/guides/self-hosting/docker)、[Supabase Auth 初始化模型](https://github.com/supabase/auth/blob/v2.196.0/init_postgres.sh)、[Next.js 自托管](https://nextjs.org/docs/app/guides/self-hosting)、[Apple container 命令](https://github.com/apple/container/blob/main/docs/command-reference.md)、[Docker 多架构 GitHub Actions](https://docs.docker.com/build/ci/github-actions/multi-platform/)。
