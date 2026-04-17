// /server/scripts/generateFakeTickets.js
// Usage:
//   node scripts/generateFakeTickets.js            -> generates 500 tickets
//   node scripts/generateFakeTickets.js 1000       -> generates 1000 tickets
//   node scripts/generateFakeTickets.js 250 --seed=42

import path from "path";
import { fileURLToPath } from "url";

import { writeDemoTicketsFile } from "../src/demoTicketGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outPath = path.join(__dirname, "../data/fakeTickets.json");

function parseArgs(argv) {
  const args = { count: 500, seed: Date.now() };
  const maybeCount = argv[2];
  if (maybeCount && /^\d+$/.test(maybeCount)) args.count = Number(maybeCount);
  const seedArg = argv.find((a) => a.startsWith("--seed="));
  if (seedArg) args.seed = Number(seedArg.split("=")[1] || args.seed);
  return args;
}

function main() {
  const { count, seed } = parseArgs(process.argv);
  const res = writeDemoTicketsFile({ count, seed, outFile: outPath });
  console.log(`✅ Wrote ${res.count} tickets to ${res.outFile}`);
  console.log(`Seed: ${res.seed}`);
}

main();