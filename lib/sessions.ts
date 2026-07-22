// Trading session logic — reworked from the original desktop app.
// All session windows are defined in UTC hours so the logic is timezone-safe
// on the server and the client alike.

export type SessionKey = "Sydney" | "Tokyo" | "London" | "New York";

export interface SessionDef {
  key: SessionKey;
  city: string;
  flag: string;
  tz: string; // IANA timezone for displaying local time
  // Session window in UTC hours [open, close). May wrap past midnight.
  openUTC: number;
  closeUTC: number;
  color: string;
}

// Standard FX session hours (approximate, UTC). These match the industry-standard
// London/NY/Tokyo/Sydney windows used across trading platforms.
export const SESSIONS: SessionDef[] = [
  { key: "Sydney", city: "Sydney", flag: "🇦🇺", tz: "Australia/Sydney", openUTC: 21, closeUTC: 6, color: "#f59e0b" },
  { key: "Tokyo", city: "Tokyo", flag: "🇯🇵", tz: "Asia/Tokyo", openUTC: 0, closeUTC: 9, color: "#ef4444" },
  { key: "London", city: "London", flag: "🇬🇧", tz: "Europe/London", openUTC: 7, closeUTC: 16, color: "#3b82f6" },
  { key: "New York", city: "New York", flag: "🇺🇸", tz: "America/New_York", openUTC: 12, closeUTC: 21, color: "#22c55e" },
];

export interface SessionState {
  def: SessionDef;
  localTime: string; // HH:MM:SS in the city's timezone
  localHour: number;
  isDay: boolean;
  isOpen: boolean;
  status: "OPEN" | "CLOSED" | "WEEKEND";
  // Milliseconds until the next boundary (close if open, open if closed).
  msToBoundary: number;
  boundaryLabel: string; // "closes in" | "opens in"
}

function fmtTime(d: Date, tz: string): { time: string; hour: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  let hh = get("hour");
  if (hh === "24") hh = "00";
  return { time: `${hh}:${get("minute")}:${get("second")}`, hour: parseInt(hh, 10) };
}

// Is a given session open at UTC time `d`? Weekends handled per-session:
// the FX market opens Sydney Sunday ~21:00 UTC and closes NY Friday 21:00 UTC.
function isSessionOpen(def: SessionDef, d: Date): boolean {
  const hourFloat = d.getUTCHours() + d.getUTCMinutes() / 60;
  const wd = d.getUTCDay(); // 0=Sun ... 6=Sat

  let timeMatch: boolean;
  if (def.openUTC < def.closeUTC) {
    timeMatch = hourFloat >= def.openUTC && hourFloat < def.closeUTC;
  } else {
    // Wraps past midnight (Sydney 21→06)
    timeMatch = hourFloat >= def.openUTC || hourFloat < def.closeUTC;
  }
  if (!timeMatch) return false;

  if (def.key === "Sydney") {
    // Sydney's evening-UTC open belongs to the *next* trading day.
    // Open Sun–Thu evenings; the Fri 21:00 open would be Sat local → closed.
    // wd here is the UTC weekday of the current instant.
    if (hourFloat >= def.openUTC) {
      // Evening portion (21:00-24:00): valid Sun(0)-Thu(4)
      return wd >= 0 && wd <= 4;
    } else {
      // Morning portion (00:00-06:00): valid Mon(1)-Fri(5)
      return wd >= 1 && wd <= 5;
    }
  }
  // Tokyo/London/NY trade Mon–Fri
  return wd >= 1 && wd <= 5;
}

// Find the next UTC instant at which `def` opens, searching forward from `d`.
function nextOpen(def: SessionDef, d: Date): Date {
  const probe = new Date(d);
  probe.setUTCMinutes(0, 0, 0);
  probe.setUTCHours(def.openUTC);
  if (probe <= d) probe.setUTCDate(probe.getUTCDate() + 1);
  for (let i = 0; i < 9; i++) {
    const wd = probe.getUTCDay();
    const valid = def.key === "Sydney" ? wd !== 5 && wd !== 6 : wd !== 6 && wd !== 0;
    if (valid) return probe;
    probe.setUTCDate(probe.getUTCDate() + 1);
  }
  return probe;
}

// Find the next UTC instant at which `def` closes (only called when open).
function nextClose(def: SessionDef, d: Date): Date {
  const probe = new Date(d);
  probe.setUTCMinutes(0, 0, 0);
  probe.setUTCHours(def.closeUTC);
  if (probe <= d) probe.setUTCDate(probe.getUTCDate() + 1);
  return probe;
}

export function computeSession(def: SessionDef, now: Date): SessionState {
  const { time, hour } = fmtTime(now, def.tz);
  const open = isSessionOpen(def, now);
  const wd = now.getUTCDay();
  const isWeekendish = !open && (wd === 6 || wd === 0 || wd === 5);

  let msToBoundary: number;
  let boundaryLabel: string;
  if (open) {
    msToBoundary = nextClose(def, now).getTime() - now.getTime();
    boundaryLabel = "closes in";
  } else {
    msToBoundary = nextOpen(def, now).getTime() - now.getTime();
    boundaryLabel = "opens in";
  }

  // Rough weekend detection for status label
  let status: SessionState["status"] = open ? "OPEN" : "CLOSED";
  if (!open && isWeekendish && msToBoundary > 12 * 3600 * 1000) status = "WEEKEND";

  return {
    def,
    localTime: time,
    localHour: hour,
    isDay: hour >= 7 && hour < 19,
    isOpen: open,
    status,
    msToBoundary,
    boundaryLabel,
  };
}

export function computeAllSessions(now: Date): SessionState[] {
  return SESSIONS.map((s) => computeSession(s, now));
}

// The London/NY overlap (12:00–16:00 UTC) is the highest-liquidity window.
export function activeOverlap(states: SessionState[]): string | null {
  const openCities = states.filter((s) => s.isOpen).map((s) => s.def.key);
  if (openCities.includes("London") && openCities.includes("New York")) {
    return "London × New York";
  }
  if (openCities.includes("Tokyo") && openCities.includes("London")) {
    return "Tokyo × London";
  }
  if (openCities.includes("Sydney") && openCities.includes("Tokyo")) {
    return "Sydney × Tokyo";
  }
  return null;
}

export function formatCountdown(ms: number): string {
  if (ms < 0) ms = 0;
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const base = `${pad(h)}:${pad(m)}:${pad(s)}`;
  return days > 0 ? `${days}d ${base}` : base;
}
