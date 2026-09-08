import { createServer } from "node:http";
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join, extname } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.PORT || 8790);
const ROOT = resolve(import.meta.dirname);
const PUBLIC = resolve(ROOT, "public");
const SOURCES = resolve(PUBLIC, "sources");
const API = "https://api.cloudflare.com/client/v4";
const DATE = "2026-09-01";

const SRC = {
  plain: "CFBox明文版.js",
  encoded: "CFBox混淆版.js"
};

// 保持 CFBox 混淆版/明文版双源下载逻辑：主源 -> 备用源 -> 本地缓存
const URLS = {
  plain: [
    "https://raw.githubusercontent.com/lucas8864/CFBox/main/CFBox%E6%98%8E%E6%96%87%E7%89%88.js",
    "https://raw.githubusercontent.com/PAICNI/CFBox/main/CFBox%E6%98%8E%E6%96%87%E7%89%88.js"
  ],
  encoded: [
    "https://raw.githubusercontent.com/lucas8864/CFBox/main/CFBox%E6%B7%B7%E6%B7%86%E7%89%88.js",
    "https://raw.githubusercontent.com/PAICNI/CFBox/main/CFBox%E6%B7%B7%E6%B7%86%E7%89%88.js"
  ]
};

createServer(async (q, s) => {
  try {
    if (q.url?.startsWith("/api/")) return await api(q, s);
    return await stat(q, s);
  } catch (e) {
    json(s, 500, { ok: false, error: e.message || String(e) });
  }
}).listen(PORT, "0.0.0.0", () => {
  console.log(`CFBox Deployer v4: http://0.0.0.0:${PORT}`);
});

async function api(q, s) {
  if (q.method !== "POST") return json(s, 405, { ok: false, error: "Only POST" });
  const d = await body(q);

  if (q.url === "/api/verify") {
    await cf(tok(d), "/user/tokens/verify");
    return json(s, 200, { ok: true });
  }

  if (q.url === "/api/accounts") {
    const x = await cf(tok(d), "/accounts?per_page=100");
    return json(s, 200, {
      ok: true,
      accounts: x.map(a => ({ id: a.id, name: a.name }))
    });
  }

  if (q.url === "/api/resources") {
    const t = tok(d);
    const a = req(d.accountId, "Account ID");
    const [k, w, p] = await Promise.all([
      cf(t, `/accounts/${a}/storage/kv/namespaces?per_page=100`).catch(() => []),
      cf(t, `/accounts/${a}/workers/scripts?per_page=100`).catch(() => []),
      cf(t, `/accounts/${a}/pages/projects?per_page=100`).catch(() => [])
    ]);

    return json(s, 200, {
      ok: true,
      kv: k.map(x => ({ id: x.id, title: x.title })),
      workers: w.map(x => ({ name: x.id || x.name })),
      pages: p.map(x => ({ name: x.name }))
    });
  }

  if (q.url === "/api/zones") {
    const t = tok(d);
    const zones = await cf(t, "/zones?per_page=100&status=active");
    return json(s, 200, {
      ok: true,
      zones: zones.map(z => ({ id: z.id, name: z.name, status: z.status }))
    });
  }

  if (q.url === "/api/deploy") {
    return json(s, 200, { ok: true, ...await deploy(d) });
  }

  json(s, 404, { ok: false, error: "Unknown API" });
}

async function deploy(d) {
  const t = tok(d);
  const a = req(d.accountId, "Account ID");
  const type = d.deployType === "pages" ? "pages" : "worker";
  const mode = d.deployMode === "update" ? "update" : "create";
  const src = d.sourceMode === "plain" ? "plain" : "encoded";
  const name = clean(req(d.projectName, "Project name"));
  const requestedZone = String(d.customDomain || "").trim();
  const requestedDomain = requestedZone
    ? buildProjectDomain(name, requestedZone)
    : "";
  const requestedUuid = String(d.uuid || "").trim();
  const logs = [];
  const log = x => logs.push(
    `[${new Date().toLocaleTimeString("zh-CN", { hour12: false })}] ${x}`
  );

  log(`开始${mode === "create" ? "创建" : "更新"} ${type}: ${name}`);

  const code = await source(src, log);
  log(`源码类型: ${src === "plain" ? "明文版" : "混淆版"}`);

  if (mode === "update") {
    if (type === "worker") {
      const u = requestedUuid || null;
      const k = d.kvId || null;
      await updateWorker(t, a, name, code, u, k, log);
    } else {
      await pages(t, a, name, code, requestedUuid || null, d.kvId || null, log, true);
    }

    let domainResult = null;
    if (requestedDomain) {
      domainResult = type === "worker"
        ? await bindWorkerDomain(t, a, name, requestedDomain, log)
        : await bindPagesDomain(t, a, name, requestedDomain, log);
    }

    const verify = type === "pages"
      ? await verifyPages(t, a, name, requestedUuid || null, d.kvId || null, requestedDomain || null, log)
      : null;

    log("更新完成");
    return {
      projectName: name,
      deployType: type,
      uuid: requestedUuid || null,
      kv: d.kvId ? { id: d.kvId, title: d.kvTitle || "" } : null,
      customDomain: domainResult?.name || requestedDomain || null,
      verification: verify,
      logs
    };
  }

  const uuid = requestedUuid || randomUUID();
  const kv = await getkv(
    t,
    a,
    d.kvId,
    d.kvTitle || `${name}-kv`,
    log
  );

  if (type === "worker") {
    await worker(t, a, name, code, uuid, kv.id, log);
  } else {
    await pages(t, a, name, code, uuid, kv.id, log, false);
  }

  let domainResult = null;
  if (requestedDomain) {
    domainResult = type === "worker"
      ? await bindWorkerDomain(t, a, name, requestedDomain, log)
      : await bindPagesDomain(t, a, name, requestedDomain, log);
  }

  const url = type === "pages"
    ? `https://${name}.pages.dev`
    : await enableWorkerDev(t, a, name, log);

  const verification = type === "pages"
    ? await verifyPages(t, a, name, uuid, kv.id, requestedDomain || null, log)
    : null;

  log("部署完成");

  return {
    projectName: name,
    deployType: type,
    uuid,
    kv,
    url,
    customDomain: domainResult?.name || requestedDomain || null,
    verification,
    logs
  };
}

const tok = d => req(d.apiToken, "Cloudflare API Token");

const req = (v, n) => {
  if (!String(v || "").trim()) throw Error(`Missing ${n}`);
  return String(v).trim();
};

async function source(mode, log) {
  const local = join(SOURCES, SRC[mode]);

  for (const u of URLS[mode]) {
    try {
      log(`下载源码: ${u}`);
      const r = await fetch(u, {
        headers: { "User-Agent": "CFBox-Deployer/4.0" }
      });
      if (!r.ok) throw Error(`HTTP ${r.status}`);
      const x = await r.text();
      if (x.length < 1000) throw Error("source too small");
      await writeFile(local, x);
      log(`源码下载成功: ${x.length} bytes`);
      return x;
    } catch (e) {
      log(`备用源切换: ${e.message}`);
    }
  }

  if (existsSync(local)) {
    const x = await readFile(local, "utf8");
    if (x.length > 1000) {
      log("使用本地源码缓存");
      return x;
    }
  }

  throw Error("无法获取 CFBox 源码");
}

async function getkv(t, a, id, title, log) {
  const list = await cf(
    t,
    `/accounts/${a}/storage/kv/namespaces?per_page=100`
  );

  if (id) {
    const x = list.find(x => x.id === id);
    if (!x) throw Error("KV 不存在");
    log(`复用 KV: ${x.title}`);
    return { id: x.id, title: x.title, created: false };
  }

  let n = clean(title) || "cfbox-kv";
  const base = n;
  let i = 1;

  while (list.some(x => x.title === n)) n = `${base}-${i++}`;

  const x = await cf(
    t,
    `/accounts/${a}/storage/kv/namespaces`,
    {
      method: "POST",
      body: { title: n }
    }
  );

  log(`创建 KV: ${x.title}`);
  log(`KV Namespace ID: ${x.id}`);

  return {
    id: x.id,
    title: x.title,
    created: true
  };
}

async function upload(t, a, n, c, m) {
  const f = new FormData();

  f.append(
    "metadata",
    new Blob([JSON.stringify(m)], {
      type: "application/json"
    }),
    "metadata.json"
  );

  f.append(
    "worker.js",
    new Blob([c], {
      type: "application/javascript+module"
    }),
    "worker.js"
  );

  await cf(
    t,
    `/accounts/${a}/workers/scripts/${encodeURIComponent(n)}`,
    {
      method: "PUT",
      body: f
    }
  );
}

async function worker(t, a, n, c, u, k, log) {
  await upload(t, a, n, c, {
    main_module: "worker.js",
    compatibility_date: DATE,
    bindings: [
      {
        type: "plain_text",
        name: "U",
        text: u
      },
      {
        type: "kv_namespace",
        name: "K",
        namespace_id: k
      }
    ]
  });

  log("Worker UUID Binding: U");
  log("Worker KV Binding: K");
  log("Worker 上传完成");
}

async function updateWorker(t, a, n, c, u, k, log) {
  const x = await cf(
    t,
    `/accounts/${a}/workers/scripts/${encodeURIComponent(n)}/settings`
  );

  const bindings = Array.isArray(x.bindings) ? [...x.bindings] : [];

  if (u) {
    const i = bindings.findIndex(b => b.name === "U");
    const item = { type: "plain_text", name: "U", text: u };
    if (i >= 0) bindings[i] = item;
    else bindings.push(item);
    log("更新 Worker UUID Binding: U");
  }

  if (k) {
    const i = bindings.findIndex(b => b.name === "K");
    const item = { type: "kv_namespace", name: "K", namespace_id: k };
    if (i >= 0) bindings[i] = item;
    else bindings.push(item);
    log("更新 Worker KV Binding: K");
  }

  await upload(t, a, n, c, {
    main_module: x.main_module || "worker.js",
    compatibility_date: x.compatibility_date || DATE,
    bindings
  });

  log("Worker 更新完成");
}

async function configurePagesBindings(t, a, n, u, k, log) {
  const envVars = u ? {
    U: { type: "plain_text", value: String(u) }
  } : {};
  const kvNamespaces = k ? {
    K: { namespace_id: String(k) }
  } : {};

  // 通过 Pages Project API 显式写入生产/预览环境绑定。
  // 不依赖 Wrangler 是否从临时目录自动发现配置文件。
  await cf(
    t,
    `/accounts/${a}/pages/projects/${encodeURIComponent(n)}`,
    {
      method: "PATCH",
      body: {
        deployment_configs: {
          production: {
            compatibility_date: DATE,
            env_vars: envVars,
            kv_namespaces: kvNamespaces
          },
          preview: {
            compatibility_date: DATE,
            env_vars: envVars,
            kv_namespaces: kvNamespaces
          }
        }
      }
    }
  );

  if (u) log(`Pages API UUID Binding 已写入: U=${u}`);
  if (k) log(`Pages API KV Binding 已写入: K -> ${k}`);
}

async function pages(t, a, n, c, u, k, log, upd) {
  if (!upd) {
    try {
      await cf(
        t,
        `/accounts/${a}/pages/projects/${encodeURIComponent(n)}`
      );
      log("Pages 项目已存在");
    } catch {
      await cf(
        t,
        `/accounts/${a}/pages/projects`,
        {
          method: "POST",
          body: {
            name: n,
            production_branch: "main"
          }
        }
      );
      log("Pages 项目已创建");
    }
  }

  // 先通过 Cloudflare Pages API 持久化生产/预览绑定，确保控制台可见。
  if (u || k) await configurePagesBindings(t, a, n, u, k, log);

  const dir = await mkdtemp(join(tmpdir(), "cfbox-pages-"));

  try {
    await writeFile(
      join(dir, "_worker.js"),
      c
    );

    await writeFile(
      join(dir, "index.html"),
      "<!doctype html><meta charset=utf-8><title>CFBox</title>"
    );

    // 关键修复：
    // Pages 模式必须声明 pages_build_output_dir，
    // 否则 Wrangler 会忽略 wrangler.toml。
    const config = [
      `name = "${n}"`,
      `compatibility_date = "${DATE}"`,
      `pages_build_output_dir = "."`,
      "",
      "[vars]",
      `U = "${tomlEscape(u || "")}"`,
      "",
      "[[kv_namespaces]]",
      'binding = "K"',
      `id = "${tomlEscape(k || "")}"`,
      ""
    ].join("\n");

    await writeFile(
      join(dir, "wrangler.toml"),
      config
    );

    log("Pages 配置: pages_build_output_dir=.");
    log("Pages UUID Binding: U");
    log("Pages KV Binding: K");

    const out = await wrangler(
      [
        "pages",
        "deploy",
        ".",
        "--project-name",
        n,
        "--branch",
        "main",
        "--commit-dirty=true"
      ],
      t,
      a,
      dir
    );

    out
      .split("\n")
      .filter(Boolean)
      .slice(-30)
      .forEach(x => log(`wrangler: ${x}`));

    log("Pages 上传完成");
  } finally {
    await rm(dir, {
      recursive: true,
      force: true
    });
  }
}

async function bindPagesDomain(t, a, n, domain, log) {
  const normalized = normalizeDomain(domain);

  if (!normalized) throw Error("自定义域名格式无效");

  try {
    const list = await cf(
      t,
      `/accounts/${a}/pages/projects/${encodeURIComponent(n)}/domains`
    );

    const existing = Array.isArray(list)
      ? list.find(x => x.name === normalized)
      : null;

    if (existing) {
      log(`自定义域名已存在: ${normalized}`);
      return existing;
    }
  } catch (e) {
    log(`检查自定义域名失败，将继续尝试绑定: ${e.message}`);
  }

  const result = await cf(
    t,
    `/accounts/${a}/pages/projects/${encodeURIComponent(n)}/domains`,
    {
      method: "POST",
      body: {
        name: normalized
      }
    }
  );

  log(`自定义域名绑定成功: ${normalized}`);

  if (result?.status) {
    log(`自定义域名状态: ${result.status}`);
  }

  return result || { name: normalized };
}

async function verifyPages(t, a, n, uuid, kvId, domain, log) {
  const result = {
    project: false,
    uuid: false,
    kv: false,
    domain: domain ? false : null
  };

  const project = await cf(
    t,
    `/accounts/${a}/pages/projects/${encodeURIComponent(n)}`
  );

  result.project = !!project;
  log(`Pages 项目验证: ${result.project ? "OK" : "FAIL"}`);

  // Cloudflare Pages 项目配置中若返回 env_vars / kv_namespaces，
  // 则验证实际配置是否包含本次部署的 UUID/KV。
  const production = project?.deployment_configs?.production || {};
  const envVars = production?.env_vars || {};
  const vars = production?.vars || envVars;

  const uuidValue =
    vars?.U?.value ??
    vars?.U?.text ??
    vars?.U ??
    null;

  const kvs = production?.kv_namespaces || {};
  const kvBinding = Array.isArray(kvs)
    ? kvs.find(x => x?.binding === "K" || x?.name === "K")
    : kvs?.K;
  const kvFound = !!kvBinding && (
    kvBinding?.namespace_id === kvId ||
    kvBinding?.id === kvId
  );

  result.uuid = uuid
    ? String(uuidValue || "").toLowerCase() === String(uuid).toLowerCase()
    : false;

  result.kv = kvId ? kvFound : false;

  log(`Pages UUID 验证: ${result.uuid ? "OK" : "FAIL"}`);
  log(`Pages KV Binding 验证: ${result.kv ? "OK" : "FAIL"}`);

  if (domain) {
    const domains = await cf(
      t,
      `/accounts/${a}/pages/projects/${encodeURIComponent(n)}/domains`
    );

    const found = Array.isArray(domains)
      ? domains.find(x => x.name === normalizeDomain(domain))
      : null;

    result.domain = !!found;

    if (found?.status) {
      log(`自定义域名验证: ${result.domain ? "OK" : "FAIL"} (${found.status})`);
    } else {
      log(`自定义域名验证: ${result.domain ? "OK" : "FAIL"}`);
    }
  }

  return result;
}

async function wrangler(args, t, a, cwd) {
  const bin = process.platform === "win32"
    ? resolve(ROOT, "node_modules/.bin/wrangler.cmd")
    : resolve(ROOT, "node_modules/.bin/wrangler");

  const use = existsSync(bin)
    ? bin
    : (process.platform === "win32" ? "npx.cmd" : "npx");

  const finalArgs = existsSync(bin)
    ? args
    : ["--yes", "wrangler@4.129.0", ...args];

  return await new Promise((ok, no) => {
    const p = spawn(use, finalArgs, {
      cwd,
      env: {
        ...process.env,
        CLOUDFLARE_API_TOKEN: t,
        CLOUDFLARE_ACCOUNT_ID: a
      },
      stdio: ["ignore", "pipe", "pipe"]
    });

    let o = "";

    p.stdout.on("data", d => o += d);
    p.stderr.on("data", d => o += d);
    p.on("error", no);

    p.on("close", c => {
      c === 0
        ? ok(o)
        : no(Error(o || `wrangler exit ${c}`));
    });
  });
}

async function enableWorkerDev(t, a, n, log) {
  // Worker 级 workers.dev 必须显式启用，避免仅显示 URL 却未发布到生产地址。
  try {
    const state = await cf(
      t,
      `/accounts/${a}/workers/scripts/${encodeURIComponent(n)}/subdomain`
    ).catch(() => null);

    if (!state?.enabled) {
      await cf(
        t,
        `/accounts/${a}/workers/scripts/${encodeURIComponent(n)}/subdomain`,
        { method: "POST", body: { enabled: true } }
      );
      log("Worker URL 生产已启用: workers.dev");
    } else {
      log("Worker URL 生产已启用: workers.dev（已启用）");
    }
  } catch (e) {
    log(`Worker workers.dev 启用失败: ${e.message}`);
  }

  return await wurl(t, a, n, log);
}

async function bindWorkerDomain(t, a, n, domain, log) {
  const d = normalizeDomain(domain);
  if (!d) return null;

  const zones = await cf(t, "/zones?per_page=100&status=active");
  const matches = zones
    .filter(z => d === z.name || d.endsWith(`.${z.name}`))
    .sort((x, y) => y.name.length - x.name.length);
  const zone = matches[0];
  if (!zone) throw Error(`未找到可绑定的 Cloudflare Zone: ${d}`);

  const routes = await cf(t, `/zones/${zone.id}/workers/routes?per_page=100`);
  const old = routes.find(r => String(r.pattern || "").toLowerCase() === d.toLowerCase());
  const body = { pattern: d, script: n };

  if (old?.id) {
    await cf(t, `/zones/${zone.id}/workers/routes/${old.id}`, { method: "PUT", body });
    log(`Worker 自定义域名已更新: ${d} -> ${n}`);
  } else {
    await cf(t, `/zones/${zone.id}/workers/routes`, { method: "POST", body });
    log(`Worker 自定义域名绑定成功: ${d} -> ${n}`);
  }

  return { name: d, zoneId: zone.id };
}

async function wurl(t, a, n, log) {
  try {
    const x = await cf(
      t,
      `/accounts/${a}/workers/subdomain`
    );

    return x?.subdomain
      ? `https://${n}.${x.subdomain}.workers.dev`
      : null;
  } catch (e) {
    log(`无法读取 workers.dev: ${e.message}`);
    return null;
  }
}

async function cf(t, p, o = {}) {
  const h = {
    ...(o.headers || {}),
    Authorization: `Bearer ${t}`
  };

  let b = o.body;

  if (
    b &&
    !(b instanceof FormData) &&
    typeof b !== "string"
  ) {
    h["Content-Type"] = "application/json";
    b = JSON.stringify(b);
  }

  const r = await fetch(
    p.startsWith("http") ? p : API + p,
    {
      method: o.method || "GET",
      headers: h,
      body: b
    }
  );

  const z = await r.text();

  let j;
  try {
    j = JSON.parse(z);
  } catch {
    j = z;
  }

  if (!r.ok || (j && j.success === false)) {
    throw Error(
      typeof j === "string"
        ? j
        : (j.errors || []).map(x => x.message).join("; ") ||
          `HTTP ${r.status}`
    );
  }

  return j?.result ?? j;
}

async function body(q) {
  let s = "";

  for await (const x of q) s += x;

  return s ? JSON.parse(s) : {};
}

async function stat(q, s) {
  const u = new URL(q.url, "http://x");
  const p = decodeURIComponent(
    u.pathname === "/" ? "/index.html" : u.pathname
  );

  const f = resolve(PUBLIC, "." + p);

  if (!f.startsWith(PUBLIC) || !existsSync(f)) {
    s.writeHead(404);
    return s.end("Not Found");
  }

  const ty = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8"
  }[extname(f)] || "application/octet-stream";

  s.writeHead(200, {
    "Content-Type": ty
  });

  s.end(await readFile(f));
}

function json(s, c, x) {
  s.writeHead(c, {
    "Content-Type": "application/json"
  });
  s.end(JSON.stringify(x));
}

function clean(x) {
  return String(x || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 63) ||
    `cfbox-${randomUUID().slice(0, 8)}`;
}

function tomlEscape(x) {
  return String(x || "")
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replaceAll("\r", "")
    .replaceAll("\n", "");
}

function buildProjectDomain(projectName, zone) {
  const p = clean(String(projectName || "").toLowerCase());
  const z = normalizeDomain(zone);
  if (!p || !z) return "";
  return `${p}.${z}`;
}

function normalizeDomain(x) {
  return String(x || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();
}
