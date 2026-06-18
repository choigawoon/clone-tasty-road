// genai-client.mjs
// Direct REST client for the genai server (https://genai.home.codepoet.site/api/...).
// Simpler and more robust than MCP: each call is a single fetch — no session handshake.
// CORS is OFF on the server, so this must run server-side (Node), not from the browser.

const BASE = (process.env.GENAI_BASE_URL || "https://genai.home.codepoet.site").replace(/\/+$/, "");

async function apiFetch(method, path, { body, timeoutMs = 300000 } = {}) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(BASE + path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: ac.signal,
    });
    const text = await res.text();
    let json;
    try { json = text ? JSON.parse(text) : {}; } catch { json = { _raw: text }; }
    if (!res.ok) {
      const detail = (json && (json.detail || json.error)) || text.slice(0, 300);
      throw new Error(`genai ${method} ${path} failed: HTTP ${res.status} — ${JSON.stringify(detail).slice(0, 300)}`);
    }
    return json;
  } finally {
    clearTimeout(timer);
  }
}

// POST /api/images/generate → { images:[{url,width,height,...}], provider, meta }
export function generateImage(args, opts = {}) {
  return apiFetch("POST", "/api/images/generate", { body: args, timeoutMs: opts.timeoutMs || 300000 });
}

// GET /api/outputs → { items:[{name,path,url,kind,...}] }  (shape may also be a bare array)
export async function listOutputs(limit = 60) {
  const out = await apiFetch("GET", `/api/outputs?kind=image&limit=${limit}`, { timeoutMs: 30000 });
  return Array.isArray(out) ? out : (out.items || []);
}

// GET /api/images/workflows → string[]  (live workflow list from the server)
export async function listWorkflows() {
  const out = await apiFetch("GET", "/api/images/workflows", { timeoutMs: 15000 });
  return Array.isArray(out) ? out : (out.items || []);
}

export function genaiBase() {
  return BASE;
}
