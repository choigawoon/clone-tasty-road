// server.mjs — Concept Studio local server.
// Serves the static UI and proxies image generation to the genai MCP server.
// Run: node server.mjs   (Node 18+; zero dependencies)

import http from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateImage, listOutputs, genaiBase } from "./genai-client.mjs";
import { CONFIG } from "./art-direction.config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, "public");
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SAVE_DIR = path.join(REPO_ROOT, "concept-art");
const PORT = Number(process.env.PORT) || 4321;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function sendJson(res, status, body) {
  const s = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(s);
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const s = Buffer.concat(chunks).toString("utf8");
  return s ? JSON.parse(s) : {};
}

async function handleGenerate(req, res) {
  const b = await readJsonBody(req);
  const prompt = (b.prompt || "").trim();
  if (!prompt) return sendJson(res, 400, { error: "prompt is required" });

  const args = {
    prompt,
    negative_prompt: b.negative_prompt || CONFIG.negativeBase,
    provider: "comfyui",
    workflow: b.workflow || "z-image-turbo",
    width: Number(b.width) || 1024,
    height: Number(b.height) || 1024,
  };
  if (b.seed !== undefined && b.seed !== null && b.seed !== "") {
    args.seed = Number(b.seed);
  }

  const out = await generateImage(args, { timeoutMs: 300000 });
  const img = out && Array.isArray(out.images) && out.images[0];
  if (!img || !img.url) {
    return sendJson(res, 502, { error: "no image url in generation result", raw: out });
  }
  return sendJson(res, 200, {
    url: img.url,
    width: img.width,
    height: img.height,
    prompt: args.prompt,
    negative_prompt: args.negative_prompt,
    workflow: args.workflow,
  });
}

async function handleOutputs(res) {
  const items = await listOutputs(60);
  return sendJson(res, 200, { items });
}

async function handleSave(req, res) {
  const b = await readJsonBody(req);
  if (!b.url) return sendJson(res, 400, { error: "url is required" });
  const r = await fetch(b.url);
  if (!r.ok) return sendJson(res, 502, { error: `fetch image failed: HTTP ${r.status}` });
  const buf = Buffer.from(await r.arrayBuffer());
  if (!existsSync(SAVE_DIR)) await mkdir(SAVE_DIR, { recursive: true });
  const safe = String(b.name || "concept").replace(/[^a-z0-9_-]+/gi, "-").toLowerCase().slice(0, 60);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const file = `${safe}-${stamp}.png`;
  await writeFile(path.join(SAVE_DIR, file), buf);
  return sendJson(res, 200, { saved: `concept-art/${file}` });
}

async function serveStatic(url, res) {
  let p = url.pathname === "/" ? "/index.html" : url.pathname;
  const safe = path.normalize(p).replace(/^(\.\.[/\\])+/, "");
  const fp = path.join(PUBLIC_DIR, safe);
  if (!fp.startsWith(PUBLIC_DIR) || !existsSync(fp)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Not found");
  }
  const data = await readFile(fp);
  res.writeHead(200, { "Content-Type": MIME[path.extname(fp)] || "application/octet-stream" });
  res.end(data);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (url.pathname === "/api/health") {
      return sendJson(res, 200, { ok: true, backend: genaiBase() + "/api/images/generate", saveDir: "concept-art/" });
    }
    if (url.pathname === "/api/presets") {
      return sendJson(res, 200, CONFIG);
    }
    if (url.pathname === "/api/generate" && req.method === "POST") {
      return await handleGenerate(req, res);
    }
    if (url.pathname === "/api/outputs") {
      return await handleOutputs(res);
    }
    if (url.pathname === "/api/save" && req.method === "POST") {
      return await handleSave(req, res);
    }
    return await serveStatic(url, res);
  } catch (e) {
    return sendJson(res, 500, { error: String((e && e.message) || e) });
  }
});

server.listen(PORT, () => {
  console.log(`\n  🎨 Concept Studio → http://localhost:${PORT}`);
  console.log(`     genai backend   → ${genaiBase()}/api/images/generate`);
  console.log(`     Saves into      → concept-art/\n`);
});
