// /server/src/index.js
// Add/replace your cors setup with this:
import cors from "cors";

const allowed = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // local/dev tools
    if (allowed.length === 0) return cb(null, true); // allow all if not set
    if (allowed.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  }
}));