// Concept Studio frontend
let CFG = null;
let MODE = "concept"; // "concept" | "screens"
let selected = null;   // currently selected subject/screen object

const $ = (s) => document.querySelector(s);
const el = (tag, props = {}, ...kids) => {
  const e = document.createElement(tag);
  Object.assign(e, props);
  for (const k of kids) e.append(k);
  return e;
};

async function boot() {
  try {
    const h = await fetch("/api/health").then((r) => r.json());
    setStatus(true, "genai 연결됨");
  } catch {
    setStatus(false, "서버 연결 실패");
  }
  CFG = await fetch("/api/presets").then((r) => r.json());
  fillSelects();
  renderPicker();
  bindTabs();
  $("#genBtn").addEventListener("click", generate);
  $("#refreshGallery").addEventListener("click", loadGallery);
  $("#lightbox").addEventListener("click", () => $("#lightbox").classList.add("hidden"));
}

function setStatus(ok, txt) {
  const s = $("#status");
  s.textContent = txt;
  s.className = "status " + (ok ? "ok" : "bad");
}

function fillSelects() {
  const wf = $("#workflowSel");
  wf.innerHTML = "";
  CFG.workflows.forEach((w) => wf.append(el("option", { value: w.key, textContent: w.label })));
  const asp = $("#aspectSel");
  asp.innerHTML = "";
  Object.entries(CFG.aspects).forEach(([k, v]) => asp.append(el("option", { value: k, textContent: v.label })));
  $("#negBox").value = CFG.negativeBase;
}

function bindTabs() {
  document.querySelectorAll(".tab").forEach((t) => {
    t.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      const tab = t.dataset.tab;
      const isGallery = tab === "gallery";
      $("#composer").classList.toggle("hidden", isGallery);
      $(".results-panel").classList.toggle("hidden", isGallery);
      $("#galleryPanel").classList.toggle("hidden", !isGallery);
      if (isGallery) { loadGallery(); return; }
      MODE = tab; // concept | screens
      selected = null;
      renderPicker();
      $("#promptBox").value = "";
    });
  });
}

function renderPicker() {
  const host = $("#subjectList");
  host.innerHTML = "";
  if (MODE === "concept") {
    const groups = {};
    CFG.subjects.forEach((s) => { (groups[s.group] ||= []).push(s); });
    Object.entries(groups).forEach(([g, items]) => host.append(group(g, items)));
    $("#negBox").value = CFG.negativeBase;
  } else {
    host.append(group("화면", CFG.screens));
    $("#negBox").value = CFG.negativeUi;
  }
}

function group(name, items) {
  const chips = el("div", { className: "chips" });
  items.forEach((it) => {
    const c = el("button", { className: "chip", textContent: it.label });
    c.addEventListener("click", () => selectItem(it, c));
    chips.append(c);
  });
  return el("div", { className: "chip-group" }, el("h4", { textContent: name }), chips);
}

function selectItem(item, chipEl) {
  selected = item;
  document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
  chipEl.classList.add("active");
  compose();
}

function compose() {
  if (!selected) return;
  const isScreen = MODE === "screens";
  const style = isScreen ? CFG.styleUi : CFG.styleBase;
  const extra = $("#extraBox").value.trim();
  let prompt = `${selected.fragment}. ${style}`;
  if (extra) prompt += `, ${extra}`;
  $("#promptBox").value = prompt;
  // recommended workflow + aspect
  if (selected.workflow) $("#workflowSel").value = selected.workflow;
  else $("#workflowSel").value = "z-image-turbo";
  if (selected.aspect) $("#aspectSel").value = selected.aspect;
  $("#negBox").value = isScreen ? CFG.negativeUi : CFG.negativeBase;
}

// recompose when extra text changes (only if a subject is selected)
document.addEventListener("input", (e) => {
  if (e.target && e.target.id === "extraBox" && selected) compose();
});

async function generate() {
  const prompt = $("#promptBox").value.trim();
  if (!prompt) { $("#genHint").textContent = "프롬프트를 입력하세요."; return; }
  const aspectKey = $("#aspectSel").value;
  const a = CFG.aspects[aspectKey];
  const body = {
    prompt,
    negative_prompt: $("#negBox").value.trim(),
    workflow: $("#workflowSel").value,
    width: a.w, height: a.h,
    seed: $("#seedBox").value.trim() || undefined,
  };
  const name = (selected && selected.id) || "concept";

  const btn = $("#genBtn");
  btn.disabled = true;
  $("#genHint").textContent = "생성 중… (ComfyUI, 수 초~수십 초)";
  const card = pendingCard();
  $("#results").prepend(card);

  try {
    const r = await fetch("/api/generate", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const data = await r.json();
    if (!r.ok || data.error) throw new Error(data.error || `HTTP ${r.status}`);
    fillCard(card, data, name);
  } catch (e) {
    card.className = "card error";
    card.querySelector(".imgwrap").innerHTML = `생성 실패<br>${String(e.message || e)}`;
  } finally {
    btn.disabled = false;
    $("#genHint").textContent = "";
  }
}

function pendingCard() {
  const wrap = el("div", { className: "imgwrap" }, el("div", { className: "spinner" }));
  return el("div", { className: "card pending" }, wrap);
}

function fillCard(card, data, name) {
  card.className = "card";
  const img = el("img", { src: data.url, alt: name, loading: "lazy" });
  const wrap = el("div", { className: "imgwrap" }, img);
  wrap.addEventListener("click", () => openLightbox(data.url));
  const meta = el("div", { className: "meta" });
  meta.innerHTML = `<b>${name}</b> · ${data.width}×${data.height} · ${data.workflow}`;

  const saveBtn = el("button", { textContent: "📥 repo에 저장" });
  saveBtn.addEventListener("click", async () => {
    saveBtn.textContent = "저장 중…";
    try {
      const r = await fetch("/api/save", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: data.url, name }),
      }).then((x) => x.json());
      saveBtn.textContent = "✓ " + r.saved;
      saveBtn.classList.add("saved");
    } catch (e) { saveBtn.textContent = "저장 실패"; }
  });
  const copyBtn = el("button", { textContent: "프롬프트 복사" });
  copyBtn.addEventListener("click", () => navigator.clipboard.writeText(data.prompt));
  const openBtn = el("button", { textContent: "원본 열기" });
  openBtn.addEventListener("click", () => window.open(data.url, "_blank"));

  card.innerHTML = "";
  card.append(wrap, meta, el("div", { className: "cardbtns" }, saveBtn, copyBtn, openBtn));
}

function openLightbox(url) {
  $("#lightboxImg").src = url;
  $("#lightbox").classList.remove("hidden");
}

async function loadGallery() {
  const host = $("#gallery");
  host.innerHTML = "불러오는 중…";
  try {
    const { items } = await fetch("/api/outputs").then((r) => r.json());
    host.innerHTML = "";
    items.forEach((it) => {
      const img = el("img", { src: it.url, alt: it.name, loading: "lazy" });
      const wrap = el("div", { className: "imgwrap" }, img);
      wrap.addEventListener("click", () => openLightbox(it.url));
      const meta = el("div", { className: "meta", textContent: it.path });
      host.append(el("div", { className: "card" }, wrap, meta));
    });
    if (!items.length) host.textContent = "아직 생성물이 없습니다.";
  } catch (e) {
    host.textContent = "갤러리 로드 실패: " + (e.message || e);
  }
}

boot();
