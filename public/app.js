const $ = id => document.getElementById(id);
const L = $("logs");

function P(extra = {}) {
  return { apiToken: $("apiToken").value.trim(), accountId: $("account").value, ...extra };
}

function S(x) { L.textContent = Array.isArray(x) ? x.join("\n") : x; }

async function post(url, data) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  const text = await r.text();
  let j;
  try { j = text ? JSON.parse(text) : {}; } catch { throw Error(`API 返回非 JSON (${r.status})`); }
  if (!r.ok || !j.ok) throw Error(j.error || `请求失败 (${r.status})`);
  return j;
}

function updateGeneratedDomain() {
  const name = $("projectName").value.trim().toLowerCase();
  const zone = $("customDomain").value.trim().toLowerCase();
  $("generatedDomain").value = name && zone ? `${name}.${zone}` : "";
}

async function generateProjectName() {
  if (!$("account").value) return;
  try {
    const j = await post("/api/project-name", P());
    $("projectName").value = j.projectName;
    updateGeneratedDomain();
  } catch (e) { S(`生成项目名称失败：${e.message}`); }
}

$("loadBtn").onclick = async () => {
  try {
    $("status").textContent = "验证中...";
    await post("/api/verify", P());
    const j = await post("/api/accounts", P());
    $("account").innerHTML = j.accounts.map(x => `<option value="${x.id}">${escapeHtml(x.name)} (${x.id})</option>`).join("");
    $("status").textContent = "Token 有效";
    await loadDomains();
    await load();
    await generateProjectName();
  } catch (e) { $("status").textContent = `❌ ${e.message}`; }
};

$("resourceBtn").onclick = load;
$("account").onchange = async () => { await loadDomains(); await load(); await generateProjectName(); };
$("projectName").addEventListener("input", updateGeneratedDomain);
$("customDomain").addEventListener("change", updateGeneratedDomain);
$("generateName").onclick = generateProjectName;

async function load() {
  if (!$("account").value) return;
  try {
    const j = await post("/api/resources", P());
    $("kv").innerHTML = '<option value="">自动创建 KV</option>' + j.kv.map(x => `<option value="${x.id}">${escapeHtml(x.title)} (${x.id})</option>`).join("");
    S(["Workers", ...j.workers.map(x => x.name), "", "Pages", ...j.pages.map(x => x.name), "", "KV", ...j.kv.map(x => `${x.title} (${x.id})`)].join("\n"));
  } catch (e) { S(`资源加载失败：${e.message}`); }
}

async function loadDomains() {
  if (!$("apiToken").value.trim()) return;
  try {
    const j = await post("/api/zones", { apiToken: $("apiToken").value.trim() });
    $("customDomain").innerHTML = '<option value="">不绑定自定义域名</option>' + j.zones.map(z => `<option value="${z.name}">${escapeHtml(z.name)}</option>`).join("");
    updateGeneratedDomain();
  } catch (e) { S(`Zone 加载失败：${e.message}`); }
}

$("deployBtn").onclick = async () => {
  try {
    S("开始部署...");
    const j = await post("/api/deploy", P({
      deployMode: $("deployMode").value,
      deployType: $("deployType").value,
      sourceMode: $("sourceMode").value,
      projectName: $("projectName").value.trim(),
      uuid: $("uuid").value.trim(),
      kvId: $("kv").value,
      kvTitle: $("kvTitle").value.trim(),
      customDomain: $("customDomain").value.trim()
    }));
    S([
      ...(j.logs || []), "", "========== 部署结果 ==========",
      `项目: ${j.projectName}`,
      j.uuid ? `UUID: ${j.uuid}` : "",
      j.uuid ? `UUID Binding: U = ${j.uuid}` : "",
      j.kv?.title ? `KV: ${j.kv.title}` : "",
      j.kv?.id ? `KV ID: ${j.kv.id}` : "",
      j.url ? `URL: ${j.url}` : "",
      j.customDomain ? `自定义域名: https://${j.customDomain}` : "",
      j.verification ? `验证结果: ${JSON.stringify(j.verification, null, 2)}` : ""
    ].filter(Boolean).join("\n"));
  } catch (e) { S(`❌ 部署失败：${e.message}`); }
};

function escapeHtml(x) { return String(x).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c])); }
