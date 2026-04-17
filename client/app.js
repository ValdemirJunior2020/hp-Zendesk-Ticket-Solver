// /client/app.js
const API_BASE = "http://localhost:4000/api";

const state = {
  tickets: [],
  activity: [],
};

// Slow (so you can see it)
const STEP_PAUSE_MS = 2500;

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

function renderOverlaySteps(steps, activeIndex, doneCount) {
  const ul = document.getElementById("overlaySteps");
  ul.innerHTML = steps.map((label, i) => {
    const isDone = i < doneCount;
    const isActive = i === activeIndex && !isDone;

    const cls = isDone ? "done" : (isActive ? "active" : "pending");
    return `<li class="${cls}">${esc(label)}</li>`;
  }).join("");
}

function buildSolvePayload(t) {
  // Minimized payload for security (no api_mock).
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
    <div class="stat"><div class="num">Trace</div><div class="label">Red → Green progress</div></div>
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

window.solveTicket = async function(ticketId) {
  const t = state.tickets.find(x => x.ticket_id === ticketId);
  if (!t) return;

  clearLog();
  log(`Solve clicked for ticket #${ticketId}`);

  const payload = buildSolvePayload(t);
  log(`Payload built (minimized). Keys: ${Object.keys(payload).join(", ")}`);

  const steps = [
    "Build secure payload (client)",
    "Send request to backend (/api/solve)",
    "Backend: classify ticket → Case Key",
    "Backend: load matrix row + check call requirement",
    "Backend: generate QA-safe reply + internal note",
  ];

  setOverlay(true, "Solving ticket…", "Starting…");

  // Everything starts RED (pending). Active is RED. Done turns GREEN.
  let activeIndex = 0;
  let doneCount = 0;
  renderOverlaySteps(steps, activeIndex, doneCount);

  // Step 1: payload
  document.getElementById("loadingMsg").textContent = "Building secure payload…";
  await sleep(STEP_PAUSE_MS);
  doneCount = 1; activeIndex = 1;
  renderOverlaySteps(steps, activeIndex, doneCount);

  // Step 2: send request
  document.getElementById("loadingMsg").textContent = "Sending request to backend…";
  await sleep(600);
  const fetchPromise = fetch(`${API_BASE}/solve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  doneCount = 2; activeIndex = 2;
  renderOverlaySteps(steps, activeIndex, doneCount);

  // Step 3: waiting for backend response (active stays RED until response)
  document.getElementById("loadingMsg").textContent = "Waiting for backend response…";
  const res = await fetchPromise;
  const data = await res.json();
  log(`Backend returned: ${data.status} | ${data.caseKey}`);

  // Step 3: classify complete
  document.getElementById("loadingMsg").textContent = "Backend classified ticket…";
  await sleep(STEP_PAUSE_MS);
  doneCount = 3; activeIndex = 3;
  renderOverlaySteps(steps, activeIndex, doneCount);

  // Step 4: matrix + call check complete
  document.getElementById("loadingMsg").textContent = "Backend loaded matrix row + checked call triggers…";
  await sleep(STEP_PAUSE_MS);
  doneCount = 4; activeIndex = 4;
  renderOverlaySteps(steps, activeIndex, doneCount);

  // Step 5: outputs complete
  document.getElementById("loadingMsg").textContent = "Backend generated QA-safe outputs…";
  await sleep(STEP_PAUSE_MS);
  doneCount = 5; activeIndex = 4;
  renderOverlaySteps(steps, activeIndex, doneCount);

  // Show result in UI
  document.getElementById("solverOutput").innerHTML = `
    <div class="block">
      <div class="block-head">
        <h3>Result</h3>
        <span class="pill ${data.status === "AUTO-SOLVED" ? "green" : "yellow"}">${esc(data.status)}</span>
      </div>
      <div class="kv">
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
      </div>
      <pre>${esc(data.customerReply || "")}</pre>
    </div>

    <div class="block">
      <div class="block-head">
        <h3>Internal Private Note</h3>
      </div>
      <pre>${esc(data.privateNote || "")}</pre>
    </div>

    ${data.refundQueueInstruction ? `
      <div class="block">
        <div class="block-head">
          <h3>Refund Queue Instruction</h3>
        </div>
        <pre>${esc(data.refundQueueInstruction)}</pre>
      </div>` : ""}
  `;

  // Finish overlay
  document.getElementById("loadingTitle").textContent = "Completed";
  document.getElementById("loadingMsg").textContent = "All steps finished (green).";
  await sleep(650);
  setOverlay(false);
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

  const steps = ["Generate tickets", "Write fakeTickets.json", "Reload UI"];
  let doneCount = 0;
  renderOverlaySteps(steps, 0, doneCount);

  try {
    await sleep(600);
    doneCount = 1;
    renderOverlaySteps(steps, 1, doneCount);

    const res = await fetch(`${API_BASE}/demo/regenerate?count=${encodeURIComponent(count)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "Failed to regenerate");

    log(`Generated ${json.count} tickets (seed=${json.seed})`);
    doneCount = 2;
    renderOverlaySteps(steps, 2, doneCount);

    await fetchTickets(document.getElementById("searchInput").value);
    doneCount = 3;
    renderOverlaySteps(steps, 2, doneCount);

  } catch (e) {
    log(`ERROR: ${e?.message || e}`);
    alert(`Failed: ${e?.message || e}`);
  } finally {
    document.getElementById("loadingTitle").textContent = "Done";
    document.getElementById("loadingMsg").textContent = "Finished.";
    await sleep(550);
    setOverlay(false);
  }
});

fetchTickets();