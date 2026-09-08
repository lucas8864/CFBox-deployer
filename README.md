# CFBox Deployer

> 一个基于 Cloudflare Pages / Workers 的 CFBox 自动部署与管理工具。

CFBox Deployer 提供 Web 图形化界面，用于自动完成 CFBox 的部署、UUID 生成、KV Namespace 创建与绑定、Worker / Pages 发布以及自定义域名配置。

项目支持：

* Cloudflare Workers 部署
* Cloudflare Pages 部署
* 自动生成随机项目名称
* 自动生成 UUID
* 自动创建 Cloudflare KV Namespace
* 自动绑定 UUID 环境变量
* 自动绑定 KV Namespace
* 自动启用 Workers.dev
* 自动获取 Cloudflare Zone
* 自动生成子域名
* Worker Route 自动配置
* DNS 记录自动创建与检查
* Pages Custom Domain 配置
* CFBox 明文版 / 混淆版双源下载
* Cloudflare API Token 验证
* 部署结果实时日志输出

---

# 📖 项目简介

CFBox Deployer 是一个用于简化 CFBox 部署流程的 Web 管理工具。

传统部署 CFBox 时，通常需要手动执行：

```text
创建 Worker
    ↓
创建 KV Namespace
    ↓
生成 UUID
    ↓
配置环境变量
    ↓
绑定 KV
    ↓
上传 Worker
    ↓
启用 workers.dev
    ↓
配置 DNS
    ↓
创建 Worker Route
    ↓
绑定自定义域名
```

CFBox Deployer 将这些操作集成到一个 Web 页面中。

用户只需要：

```text
输入 Cloudflare API Token
        ↓
选择 Cloudflare Account
        ↓
选择部署类型
        ↓
选择 CFBox 版本
        ↓
选择 Zone
        ↓
点击部署
```

系统自动完成剩余操作。

---

# ✨ 核心功能

## 1. Worker 部署

支持将 CFBox 自动部署到：

```text
Cloudflare Workers
```

部署后自动生成：

```text
Worker Name
UUID
KV Namespace
Workers.dev URL
Custom Domain
```

例如：

```text
项目名称:
cfbran7x9k2m

UUID:
c77d63ae-585e-4a10-8055-dcb3228998cd

Worker URL:
https://cfbran7x9k2m.example.workers.dev

自定义域名:
https://cfbran7x9k2m.example.com
```

---

# ☁️ Cloudflare Workers 部署流程

Worker 部署流程如下：

```text
生成随机项目名称
        ↓
生成 UUID
        ↓
创建 KV Namespace
        ↓
下载 CFBox 源码
        ↓
上传 Worker Script
        ↓
绑定 UUID
        ↓
绑定 KV Namespace
        ↓
启用 Workers.dev
        ↓
配置 DNS
        ↓
创建 Worker Route
        ↓
部署完成
```

---

## Worker 环境变量

CFBox Worker 自动配置：

```text
U
```

用于保存 UUID。

例如：

```text
U=c77d63ae-585e-4a10-8055-dcb3228998cd
```

部分 CFBox 版本可能使用：

```text
UUID
```

部署器会根据源码版本进行兼容处理。

---

## KV Binding

自动创建：

```text
KV Namespace
```

例如：

```text
cfbran7x9k2mkv
```

然后绑定到 Worker：

```text
Binding Name:
K
```

最终：

```text
Worker
├── U → UUID
└── K → KV Namespace
```

---

# 🌐 Workers.dev

Worker 部署完成后会自动启用：

```text
workers.dev
```

生成地址：

```text
https://项目名称.AccountSubdomain.workers.dev
```

例如：

```text
https://cfbran7x9k2m.example.workers.dev
```

如果 Workers.dev 没有启用，部署器会明确提示：

```text
⚠ Workers.dev 未启用
```

不会错误显示部署完全成功。

---

# 🌍 自定义域名

CFBox Deployer 支持自动获取 Cloudflare Account 中的 Zone。

例如：

```text
example.com
example.net
mydomain.org
```

用户选择：

```text
example.com
```

系统自动生成随机子域名：

```text
cfbran7x9k2m.example.com
```

而不是让用户手动输入完整域名。

这样可以避免：

```text
根域名 Route 冲突
重复子域名
DNS 记录冲突
```

---

# 🧭 Worker DNS 配置

Worker 使用自定义域名时，需要同时配置：

```text
DNS Record
+
Worker Route
```

完整流程：

```text
cfbran7x9k2m.example.com
        │
        ├── DNS Record
        │
        └── Worker Route
                │
                ▼
              Worker
```

DNS Record 会自动检查：

```text
不存在 → 创建

已存在 → 检查

冲突 → 提示错误
```

Worker Route 示例：

```text
cfbran7x9k2m.example.com/*
```

---

# 📄 Cloudflare Pages 部署

CFBox Deployer 本身可以部署到：

```text
Cloudflare Pages
```

项目使用：

```text
public/
functions/
```

结构：

```text
CFBox-deployer/
│
├── public/
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   ├── _worker.js
│   │
│   └── sources/
│       ├── CFBox明文版.js
│       └── CFBox混淆版.js
│
├── functions/
│   └── api/
│       └── [[path]].js
│
├── package.json
├── server.mjs
├── wrangler.toml
└── README.md
```

---

# 🚀 部署 CFBox Deployer 到 Cloudflare Pages

## 方式一：Wrangler CLI

首先安装依赖：

```bash
npm install
```

登录 Cloudflare：

```bash
npx wrangler login
```

或者使用 API Token：

```bash
export CLOUDFLARE_API_TOKEN="你的_API_TOKEN"
```

部署：

```bash
npx wrangler pages deploy public \
  --project-name=cfbox-deployer \
  --commit-dirty=true
```

部署成功后会显示：

```text
✨ Deployment complete!

https://cfbox-deployer.pages.dev
```

---

# 🔐 Cloudflare API Token

CFBox Deployer 使用 Cloudflare API Token 执行：

```text
Worker 创建
Worker 上传
KV 创建
KV Binding
Pages 创建
Pages 部署
DNS 创建
Zone 查询
Worker Route
Custom Domain
```

因此需要正确配置权限。

---

# 🔑 推荐 API Token 权限

## Account Permissions

建议配置：

```text
Workers Scripts
Edit

Workers KV Storage
Edit

Cloudflare Pages
Edit
```

---

## Zone Permissions

如果需要自动配置自定义域名：

```text
Zone
Read

DNS
Edit

Workers Routes
Edit
```

---

## Resources

Account：

```text
Include
指定 Cloudflare Account
```

或者：

```text
All Accounts
```

Zone：

```text
Include
指定 Zone
```

例如：

```text
example.com
```

也可以：

```text
All Zones
```

---

# ⚠️ Authentication error

如果页面提示：

```text
❌ 部署失败：Authentication error
```

但 Token 验证显示：

```text
✓ Token 有效
```

通常表示：

```text
Token 本身有效
        ↓
但没有具体 API 权限
```

例如：

```text
Token Verify ✓

Workers Scripts ✗

Pages ✗

KV ✗
```

Token 验证接口：

```text
/user/tokens/verify
```

只验证 Token 是否有效。

它不代表 Token 一定拥有：

```text
Workers
Pages
KV
DNS
```

权限。

---

# 🔍 API Token 测试

不要将 Token 上传到 GitHub。

在 Ubuntu 中：

```bash
export CF_TOKEN='你的Token'
```

验证：

```bash
curl -s \
  https://api.cloudflare.com/client/v4/user/tokens/verify \
  -H "Authorization: Bearer $CF_TOKEN"
```

正确结果：

```json
{
  "success": true
}
```

---

## 获取 Account

```bash
curl -s \
  https://api.cloudflare.com/client/v4/accounts \
  -H "Authorization: Bearer $CF_TOKEN"
```

---

## 测试 Workers

```bash
export CF_ACCOUNT_ID='你的AccountID'

curl -s \
  "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/workers/scripts" \
  -H "Authorization: Bearer $CF_TOKEN"
```

---

## 测试 KV

```bash
curl -s \
  "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/storage/kv/namespaces" \
  -H "Authorization: Bearer $CF_TOKEN"
```

---

## 测试 Pages

```bash
curl -s \
  "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects" \
  -H "Authorization: Bearer $CF_TOKEN"
```

---

## 测试 Zone

```bash
curl -s \
  "https://api.cloudflare.com/client/v4/zones?per_page=100" \
  -H "Authorization: Bearer $CF_TOKEN"
```

---

# 🧩 CFBox 源码

项目支持两个 CFBox 源码版本：

```text
CFBox 明文版
CFBox 混淆版
```

部署时可以选择：

```text
明文版
```

或者：

```text
混淆版
```

---

# 🔄 双源下载机制

为了避免 GitHub 单一源下载失败，项目保留双源逻辑。

流程：

```text
主源
    ↓ 失败
备用源
    ↓ 失败
本地缓存
```

例如：

```text
GitHub Source A
        ↓
GitHub Source B
        ↓
public/sources/
```

这样即使远程 GitHub 临时无法访问，也可以使用本地缓存源码。

---

# 💻 Ubuntu 24.04 本地运行

## 安装 Node.js

推荐 Node.js 22：

```bash
node -v
```

建议：

```text
v22.x
```

安装：

```bash
apt update

apt install -y \
  curl \
  git \
  nodejs \
  npm
```

---

## 下载项目

```bash
git clone https://github.com/lucas8864/CFBox-deployer.git
```

进入目录：

```bash
cd CFBox-deployer
```

---

## 安装依赖

```bash
npm install
```

---

## 启动

根据项目配置：

```bash
npm start
```

或者：

```bash
npm run dev
```

启动成功后访问：

```text
http://服务器IP:端口
```

---

# 🧪 本地测试

检查 Node.js：

```bash
node -v
npm -v
```

检查项目：

```bash
npm run check
```

检查 JavaScript：

```bash
node --check public/app.js
```

检查 Pages Function：

```bash
node --check functions/api/[[path]].js
```

检查 Worker：

```bash
node --check public/_worker.js
```

---

# 📦 部署项目到 GitHub

初始化 Git：

```bash
git init
```

设置主分支：

```bash
git branch -M main
```

添加文件：

```bash
git add .
```

提交：

```bash
git commit -m "CFBox Deployer"
```

添加远程仓库：

```bash
git remote add origin \
https://github.com/lucas8864/CFBox-deployer.git
```

推送：

```bash
git push -u origin main
```

---

# 🔒 Git 安全配置

如果出现：

```text
fatal: detected dubious ownership
```

可以执行：

```bash
git config --global --add safe.directory \
/root/CFBox-deployer
```

或者检查目录：

```bash
ls -ld .
ls -ld .git
```

确认目录属于当前用户。

---

# 🌐 Git Proxy

如果服务器需要代理访问 GitHub：

```bash
git config --global http.proxy \
http://IP:PORT

git config --global https.proxy \
http://IP:PORT
```

查看：

```bash
git config --global --list
```

取消代理：

```bash
git config --global --unset http.proxy

git config --global --unset https.proxy
```

---

# 🛠 Wrangler Proxy

如果 Wrangler 提示：

```text
Proxy environment variables detected
```

检查：

```bash
env | grep -i proxy
```

可能存在：

```text
HTTP_PROXY
HTTPS_PROXY
ALL_PROXY
```

设置：

```bash
export HTTP_PROXY="http://IP:PORT"
export HTTPS_PROXY="http://IP:PORT"
```

取消：

```bash
unset HTTP_PROXY
unset HTTPS_PROXY
unset ALL_PROXY
```

---

# 📊 部署架构

整体架构：

```text
                    ┌─────────────────────┐
                    │      Browser        │
                    │   CFBox Deployer    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Cloudflare Pages    │
                    │                     │
                    │ index.html          │
                    │ app.js              │
                    │ styles.css          │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Pages Functions     │
                    │                     │
                    │ /api/*              │
                    └──────────┬──────────┘
                               │
                               │ Cloudflare API
                               ▼
         ┌─────────────────────────────────────────┐
         │             Cloudflare                  │
         │                                         │
         │  Workers                                │
         │  KV Namespace                           │
         │  Pages                                  │
         │  DNS                                    │
         │  Zones                                  │
         │  Worker Routes                          │
         └─────────────────────────────────────────┘
```

---

# 🔄 Worker 部署架构

```text
CFBox Deployer
       │
       ▼
Cloudflare API Token
       │
       ▼
Generate Project Name
       │
       ▼
Generate UUID
       │
       ▼
Create KV Namespace
       │
       ▼
Upload CFBox Worker
       │
       ├──── U → UUID
       │
       └──── K → KV Namespace
       │
       ▼
Enable Workers.dev
       │
       ▼
Create DNS Record
       │
       ▼
Create Worker Route
       │
       ▼
Deployment Complete
```

---

# 🔄 Pages 部署架构

```text
CFBox Deployer
       │
       ▼
Cloudflare API
       │
       ▼
Create Pages Project
       │
       ▼
Create KV Namespace
       │
       ▼
Upload CFBox Files
       │
       ▼
Deploy Pages
       │
       ▼
Bind Custom Domain
       │
       ▼
Check DNS
       │
       ▼
Deployment Complete
```

---

# 📋 部署结果

部署完成后建议显示：

```text
================================

部署类型:
Worker / Pages

项目名称:
cfbran7x9k2m

UUID:
xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

KV:
cfbran7x9k2mkv

KV ID:
xxxxxxxxxxxxxxxx

Workers.dev / Pages URL:
https://...

自定义域名:
https://...

DNS:
✓ 已验证

UUID:
✓ 已验证

KV:
✓ 已验证

================================
```

---

# ❗ 常见问题

## 1. Authentication error

检查：

```text
API Token 是否正确
Account ID 是否正确
Workers Scripts 权限
Workers KV Storage 权限
Cloudflare Pages 权限
DNS 权限
Workers Routes 权限
```

---

## 2. UUID 验证失败

确认 Worker Binding：

```text
U
```

是否存在。

应该：

```text
U=你的UUID
```

---

## 3. KV 没有绑定

检查 Worker Binding：

```text
K
```

确认：

```text
K → KV Namespace
```

---

## 4. 域名绑定成功但 DNS 没有记录

必须检查：

```text
DNS Record
```

以及：

```text
Worker Route
```

两者不能只存在一个。

---

## 5. Workers.dev 没有启用

检查：

```text
Workers.dev Subdomain
```

是否已经在 Cloudflare Account 中初始化。

通常首次使用 Workers 时需要先在 Cloudflare Dashboard 设置：

```text
workers.dev Subdomain
```

---

# 🔐 安全说明

## 不要上传 API Token

禁止提交：

```text
.env
.env.local
.dev.vars
API Token
Account ID
密码
私钥
```

推荐 `.gitignore`：

```gitignore
node_modules/

.env
.env.*
.dev.vars

*.log

.wrangler/

.DS_Store
```

---

# 🚧 开发计划

未来计划继续完善：

* [ ] Worker 部署状态实时检测
* [ ] Pages 部署状态实时检测
* [ ] UUID 自动验证
* [ ] KV 自动验证
* [ ] DNS 自动验证
* [ ] Workers.dev 自动检测
* [ ] Worker 删除
* [ ] Pages 删除
* [ ] KV 删除
* [ ] DNS 删除
* [ ] 项目历史记录
* [ ] 多 Cloudflare Account 支持
* [ ] Token 权限自动检测
* [ ] 更详细的 Cloudflare API 错误信息
* [ ] 部署日志下载
* [ ] GitHub Actions 自动部署

---

# ⚠️ 免责声明

本项目仅用于学习、测试和合法的 Cloudflare Workers / Pages 自动化部署。

使用者应确保：

* 遵守 Cloudflare 服务条款
* 遵守当地法律法规
* 不将 API Token 泄露给第三方
* 不使用本项目进行未经授权的活动

---

# 📄 License

请根据项目实际需求选择：

```text
MIT License
```

或其他开源许可证。

---

# 👨‍💻 Author

GitHub：

https://github.com/lucas8864

Project：

https://github.com/lucas8864/CFBox-deployer

