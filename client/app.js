// /client/app.js
const API_BASE = (window.APP_CONFIG && window.APP_CONFIG.apiBase) ? window.APP_CONFIG.apiBase : "http://localhost:4000/api";

const state = {
  tickets: [],
  activity: [],
  solved: loadSolvedMap(), // { [ticket_id]: { status, caseKey } }
};

const STEP_PAUSE_MS = 1600; // ✅ Make loading slower here

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

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

function renderOverlaySteps(steps, doneCount) {
  const ul = document.getElementById("overlaySteps");
  ul.innerHTML = steps.map((label, i) => {
    const cls = i < doneCount ? "done" : "pending";
    return `<li class="${cls}">${esc(label)}</li>`;
  }).join("");
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

function loadSolvedMap(){
  try { return JSON.parse(localStorage.getItem("hp_solved_map") || "{}"); } catch { return {}; }
}
function saveSolvedMap(){
  localStorage.setItem("hp_solved_map", JSON.stringify(state.solved || {}));
}

function guessLikely(ticket){
  const text = `${ticket.subject || ""} ${ticket.description || ""}`.toLowerCase();
  const humanHints = ["call hotel", "call supplier", "walked", "overbook", "cannot honor", "hotel closed", "payment declined", "refund exception", "non-refundable", "nr", "foc"];
  const autoHints  = ["resend", "confirmation email", "invoice", "receipt", "status update", "timeline", "modify name", "modify dates"];
  const humanScore = humanHints.reduce((s,k)=> s + (text.includes(k)?1:0), 0);
  const autoScore  = autoHints.reduce((s,k)=> s + (text.includes(k)?1:0), 0);
  return humanScore > autoScore ? "likely_human" : "likely_auto";
}

async function fetchTickets(query="") {
  document.getElementById("apiBadge").textContent = `API: ${API_BASE}`;
  const url = query ? `${API_BASE}/tickets?q=${encodeURIComponent(query)}` : `${API_BASE}/tickets`;
  const res = await fetch(url);
  state.tickets = await res.json();
  renderStats();
  renderTickets();
}

function renderStats() {
  document.getElementById("ticketCount").textContent = `${state.tickets.length} tickets`;

  const solvedAuto = Object.values(state.solved).filter(x => x.status === "AUTO-SOLVED").length;
  const solvedHuman = Object.values(state.solved).filter(x => x.status === "HUMAN ACTION REQUIRED").length;

  document.getElementById("stats").innerHTML = `
    <div class="stat"><div class="num">${state.tickets.length}</div><div class="label">Tickets loaded</div></div>
    <div class="stat"><div class="num">${solvedAuto}</div><div class="label">Solved Auto (saved)</div></div>
    <div class="stat"><div class="num">${solvedHuman}</div><div class="label">Solved Human (saved)</div></div>
    <div class="stat"><div class="num">Local</div><div class="label">No external browser calls</div></div>
  `;
}

function passFilter(ticket, filter){
  const id = String(ticket.ticket_id);
  const solved = state.solved[id];

  if (filter === "all") return true;

  const likely = guessLikely(ticket);
  if (filter === "likely_auto") return likely === "likely_auto";
  if (filter === "likely_human") return likely === "likely_human";

  if (filter === "solved_auto") return solved && solved.status === "AUTO-SOLVED";
  if (filter === "solved_human") return solved && solved.status === "HUMAN ACTION REQUIRED";

  return true;
}

function renderTickets() {
  const container = document.getElementById("ticketList");
  const filter = document.getElementById("filterSelect").value;

  const list = state.tickets.filter(t => passFilter(t, filter));

  container.innerHTML = list.map(t => {
    const id = String(t.ticket_id);
    const solved = state.solved[id];
    const likely = guessLikely(t);

    const cls = solved
      ? (solved.status === "AUTO-SOLVED" ? "ticket solved-auto" : "ticket solved-human")
      : (likely === "likely_auto" ? "ticket likely-auto" : "ticket likely-human");

    const rightChips = [];
    if (solved) {
      rightChips.push(`<span class="pill ${solved.status === "AUTO-SOLVED" ? "green" : "yellow"}">${esc(solved.status)}</span>`);
    } else {
      rightChips.push(`<span class="pill ${likely === "likely_auto" ? "green" : "yellow"}">${likely === "likely_auto" ? "LIKELY AUTO" : "LIKELY HUMAN"}</span>`);
    }
    rightChips.push(`<span class="pill blue">${esc((t.expected_case_key || "Unknown").replace("Ticket | ", ""))}</span>`);

    return `
      <div class="${cls}">
        <div class="ticket-top">
          <div class="ticket-title">${esc(t.subject)}</div>
          <div class="chips">${rightChips.join("")}</div>
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
    `;
  }).join("");
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

window.solveTicket = async function(ticketId) {
  const t = state.tickets.find(x => x.ticket_id === ticketId);
  if (!t) return;

  clearLog();
  log(`Solve clicked for ticket #${ticketId}`);

  const payload = buildSolvePayload(t);
  log(`Payload built (minimized). Keys: ${Object.keys(payload).join(", ")}`);
  log(`Calling API: ${API_BASE}/solve`);

  const steps = [
    "Build secure payload (client)",
    "Send request to backend (/api/solve)",
    "Backend: classify ticket → Case Key",
    "Backend: load matrix row + check call requirement",
    "Backend: generate QA-safe reply + internal note",
  ];

  setOverlay(true, "Solving ticket…", "Starting…");

  let doneCount = 0;
  renderOverlaySteps(steps, doneCount);

  document.getElementById("loadingMsg").textContent = "Building secure payload…";
  await sleep(STEP_PAUSE_MS);
  doneCount = 1; renderOverlaySteps(steps, doneCount);

  document.getElementById("loadingMsg").textContent = "Sending request to backend…";
  await sleep(STEP_PAUSE_MS);
  doneCount = 2; renderOverlaySteps(steps, doneCount);

  let data;
  try {
    const res = await fetch(`${API_BASE}/solve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    data = await res.json();
  } catch (e) {
    log(`ERROR calling backend: ${e?.message || e}`);
    setOverlay(false);
    return;
  }

  document.getElementById("loadingMsg").textContent = "Backend classified ticket…";
  await sleep(STEP_PAUSE_MS);
  doneCount = 3; renderOverlaySteps(steps, doneCount);

  document.getElementById("loadingMsg").textContent = "Backend loaded matrix row + checked call triggers…";
  await sleep(STEP_PAUSE_MS);
  doneCount = 4; renderOverlaySteps(steps, doneCount);

  document.getElementById("loadingMsg").textContent = "Backend generated QA-safe outputs…";
  await sleep(STEP_PAUSE_MS);
  doneCount = 5; renderOverlaySteps(steps, doneCount);

  // Save solved result to color the list
  state.solved[String(ticketId)] = { status: data.status, caseKey: data.caseKey };
  saveSolvedMap();
  renderStats();
  renderTickets();

  // Output cards (readable)
  document.getElementById("solverOutput").innerHTML = `
    <div class="block">
      <div class="block-head">
        <h3>Result</h3>
        <span class="pill ${data.status === "AUTO-SOLVED" ? "green" : "yellow"}">${esc(data.status)}</span>
      </div>
      <div class="ticket-meta">
        <span><b>Ticket</b> #${esc(data.ticketId)}</span>
        <span><b>Guest</b> ${esc(data.guest)}</span>
        <span><b>Itinerary</b> ${esc(data.itinerary)}</span>
        <span><b>Case Key</b> ${esc(data.caseKey)}</span>
        <span><b>Matrix Row</b> ${esc(data.matrixRow?.sheet_row ?? "N/A")}</span>
      </div>
    </div>

    ${data.humanActionRequired ? `
      <div class="block">
        <div class="block-head">
          <h3>Human Action Required</h3>
          <span class="pill yellow">STOP</span>
        </div>
        <pre>${esc(data.humanActionRequired)}</pre>
      </div>` : ""}

    <div class="block">
      <div class="block-head">
        <h3>Customer Reply</h3>
        <button class="btn-ghost" id="copyReplyBtn">Copy</button>
      </div>
      <pre id="replyText">${esc(data.customerReply || "")}</pre>
    </div>

    <div class="block">
      <div class="block-head">
        <h3>Internal Private Note</h3>
        <button class="btn-ghost" id="copyNoteBtn">Copy</button>
      </div>
      <pre id="noteText">${esc(data.privateNote || "")}</pre>
    </div>

    ${data.refundQueueInstruction ? `
      <div class="block">
        <div class="block-head">
          <h3>Refund Queue Instruction</h3>
          <span class="pill blue">QUEUE</span>
        </div>
        <pre>${esc(data.refundQueueInstruction)}</pre>
      </div>` : ""}
  `;

  document.getElementById("copyReplyBtn").onclick = async () => {
    try { await navigator.clipboard.writeText(data.customerReply || ""); log("Copied customer reply."); }
    catch { log("Copy failed."); }
  };
  document.getElementById("copyNoteBtn").onclick = async () => {
    try { await navigator.clipboard.writeText(data.privateNote || ""); log("Copied private note."); }
    catch { log("Copy failed."); }
  };

  document.getElementById("loadingTitle").textContent = "Completed";
  document.getElementById("loadingMsg").textContent = "All steps finished (green).";
  await sleep(500);
  setOverlay(false);
};

document.getElementById("filterSelect").addEventListener("change", () => renderTickets());
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
  const steps = ["Generate tickets", "Write fakeTickets.json", "Reload UI"];
  renderOverlaySteps(steps, 0);

  try {
    await sleep(600);
    renderOverlaySteps(steps, 1);

    const res = await fetch(`${API_BASE}/demo/regenerate?count=${encodeURIComponent(count)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "Failed to regenerate");
    log(`Generated ${json.count} tickets (seed=${json.seed})`);

    renderOverlaySteps(steps, 2);
    await fetchTickets(document.getElementById("searchInput").value);

    renderOverlaySteps(steps, 3);
  } catch (e) {
    log(`ERROR: ${e?.message || e}`);
    alert(`Failed: ${e?.message || e}`);
  } finally {
    await sleep(500);
    setOverlay(false);
  }
});

// Init
fetchTickets();