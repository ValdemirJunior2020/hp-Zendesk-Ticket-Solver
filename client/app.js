// /client/app.js
const API_BASE = "http://localhost:4000/api";

const state = {
  tickets: [],
  activity: [],
};

// Slow (so you can see it happening)
const OVERLAY_STEP_MS = 2200;
const EXPLAIN_STEP_MS = 1800;

// ✅ Video config
const CLAW_VIDEO_VOLUME = 0.12; // low volume
let clawVideoBound = false;

function nowStamp() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`;
}

function log(msg) {
  const line = `[${nowStamp()}] ${msg}`;
  state.activity.push(line);
  if (state.activity.length > 80) state.activity.shift();
  document.getElementById("activityLog").textContent = state.activity.join("\n");
}

function clearLog() {
  state.activity = [];
  document.getElementById("activityLog").textContent = "Idle.";
}

function esc(v="") {
  return String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

function setOverlay(show, title="Solving ticket…", msg="Preparing…") {
  const el = document.getElementById("loadingOverlay");
  document.getElementById("loadingTitle").textContent = title;
  document.getElementById("loadingMsg").textContent = msg;
  el.classList.toggle("hidden", !show);
  el.setAttribute("aria-hidden", show ? "false" : "true");
}

function renderOverlaySteps(steps, activeIndex) {
  const ul = document.getElementById("overlaySteps");
  ul.innerHTML = steps.map((s, i) => {
    const icon = i < activeIndex ? "✅" : i === activeIndex ? "⏳" : "•";
    return `<li>${icon} ${esc(s)}</li>`;
  }).join("");
}

function pill(status) {
  if (status === "AUTO-SOLVED") return `<span class="pill green">AUTO-SOLVED</span>`;
  if (status === "HUMAN ACTION REQUIRED") return `<span class="pill yellow">HUMAN ACTION REQUIRED</span>`;
  return `<span class="pill blue">${esc(status)}</span>`;
}

function buildSolvePayload(t) {
  return {
    ticket_id: t.ticket_id,
    subject: t.subject,
    description: t.description,
    guest_name: t.guest_name,
    itinerary: t.itinerary,
    hotel_name: t.hotel_name,
    hotel_phone: t.hotel_phone,
    estimated_amount: t.estimated_amount,
    expected_case_key: t.expected_case_key,
    booking_context: t.booking_context,
  };
}

// ✅ Video helpers
function bindClawVideoOnce() {
  if (clawVideoBound) return;
  clawVideoBound = true;

  const wrap = document.getElementById("clawVideoWrap");
  const video = document.getElementById("clawVideo");
  const muteBtn = document.getElementById("clawMuteBtn");

  if (!wrap || !video || !muteBtn) return;

  video.addEventListener("ended", () => {
    wrap.classList.add("hidden");
    wrap.setAttribute("aria-hidden", "true");
    log("Worker video finished.");
  });

  muteBtn.addEventListener("click", async () => {
    video.muted = !video.muted;
    muteBtn.textContent = video.muted ? "🔇" : "🔈";
    log(video.muted ? "Worker video muted." : "Worker video unmuted.");
    // if unmuting after a block, ensure volume stays low
    if (!video.muted) video.volume = CLAW_VIDEO_VOLUME;
  });
}

async function playClawVideo() {
  bindClawVideoOnce();

  const wrap = document.getElementById("clawVideoWrap");
  const video = document.getElementById("clawVideo");
  const muteBtn = document.getElementById("clawMuteBtn");
  if (!wrap || !video) return;

  // show the video in the corner
  wrap.classList.remove("hidden");
  wrap.setAttribute("aria-hidden", "false");

  // restart from beginning
  try { video.currentTime = 0; } catch {}

  // low volume
  video.volume = CLAW_VIDEO_VOLUME;
  video.muted = false;
  if (muteBtn) muteBtn.textContent = "🔈";

  // Attempt to play with low volume (user click -> should be allowed)
  try {
    await video.play();
    log(`Worker video started (volume=${CLAW_VIDEO_VOLUME}).`);
  } catch (e) {
    // fallback: autoplay policies sometimes block audio; play muted
    video.muted = true;
    if (muteBtn) muteBtn.textContent = "🔇";
    try {
      await video.play();
      log("Worker video started muted (browser blocked audio autoplay).");
    } catch (err2) {
      wrap.classList.add("hidden");
      wrap.setAttribute("aria-hidden", "true");
      log("Worker video could not play (check file path or browser autoplay).");
    }
  }
}

async function fetchTickets(query="") {
  const url = query ? `${API_BASE}/tickets?q=${encodeURIComponent(query)}` : `${API_BASE}/tickets`;
  const res = await fetch(url);
  state.tickets = await res.json();
  renderStats();
  renderTickets();
}

function renderStats() {
  document.getElementById("ticketCount").textContent = `${state.tickets.length} tickets`;
  document.getElementById("stats").innerHTML = `
    <div class="stat"><div class="num">${state.tickets.length}</div><div class="label">Demo tickets loaded</div></div>
    <div class="stat"><div class="num">Matrix</div><div class="label">Matrix-first decisioning</div></div>
    <div class="stat"><div class="num">Local</div><div class="label">No external calls</div></div>
    <div class="stat"><div class="num">Video</div><div class="label">Corner worker animation</div></div>
  `;
}

function renderTickets() {
  const container = document.getElementById("ticketList");
  container.innerHTML = state.tickets.map(t => `
    <div class="ticket">
      <div class="ticket-top">
        <div class="ticket-title">${esc(t.subject)}</div>
        <div class="pill blue">${esc((t.expected_case_key || "Unknown").replace("Ticket | ", ""))}</div>
      </div>
      <div class="ticket-meta">
        <span><b>#</b> ${t.ticket_id}</span>
        <span><b>Guest</b> ${esc(t.guest_name)}</span>
        <span><b>Itin</b> ${esc(t.itinerary)}</span>
        <span><b>Hotel</b> ${esc(t.hotel_name)}</span>
      </div>
      <div class="ticket-desc">${esc(t.description)}</div>
      <div class="ticket-actions">
        <button onclick="solveTicket(${t.ticket_id})">Solve Ticket</button>
        <button class="btn-ghost" onclick="previewTicket(${t.ticket_id})">Preview</button>
      </div>
    </div>
  `).join("");
}

window.previewTicket = function(ticketId) {
  const t = state.tickets.find(x => x.ticket_id === ticketId);
  clearLog();
  log(`Preview ticket #${ticketId}`);
  document.getElementById("solverOutput").innerHTML = `
    <div class="block">
      <div class="block-head">
        <h3>Ticket Preview</h3>
        <span class="pill blue">RAW</span>
      </div>
      <pre>${esc(JSON.stringify(t, null, 2))}</pre>
    </div>
  `;
};

async function slowRevealExplainSteps(explainSteps) {
  const container = document.getElementById("explainSteps");
  if (!container) return;

  container.innerHTML = "";

  for (let i = 0; i < explainSteps.length; i++) {
    const s = explainSteps[i];

    const node = document.createElement("div");
    node.className = "step active";
    node.innerHTML = `
      <div class="title">${esc(s.title)}</div>
      <div class="why">${esc(s.why)}</div>
      <div class="src">
        <div class="muted tiny"><b>Source</b></div>
        <pre>${esc(JSON.stringify(s.source, null, 2))}</pre>
      </div>
    `;
    container.appendChild(node);

    Array.from(container.children).forEach((c, idx) => {
      c.classList.toggle("active", idx === i);
      c.classList.toggle("done", idx < i);
    });

    await new Promise(r => setTimeout(r, EXPLAIN_STEP_MS));
  }

  Array.from(container.children).forEach(c => {
    c.classList.remove("active");
    c.classList.add("done");
  });
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

window.solveTicket = async function(ticketId) {
  const t = state.tickets.find(x => x.ticket_id === ticketId);
  if (!t) return;

  clearLog();
  log(`Solve clicked for ticket #${ticketId}`);
  log(`Building minimized payload (security): subject + description + core fields only`);

  // ✅ start the corner video on solve click
  await playClawVideo();

  const payload = buildSolvePayload(t);
  log(`POST /api/solve → localhost:4000`);
  log(`Payload keys: ${Object.keys(payload).join(", ")}`);

  const overlayStages = [
    "Read ticket subject + description",
    "Select Case Key (matrix category)",
    "Load matrix row",
    "Check if call is required (hotel/supplier)",
    "Generate QA-safe reply + internal note"
  ];

  setOverlay(true, "Solving ticket…", "Starting…");
  renderOverlaySteps(overlayStages, 0);

  let stage = 0;
  const stageTimer = setInterval(() => {
    stage = Math.min(stage + 1, overlayStages.length - 1);
    document.getElementById("loadingMsg").textContent = overlayStages[stage];
    renderOverlaySteps(overlayStages, stage);
  }, OVERLAY_STEP_MS);

  const t0 = performance.now();

  try {
    const res = await fetch(`${API_BASE}/solve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    const ms = Math.round(performance.now() - t0);

    log(`Response received in ${ms}ms`);
    log(`Decision: ${data.status} | ${data.caseKey}`);
    if (data.decision?.triggers?.length) log(`Triggers: ${data.decision.triggers.join(" | ")}`);

    const humanBox = data.humanActionRequired
      ? `<div class="block">
           <div class="block-head">
             <h3>Human Action Required</h3>
             <span class="pill yellow">STOP</span>
           </div>
           <pre>${esc(data.humanActionRequired)}</pre>
         </div>`
      : "";

    const refundBox = data.refundQueueInstruction
      ? `<div class="block">
           <div class="block-head">
             <h3>Refund Queue Instruction</h3>
             <span class="pill blue">QUEUE</span>
           </div>
           <pre>${esc(data.refundQueueInstruction)}</pre>
         </div>`
      : "";

    document.getElementById("solverOutput").innerHTML = `
      <div class="block">
        <div class="block-head">
          <h3>Result</h3>
          ${pill(data.status)}
        </div>
        <div class="kv">
          <span><b>Ticket</b> #${esc(data.ticketId)}</span>
          <span><b>Guest</b> ${esc(data.guest)}</span>
          <span><b>Itinerary</b> ${esc(data.itinerary)}</span>
          <span><b>Case Key</b> ${esc(data.caseKey)}</span>
          <span><b>Matrix Row</b> ${esc(data.matrixRow?.sheet_row ?? "N/A")}</span>
        </div>
      </div>

      <div class="block">
        <div class="block-head">
          <h3>Why these steps (slow reveal)</h3>
          <span class="pill blue">TRACE</span>
        </div>
        <div id="explainSteps" class="stepper"></div>
      </div>

      ${humanBox}

      <div class="grid2">
        <div class="block">
          <div class="block-head">
            <h3>Customer Reply</h3>
            <div class="copy-row">
              <button class="btn-small" id="copyReplyBtn">Copy</button>
            </div>
          </div>
          <pre id="replyText">${esc(data.customerReply)}</pre>
        </div>

        <div class="block">
          <div class="block-head">
            <h3>Internal Private Note</h3>
            <div class="copy-row">
              <button class="btn-small" id="copyNoteBtn">Copy</button>
            </div>
          </div>
          <pre id="noteText">${esc(data.privateNote)}</pre>
        </div>
      </div>

      ${refundBox}
    `;

    document.getElementById("copyReplyBtn").onclick = async () => {
      const ok = await copyToClipboard(data.customerReply || "");
      log(ok ? "Copied customer reply to clipboard." : "Copy failed (browser permission).");
    };

    document.getElementById("copyNoteBtn").onclick = async () => {
      const ok = await copyToClipboard(data.privateNote || "");
      log(ok ? "Copied private note to clipboard." : "Copy failed (browser permission).");
    };

    await slowRevealExplainSteps(data.explainSteps || []);

  } catch (e) {
    log(`ERROR: ${e?.message || e}`);
    document.getElementById("solverOutput").innerHTML = `
      <div class="block">
        <div class="block-head">
          <h3>Solver Error</h3>
          <span class="pill red">ERROR</span>
        </div>
        <pre>${esc(String(e?.message || e))}</pre>
      </div>
    `;
  } finally {
    clearInterval(stageTimer);
    setOverlay(false);
  }
};

document.getElementById("searchInput").addEventListener("input", (e) => fetchTickets(e.target.value));
document.getElementById("refreshBtn").addEventListener("click", () => {
  document.getElementById("searchInput").value = "";
  fetchTickets();
});

document.getElementById("regenBtn").addEventListener("click", async () => {
  const count = Number(document.getElementById("regenCount").value || "1000");
  clearLog();
  log(`Regenerating demo tickets: ${count}`);

  setOverlay(true, "Generating demo tickets…", `Creating ${count} tickets locally…`);
  renderOverlaySteps(["Generate tickets", "Write fakeTickets.json", "Reload UI"], 0);

  try {
    const res = await fetch(`${API_BASE}/demo/regenerate?count=${encodeURIComponent(count)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "Failed to regenerate");

    log(`Generated ${json.count} tickets (seed=${json.seed})`);
    renderOverlaySteps(["Generate tickets", "Write fakeTickets.json", "Reload UI"], 2);

    await fetchTickets(document.getElementById("searchInput").value);
  } catch (e) {
    log(`ERROR: ${e?.message || e}`);
    alert(`Failed: ${e?.message || e}`);
  } finally {
    setOverlay(false);
  }
});

// bind video controls on load
bindClawVideoOnce();

fetchTickets();