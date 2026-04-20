// /server/src/routes/integrations.js
import express from "express";
import { zendeskSearchTickets, zendeskUpdateTicket } from "../integrations/zendesk.js";
import { tableauLookupItinerary } from "../integrations/tableau.js";

const router = express.Router();

/**
 * Zendesk placeholder
 * GET /api/integrations/zendesk/search?q=...
 */
router.get("/zendesk/search", async (req, res) => {
  const q = String(req.query.q || "").trim();
  const out = await zendeskSearchTickets(q);
  res.json(out);
});

/**
 * Zendesk placeholder
 * POST /api/integrations/zendesk/ticket/:id
 * body: { public_comment, private_note, status, tags_to_add, tags_to_remove }
 */
router.post("/zendesk/ticket/:id", async (req, res) => {
  const id = req.params.id;
  const updates = req.body || {};
  const out = await zendeskUpdateTicket(id, updates);
  res.json(out);
});

/**
 * Tableau placeholder
 * GET /api/integrations/tableau/itinerary/:itinerary
 */
router.get("/tableau/itinerary/:itinerary", async (req, res) => {
  const itinerary = req.params.itinerary;
  const out = await tableauLookupItinerary(itinerary);
  res.json(out);
});

export default router;