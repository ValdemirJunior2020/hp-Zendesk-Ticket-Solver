// /server/src/index.js
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { solveTicket } from "./solver.js";
import { writeDemoTicketsFile } from "./demoTicketGenerator.js";

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const matrix = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/matrix.json"), "utf-8"));

function loadFakeTickets() {
  const p = path.join(__dirname, "../data/fakeTickets.json");
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

app.get("/api/health", (_req, res) => {
  const fakeTickets = loadFakeTickets();
  res.json({ ok: true, service: "hp-zendesk-ticket-solver", tickets: fakeTickets.length, cases: matrix.length });
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

// Demo-only: regenerate the mock ticket queue so you can show your boss “one-click” volume.
// Example: POST /api/demo/regenerate?count=1000&seed=42
app.post("/api/demo/regenerate", (req, res) => {
  const countRaw = String(req.query.count ?? req.body?.count ?? "500");
  const seedRaw = String(req.query.seed ?? req.body?.seed ?? String(Date.now()));
  const count = Math.max(1, Math.min(5000, Number(countRaw) || 500));
  const seed = Number(seedRaw) || Date.now();

  try {
    const outFile = path.join(__dirname, "../data/fakeTickets.json");
    const result = writeDemoTicketsFile({ count, seed, outFile });
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.post("/api/solve", (req, res) => {
  const ticket = req.body;
  if (!ticket) return res.status(400).json({ error: "Missing ticket" });

  const result = solveTicket(ticket, matrix);
  res.json(result);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));