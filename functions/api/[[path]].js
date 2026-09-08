const API = "https://api.cloudflare.com/client/v4";
const DATE = "2026-09-01";
const SOURCES = {
  plain: [
    "https://raw.githubusercontent.com/lucas8864/CFBox/main/CFBox%E6%98%8E%E6%96%87%E7%89%88.js",
    "https://raw.githubusercontent.com/PAICNI/CFBox/main/CFBox%E6%98%8E%E6%96%87%E7%89%88.js"
  ],
  encoded: [
    "https://raw.githubusercontent.com/lucas8864/CFBox/main/CFBox%E6%B7%B7%E6%B7%86%E7%89%88.js",
    "https://raw.githubusercontent.com/PAICNI/CFBox/main/CFBox%E6%B7%B7%E6%B7%86%E7%89%88.js"
  ]
};

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (!path.startsWith("/api/")) {
    return json({ ok: false, error: "Not Found" }, 404);
  }

  try {
    const data = request.method === "POST" ? await readJson(request) : {};

    if (path === "/api/verify") {
      await cf(token(data), "/user/tokens/verify");
      return json({ ok: true });
    }

    if (path === "/api/accounts") {
      const x = await cf(token(data), "/accounts?per_page=100");
      return json({ ok: true, accounts: x.map(a => ({ id: a.id, name: a.name })) });
    }

    if (path === "/api/zones") {
      const zones = await cf(token(data), "/zones?per_page=100&status=active");
      return json({
        ok: true,
        zones: zones.map(z => ({ id: z.id, name: z.name, status: z.status }))
      });
    }

    if (path === "/api/resources") {
      const t = token(data);
      const a = required(data.accountId, "Account ID");
      const [k, w, p] = await Promise.all([
        cf(t, `/accounts/${a}/storage/kv/namespaces?per_page=100`).catch(() => []),
        cf(t, `/accounts/${a}/workers/scripts?per_page=100`).catch(() => []),
        cf(t, `/accounts/${a}/pages/projects?per_page=100`).catch(() => [])
      ]);
      return json({
        ok: true,
        kv: k.map(x => ({ id: x.id, title: x.title })),
        workers: w.map(x => ({ name: x.id || x.name })),
        pages: p.map(x => ({ name: x.name }))
      });
    }

    if (path === "/api/project-name") {
      const t = token(data);
      const a = required(data.accountId, "Account ID");
      const name = await generateProjectName(t, a);
      return json({ ok: true, projectName: name });
    }

    if (path === "/api/deploy") {
      return json({ ok: true, ...(await deploy(data, request)) });
    }

    return json({ ok: false, error: "Unknown API" }, 404);
  } catch (e) {
    return json({ ok: false, error: e?.message || String(e) }, 500);
  }
}

async function deploy(d, request) {
  const t = token(d);
  const a = required(d.accountId, "Account ID");
  const type = d.deployType === "pages" ? "pages" : "worker";
  const mode = d.deployMode === "update" ? "update" : "create";
  const src = d.sourceMode === "plain" ? "plain" : "encoded";
  const name = clean(required(d.projectName, "Project name"));
  const zone = normalizeDomain(d.customDomain || "");
  const domain = zone ? buildProjectDomain(name, zone) : "";
  const requestedUuid = String(d.uuid || "").trim();
  const generatedUuid = requestedUuid || (mode === "create" ? crypto.randomUUID() : null);
  const logs = [];
  const log = x => logs.push(`[${new Date().toLocaleTimeString("zh-CN", { hour12: false })}] ${x}`);

  log(`开始${mode === "create" ? "创建" : "更新"} ${type}: ${name}`);
  if (name !== String(d.projectName || "").trim()) log(`项目名已规范化为: ${name}`);

  const code = await source(src, request, log);
  log(`源码类型: ${src === "plain" ? "明文版" : "混淆版"}`);

  let resultKv = null;

  if (mode === "update") {
    if (type === "worker") {
      await ensureWorkerExists(t, a, name);
      await updateWorker(t, a, name, code, requestedUuid || null, d.kvId || null, log);
    } else {
      await ensurePagesExists(t, a, name);
      if (requestedUuid || d.kvId) await configurePagesBindings(t, a, name, requestedUuid || null, d.kvId || null, log);
      await deployPages(t, a, name, code, log);
    }
  } else {
    const uuid = generatedUuid;
    const kv = await getkv(t, a, d.kvId, d.kvTitle || `${name}-kv`, log);
    resultKv = kv;
    if (type === "worker") {
      await worker(t, a, name, code, uuid, kv.id, log);
    } else {
      await ensurePagesExists(t, a, name);
      await configurePagesBindings(t, a, name, uuid, kv.id, log);
      await deployPages(t, a, name, code, log);
    }
  }

  let domainResult = null;
  if (domain) {
    domainResult = type === "worker"
      ? await bindWorkerDomain(t, a, name, domain, log)
      : await bindPagesDomain(t, a, name, domain, log);
  }

  const uuid = generatedUuid;
  const kv = resultKv || (d.kvId ? { id: d.kvId, title: d.kvTitle || "", created: false } : null);
  const url = type === "pages"
    ? `https://${name}.pages.dev`
    : await enableWorkerDev(t, a, name, log);
  const verification = type === "pages"
    ? await verifyPages(t, a, name, uuid || null, kv?.id || null, domain || null, log)
    : await verifyWorker(t, a, name, uuid || null, kv?.id || null, domain || null, log);

  const failedChecks = Object.entries(verification || {}).filter(([k, v]) => v === false).map(([k]) => k);
  if (failedChecks.length) log(`⚠ 部署请求完成，但以下验证未通过: ${failedChecks.join(", ")}`);
  else log(`${mode === "create" ? "部署" : "更新"}完成，全部关键验证通过`);
  return {
    projectName: name,
    deployType: type,
    uuid: uuid || null,
    kv,
    url,
    customDomain: domainResult?.name || domain || null,
    verification,
    logs
  };
}

async function source(mode, request, log) {
  for (const u of SOURCES[mode]) {
    try {
      log(`下载源码: ${u}`);
      const r = await fetch(u, { headers: { "User-Agent": "CFBox-Deployer-Pages/5.0" } });
      if (!r.ok) throw Error(`HTTP ${r.status}`);
      const x = await r.text();
      if (x.length < 1000) throw Error("source too small");
      log(`源码下载成功: ${x.length} bytes`);
      return x;
    } catch (e) {
      log(`备用源切换: ${e.message}`);
    }
  }

  const filename = mode === "plain" ? "CFBox明文版.js" : "CFBox混淆版.js";
  try {
    const r = await fetch(new URL(`/sources/${encodeURIComponent(filename)}`, request.url));
    if (r.ok) {
      const x = await r.text();
      if (x.length > 1000) {
        log(`使用 Pages 本地源码缓存: ${x.length} bytes`);
        return x;
      }
    }
  } catch (e) {
    log(`本地源码缓存读取失败: ${e.message}`);
  }
  throw Error("无法获取 CFBox 源码");
}

async function generateProjectName(t, a) {
  for (let i = 0; i < 20; i++) {
    const name = `cfbran${randomAlphaNum(8)}`;
    const [w, p] = await Promise.all([
      cf(t, `/accounts/${a}/workers/scripts/${encodeURIComponent(name)}`).then(() => true).catch(() => false),
      cf(t, `/accounts/${a}/pages/projects/${encodeURIComponent(name)}`).then(() => true).catch(() => false)
    ]);
    if (!w && !p) return name;
  }
  throw Error("无法生成唯一项目名称，请稍后重试");
}

function randomAlphaNum(n) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => chars[b % chars.length]).join("");
}

async function getkv(t, a, id, title, log) {
  const list = await cf(t, `/accounts/${a}/storage/kv/namespaces?per_page=100`);
  if (id) {
    const x = list.find(x => x.id === id);
    if (!x) throw Error("KV 不存在");
    log(`复用 KV: ${x.title}`);
    return { id: x.id, title: x.title, created: false };
  }
  let n = cleanKvTitle(title) || "cfboxkv";
  const base = n;
  let i = 1;
  while (list.some(x => x.title === n)) n = `${base}${i++}`;
  const x = await cf(t, `/accounts/${a}/storage/kv/namespaces`, { method: "POST", body: { title: n } });
  log(`创建 KV: ${x.title}`);
  log(`KV Namespace ID: ${x.id}`);
  return { id: x.id, title: x.title, created: true };
}

async function worker(t, a, n, c, u, k, log) {
  await upload(t, a, n, c, {
    main_module: "worker.js",
    compatibility_date: DATE,
    bindings: [
      { type: "plain_text", name: "U", text: u },
      { type: "kv_namespace", name: "K", namespace_id: k }
    ]
  });
  log("Worker UUID Binding: U");
  log("Worker KV Binding: K");
  log("Worker 上传完成");
}

async function updateWorker(t, a, n, c, u, k, log) {
  const x = await cf(t, `/accounts/${a}/workers/scripts/${encodeURIComponent(n)}/settings`);
  const bindings = Array.isArray(x.bindings) ? [...x.bindings] : [];
  if (u) upsertBinding(bindings, { type: "plain_text", name: "U", text: u });
  if (k) upsertBinding(bindings, { type: "kv_namespace", name: "K", namespace_id: k });
  await upload(t, a, n, c, {
    main_module: x.main_module || "worker.js",
    compatibility_date: x.compatibility_date || DATE,
    bindings
  });
  log("Worker 更新完成");
}

function upsertBinding(bindings, item) {
  const i = bindings.findIndex(b => b.name === item.name);
  if (i >= 0) bindings[i] = item;
  else bindings.push(item);
}

async function upload(t, a, n, c, metadata) {
  const f = new FormData();
  f.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }), "metadata.json");
  f.append("worker.js", new Blob([c], { type: "application/javascript+module" }), "worker.js");
  await cf(t, `/accounts/${a}/workers/scripts/${encodeURIComponent(n)}`, { method: "PUT", body: f });
}

async function ensureWorkerExists(t, a, n) {
  await cf(t, `/accounts/${a}/workers/scripts/${encodeURIComponent(n)}`);
}

async function ensurePagesExists(t, a, n) {
  try {
    await cf(t, `/accounts/${a}/pages/projects/${encodeURIComponent(n)}`);
  } catch {
    await cf(t, `/accounts/${a}/pages/projects`, {
      method: "POST",
      body: { name: n, production_branch: "main" }
    });
  }
}

async function configurePagesBindings(t, a, n, u, k, log) {
  const envVars = u ? { U: { type: "plain_text", value: String(u) } } : {};
  const kvNamespaces = k ? { K: { namespace_id: String(k) } } : {};
  await cf(t, `/accounts/${a}/pages/projects/${encodeURIComponent(n)}`, {
    method: "PATCH",
    body: {
      deployment_configs: {
        production: { compatibility_date: DATE, env_vars: envVars, kv_namespaces: kvNamespaces },
        preview: { compatibility_date: DATE, env_vars: envVars, kv_namespaces: kvNamespaces }
      }
    }
  });
  if (u) log(`Pages UUID Binding 已写入: U=${u}`);
  if (k) log(`Pages KV Binding 已写入: K -> ${k}`);
}

async function deployPages(t, a, n, code, log) {
  const hash = await sha256Hex(code);
  const manifest = JSON.stringify({ "/_worker.js": hash });
  const f = new FormData();
  f.append("_worker.js", new Blob([code], { type: "application/javascript" }), "_worker.js");
  f.append("manifest", manifest);
  f.append("branch", "main");
  f.append("commit_dirty", "true");
  const result = await cf(t, `/accounts/${a}/pages/projects/${encodeURIComponent(n)}/deployments`, {
    method: "POST",
    body: f
  });
  log(`Pages Direct Upload 完成: ${result?.id || result?.deployment_id || "OK"}`);
}

async function bindPagesDomain(t, a, n, domain, log) {
  const d = normalizeDomain(domain);
  if (!d) throw Error("自定义域名格式无效");
  const zone = await findZoneForDomain(t, d);
  if (!zone) throw Error(`未找到可绑定的 Cloudflare Zone: ${d}`);

  let old = null;
  try {
    const list = await cf(t, `/accounts/${a}/pages/projects/${encodeURIComponent(n)}/domains`);
    old = Array.isArray(list) ? list.find(x => x.name === d) : null;
  } catch (e) {
    log(`检查 Pages 自定义域名失败: ${e.message}`);
  }
  if (!old) {
    old = await cf(t, `/accounts/${a}/pages/projects/${encodeURIComponent(n)}/domains`, {
      method: "POST", body: { name: d }
    });
    log(`Pages 自定义域名已提交: ${d}`);
  } else {
    log(`Pages 自定义域名已存在: ${d}`);
  }

  // For a zone managed by the same Cloudflare account, Pages normally creates this automatically.
  // Verify it and create the expected proxied CNAME only if no DNS record exists.
  const dns = await ensurePagesDnsRecord(t, zone, d, `${n}.pages.dev`, log);
  return { name: d, zoneId: zone.id, dns, status: old?.status || old?.verification_status || "pending" };
}

async function ensurePagesDnsRecord(t, zone, domain, target, log) {
  const records = await listDnsExact(t, zone.id, domain);
  let record = records.find(r => r.type === "CNAME");
  if (record) {
    log(`Pages DNS 已存在: CNAME ${domain} -> ${record.content}`);
    return record;
  }
  const conflict = records.find(r => ["A", "AAAA"].includes(r.type));
  if (conflict) throw Error(`Pages DNS 已存在 ${conflict.type} 记录: ${domain} -> ${conflict.content}，未覆盖现有业务`);
  record = await cf(t, `/zones/${zone.id}/dns_records`, {
    method: "POST",
    body: { type: "CNAME", name: domain, content: target, ttl: 1, proxied: true }
  });
  log(`Pages DNS 已创建: CNAME ${domain} -> ${target}`);
  return record;
}

async function bindWorkerDomain(t, a, n, domain, log) {
  const d = normalizeDomain(domain);
  const zone = await findZoneForDomain(t, d);
  if (!zone) throw Error(`未找到可绑定的 Cloudflare Zone: ${d}`);

  // CFBox Worker is the hostname origin. A Workers Route requires a proxied DNS record.
  // Use Cloudflare's documented originless placeholder when no real origin exists.
  const dns = await ensureWorkerDnsRecord(t, zone, d, log);

  const routes = await cf(t, `/zones/${zone.id}/workers/routes?per_page=100`);
  const pattern = `${d}/*`;
  const old = routes.find(r => String(r.pattern || "").toLowerCase() === pattern.toLowerCase());
  const body = { pattern, script: n };
  if (old?.id) {
    await cf(t, `/zones/${zone.id}/workers/routes/${old.id}`, { method: "PUT", body });
    log(`Worker Route 已更新: ${pattern} -> ${n}`);
  } else {
    await cf(t, `/zones/${zone.id}/workers/routes`, { method: "POST", body });
    log(`Worker Route 已创建: ${pattern} -> ${n}`);
  }
  return { name: d, zoneId: zone.id, dns };
}

async function findZoneForDomain(t, domain) {
  const zones = await cf(t, "/zones?per_page=100&status=active");
  return zones.filter(z => domain === z.name || domain.endsWith(`.${z.name}`))
    .sort((x, y) => y.name.length - x.name.length)[0] || null;
}

async function listDnsExact(t, zoneId, domain) {
  const records = await cf(t, `/zones/${zoneId}/dns_records?name=${encodeURIComponent(domain)}&per_page=100`);
  return Array.isArray(records) ? records : [];
}

async function ensureWorkerDnsRecord(t, zone, domain, log) {
  const records = await listDnsExact(t, zone.id, domain);
  const conflict = records.find(r => r.type === "CNAME");
  if (conflict) {
    throw Error(`无法创建 Worker Route DNS：${domain} 已存在 CNAME 记录，请先删除或改用其他子域名`);
  }
  let record = records.find(r => r.type === "AAAA" && r.content === "100::");
  if (record) {
    if (!record.proxied) {
      record = await cf(t, `/zones/${zone.id}/dns_records/${record.id}`, {
        method: "PUT",
        body: { type: "AAAA", name: domain, content: "100::", ttl: 1, proxied: true }
      });
      log(`Worker DNS AAAA 已更新为代理状态: ${domain} -> 100::`);
    } else {
      log(`Worker DNS 已存在: AAAA ${domain} -> 100::（已代理）`);
    }
    return record;
  }

  // Do not overwrite an existing real A/AAAA record.
  const real = records.find(r => ["A", "AAAA"].includes(r.type));
  if (real) {
    throw Error(`DNS 已存在 ${real.type} 记录: ${domain} -> ${real.content}，为避免覆盖现有业务，本次未修改`);
  }

  record = await cf(t, `/zones/${zone.id}/dns_records`, {
    method: "POST",
    body: { type: "AAAA", name: domain, content: "100::", ttl: 1, proxied: true }
  });
  log(`Worker DNS 已创建: AAAA ${domain} -> 100::（Cloudflare 代理）`);
  return record;
}

async function enableWorkerDev(t, a, n, log) {
  const p = `/accounts/${a}/workers/scripts/${encodeURIComponent(n)}/subdomain`;
  const state = await cf(t, p).catch(() => null);
  if (!state?.enabled) {
    await cf(t, p, { method: "POST", body: { enabled: true } });
    log("Worker URL 生产已启用: workers.dev");
  } else {
    log("Worker URL 生产已启用: workers.dev（已启用）");
  }
  const x = await cf(t, `/accounts/${a}/workers/subdomain`);
  if (!x?.subdomain) throw Error("workers.dev 已启用，但无法读取账户 subdomain");
  return `https://${n}.${x.subdomain}.workers.dev`;
}

async function verifyWorker(t, a, n, uuid, kvId, domain, log) {
  const result = { project: false, uuid: uuid ? false : null, kv: kvId ? false : null, domain: domain ? false : null, dns: domain ? false : null, workersDev: false };
  const settings = await cf(t, `/accounts/${a}/workers/scripts/${encodeURIComponent(n)}/settings`);
  result.project = !!settings;
  const bindings = Array.isArray(settings?.bindings) ? settings.bindings : [];
  const ub = bindings.find(x => x.name === "U");
  const kb = bindings.find(x => x.name === "K");
  if (uuid) result.uuid = String(ub?.text || ub?.value || "").toLowerCase() === String(uuid).toLowerCase();
  if (kvId) result.kv = String(kb?.namespace_id || kb?.id || "") === String(kvId);
  const sub = await cf(t, `/accounts/${a}/workers/scripts/${encodeURIComponent(n)}/subdomain`).catch(() => null);
  result.workersDev = !!sub?.enabled;
  if (domain) {
    const zone = await findZoneForDomain(t, domain);
    if (zone) {
      const [routes, dns] = await Promise.all([
        cf(t, `/zones/${zone.id}/workers/routes?per_page=100`),
        listDnsExact(t, zone.id, domain)
      ]);
      result.domain = !!routes.find(r => String(r.pattern || "").toLowerCase() === `${domain}/*`.toLowerCase() && r.script === n);
      result.dns = !!dns.find(r => r.proxied && ((r.type === "AAAA" && r.content === "100::") || r.type === "A"));
    }
  }
  log(`Worker 验证: ${JSON.stringify(result)}`);
  return result;
}

async function verifyPages(t, a, n, uuid, kvId, domain, log) {
  const result = { project: false, uuid: uuid ? false : null, kv: kvId ? false : null, domain: domain ? false : null, dns: domain ? false : null };
  const project = await cf(t, `/accounts/${a}/pages/projects/${encodeURIComponent(n)}`);
  result.project = !!project;
  const production = project?.deployment_configs?.production || {};
  const vars = production.env_vars || production.vars || {};
  const u = vars?.U?.value ?? vars?.U?.text ?? vars?.U ?? null;
  const kvs = production.kv_namespaces || {};
  const k = Array.isArray(kvs) ? kvs.find(x => x?.binding === "K" || x?.name === "K") : kvs?.K;
  if (uuid) result.uuid = String(u || "").toLowerCase() === String(uuid).toLowerCase();
  if (kvId) result.kv = String(k?.namespace_id || k?.id || "") === String(kvId);
  if (domain) {
    const domains = await cf(t, `/accounts/${a}/pages/projects/${encodeURIComponent(n)}/domains`);
    result.domain = Array.isArray(domains) && !!domains.find(x => x.name === normalizeDomain(domain));
    const zone = await findZoneForDomain(t, domain);
    if (zone) {
      const dns = await listDnsExact(t, zone.id, domain);
      result.dns = !!dns.find(r => r.type === "CNAME");
    }
  }
  log(`Pages 验证: ${JSON.stringify(result)}`);
  return result;
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}

async function cf(t, p, o = {}) {
  const h = { ...(o.headers || {}), Authorization: `Bearer ${t}` };
  let b = o.body;
  if (b && !(b instanceof FormData) && typeof b !== "string") {
    h["Content-Type"] = "application/json";
    b = JSON.stringify(b);
  }
  const r = await fetch(p.startsWith("http") ? p : API + p, { method: o.method || "GET", headers: h, body: b });
  const text = await r.text();
  let j;
  try { j = JSON.parse(text); } catch { j = text; }
  if (!r.ok || (j && j.success === false)) {
    const message = typeof j === "string" ? j : (j?.errors || []).map(x => x.message).join("; ") || `HTTP ${r.status}`;
    throw Error(message);
  }
  return j?.result ?? j;
}

function token(d) { return required(d.apiToken, "Cloudflare API Token"); }
function required(v, n) { if (!String(v || "").trim()) throw Error(`Missing ${n}`); return String(v).trim(); }
function clean(x) { return String(x || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 63) || `cfbran${randomAlphaNum(8)}`; }
function cleanKvTitle(x) { return String(x || "").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 63); }
function normalizeDomain(x) { return String(x || "").trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "").toLowerCase(); }
function buildProjectDomain(name, zone) { const z = normalizeDomain(zone); return name && z ? `${name}.${z}` : ""; }
async function readJson(r) { const text = await r.text(); return text ? JSON.parse(text) : {}; }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "POST,OPTIONS" }; }
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders() } }); }
