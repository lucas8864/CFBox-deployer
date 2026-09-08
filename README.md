# CFBox Deployer v5 Pages

Cloudflare Pages + Pages Functions 版本的 CFBox 一键部署器。

## 架构

- `public/`：前端 UI
- `functions/api/[[path]].js`：Pages Functions 后端 API
- 不再依赖 Pages 运行时的 `server.mjs` 或 Wrangler 子进程
- Worker：直接调用 Cloudflare Workers Script Upload API
- Pages：直接调用 Cloudflare Pages Direct Upload API
- UUID：Worker 使用 `U` plain_text binding；Pages 使用生产环境 `U` env var
- KV：统一使用 `K` binding
- Worker `workers.dev`：部署后强制启用并读取真实 subdomain
- Worker 自定义域名：使用精确 Worker Route，例如 `project.example.com`
- Pages 自定义域名：使用 Pages Domains API
- 项目名：自动生成 `cfbran` + 8 位小写字母/数字，不包含 `-`
- 源码：保留混淆版 / 明文版双源 + Pages 本地缓存兜底

## 本地开发

```bash
npm install
npm start
```

## Pages 部署

```bash
npx wrangler pages project create cfbox-deployer
npx wrangler pages deploy public --project-name=cfbox-deployer --commit-dirty=true
```

部署完成后，Pages Functions 会自动随项目发布。不要只上传 `public/` 后期待 `/api/*` 存在；v5 的 API 位于 `functions/`。
