// /server/src/demoTicketGenerator.js
import fs from "fs";
import path from "path";

import {
  CASE_DEFS,
  CONTEXT_SNIPPETS,
  EVIDENCE_SNIPPETS,
  HOTELS,
  FIRST_NAMES,
  LAST_NAMES,
  SUPPLIERS,
  BOOKING_TYPES,
  BRANDS,
  STATUSES,
} from "./scenarioLibrary.js";

// Deterministic RNG for repeatable demos.
export function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

export function weightedPick(rng, items) {
  const total = items.reduce((sum, s) => sum + (s.weight || 1), 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= item.weight || 1;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

function pad(n, size) {
  const s = String(n);
  return s.length >= size ? s : "0".repeat(size - s.length) + s;
}

function randomPhone(rng) {
  const area = 200 + Math.floor(rng() * 700);
  const mid = 200 + Math.floor(rng() * 700);
  const last = Math.floor(rng() * 10000);
  return `+1${area}${mid}${pad(last, 4)}`;
}

function randomGuestName(rng) {
  return `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`;
}

function emailFromName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
    .replace(/\s+/g, ".")
    .concat("@example.com");
}

function randomItinerary(rng) {
  const num = Math.floor(10000000 + rng() * 89999999);
  return `H${num}`;
}

function randomMoney(rng, min = 120, max = 2500) {
  const v = min + rng() * (max - min);
  return Math.round(v * 100) / 100;
}

function randomDateRange(rng) {
  const now = new Date();
  const startOffsetDays = Math.floor(rng() * 45) - 10; // some past, mostly upcoming
  const length = 1 + Math.floor(rng() * 7);
  const checkIn = new Date(now);
  checkIn.setDate(now.getDate() + startOffsetDays);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkIn.getDate() + length);

  const fmt = (d) => d.toISOString().slice(0, 10);
  return { checkIn: fmt(checkIn), checkOut: fmt(checkOut) };
}

function fill(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_m, key) => (vars[key] ?? ""));
}

function buildNarrative(rng, issueSnippet, vars) {
  const context = pick(rng, CONTEXT_SNIPPETS);
  const evidence = pick(rng, EVIDENCE_SNIPPETS);
  return [fill(issueSnippet, vars), fill(context, vars), fill(evidence, vars)]
    .filter(Boolean)
    .join(" ");
}

function buildZendeskMock(ticket) {
  // Illustrative payload: this is how your “OpenClaw tools” would pull fields from APIs later. :contentReference[oaicite:3]{index=3}
  return {
    id: ticket.ticket_id,
    subject: ticket.subject,
    status: String(ticket.status || "New").toLowerCase(),
    brand: ticket.brand,
    priority: "normal",
    tags: ticket.tags,
    requester: {
      name: ticket.guest_name,
      email: ticket.guest_email,
      phone: ticket.guest_phone,
    },
    custom_fields: {
      itinerary_number: ticket.itinerary,
      booking_type: ticket.booking_context.bookingType,
      supplier: ticket.booking_context.supplier,
      check_in: ticket.booking_context.checkInDate,
      check_out: ticket.booking_context.checkOutDate,
      refundable: ticket.booking_context.refundable,
      has_rpp: ticket.booking_context.hasRpp,
    },
    description: ticket.description,
    created_at: ticket.created_at,
    updated_at: ticket.updated_at,
  };
}

export function generateDemoTickets({ count = 500, seed = Date.now() }) {
  const rng = mulberry32(seed);
  const baseTicketId = 770000000; // obviously demo

  const tickets = [];
  for (let i = 0; i < count; i++) {
    const scenario = weightedPick(rng, CASE_DEFS);
    const hotel = pick(rng, HOTELS);
    const guest = randomGuestName(rng);
    const itinerary = randomItinerary(rng);
    const supplier = pick(rng, SUPPLIERS);
    const bookingType = pick(rng, BOOKING_TYPES);
    const { checkIn, checkOut } = randomDateRange(rng);
    const amount = randomMoney(rng);
    const refundable = scenario.caseKey.includes("Refundable") ? true : rng() > 0.55;
    const hasRpp = rng() > 0.7;

    const policy = refundable
      ? `Refundable with penalty if cancelled within 72 hours of check-in.`
      : `Non-refundable booking. Exceptions require approval.`;

    const vars = {
      itinerary,
      hotel: hotel.name,
      city: hotel.city,
      state: hotel.state,
      guest,
      supplier,
      amount: amount.toFixed(2),
      checkIn,
      checkOut,
      policy,
      bookingType,
    };

    const ticket_id = baseTicketId + i;
    const subject = fill(pick(rng, scenario.subjectTemplates), vars);
    const description = buildNarrative(rng, pick(rng, scenario.issueSnippets), vars);

    const status = rng() < 0.6 ? pick(rng, ["New", "Open"]) : pick(rng, STATUSES);
    const brand = pick(rng, BRANDS);
    const createdAt = new Date(Date.now() - Math.floor(rng() * 1000 * 60 * 60 * 72));
    const updatedAt = new Date(createdAt.getTime() + Math.floor(rng() * 1000 * 60 * 60 * 24));

    const ticket = {
      ticket_id,
      itinerary,
      guest_name: guest,
      guest_email: emailFromName(guest),
      guest_phone: randomPhone(rng),
      hotel_name: hotel.name,
      hotel_phone: hotel.phone,
      hotel_city: hotel.city,
      hotel_state: hotel.state,
      status,
      brand,
      subject,
      description,
      estimated_amount: amount,
      tags: Array.from(new Set([...(scenario.tags || []), "demo_seed", "matrix_solve"])),
      source: "Generated Mock Tickets",
      expected_case_key: scenario.caseKey,
      booking_context: {
        bookingType,
        supplier,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        refundable,
        hasRpp,
        policy_text: policy,
      },
      api_mock: { zendesk_ticket: null },
      created_at: createdAt.toISOString(),
      updated_at: updatedAt.toISOString(),
    };

    ticket.api_mock.zendesk_ticket = buildZendeskMock(ticket);
    tickets.push(ticket);
  }
  return tickets;
}

export function writeDemoTicketsFile({ count = 500, seed = Date.now(), outFile }) {
  if (!outFile) throw new Error("outFile is required");
  const tickets = generateDemoTickets({ count, seed });
  const dir = path.dirname(outFile);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(tickets, null, 2));
  return { count: tickets.length, seed, outFile };
}