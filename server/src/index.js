// /server/src/index.js
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { solveTicket } from "./solver.js";
import { writeDemoTicketsFile } from "./demoTicketGenerator.js";

// If you have this file, keep it. If not, delete this import + the app.use() below.
import integrationsRouter from "./routes/integrations.js";

const app = express(); // ✅ MUST be defined before app.use()

app.use(express.json());

// ✅ CORS AFTER app is created
const allowed = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // curl/server tools
      if (allowed.length === 0) return cb(null, true); // demo mode allow all
      if (allowed.includes(origin)) return cb(null, true);
      return cb(new Error(`Not allowed by CORS: ${origin}`));
    },
  })
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const matrixPath = path.join(__dirname, "../data/matrix.json");
const ticketsPath = path.join(__dirname, "../data/fakeTickets.json");

function loadMatrix() {
  return JSON.parse(fs.readFileSync(matrixPath, "utf-8"));
}

function loadFakeTickets() {
  return JSON.parse(fs.readFileSync(ticketsPath, "utf-8"));
}

app.get("/api/health", (_req, res) => {
  const matrix = loadMatrix();
  const fakeTickets = loadFakeTickets();
  res.json({
    ok: true,
    service: "hp-zendesk-ticket-solver",
    tickets: fakeTickets.length,
    cases: matrix.length,
  });
});

app.get("/api/tickets", (req, res) => {
  const fakeTickets = loadFakeTickets();
  const q = String(req.query.q || "").toLowerCase().trim();

  if (!q) return res.json(fakeTickets);

  const filtered = fakeTickets.filter((t) => {
    const hay = `${t.ticket_id} ${t.subject} ${t.description} ${t.guest_name} ${t.itinerary} ${t.hotel_name}`.toLowerCase();
    return hay.includes(q);
  });

  res.json(filtered);
});

// POST /api/demo/regenerate?count=1000&seed=42
app.post("/api/demo/regenerate", (req, res) => {
  const countRaw = String(req.query.count ?? req.body?.count ?? "500");
  const seedRaw = String(req.query.seed ?? req.body?.seed ?? String(Date.now()));
  const count = Math.max(1, Math.min(5000, Number(countRaw) || 500));
  const seed = Number(seedRaw) || Date.now();

  try {
    const result = writeDemoTicketsFile({
      count,
      seed,
      outFile: ticketsPath,
    });
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.post("/api/solve", (req, res) => {
  const ticket = req.body;
  if (!ticket) return res.status(400).json({ ok: false, error: "Missing ticket" });

  const matrix = loadMatrix();
  const result = solveTicket(ticket, matrix);
  res.json(result);
});

// If you don’t have integrationsRouter file, comment this line out.
app.use("/api/integrations", integrationsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));