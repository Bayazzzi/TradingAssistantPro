import { NextResponse } from "next/server";

// Multi-timeframe trend bias scanner: for each instrument, classify the
// trend on D1/H4/H1 using a 20-period SMA vs its own slope, so a trader can
// see at a glance where all timeframes agree (confluence) without opening
// ten charts.
export const dynamic = "force-dynamic";

const TTL_MS = 15 * 60 * 1000;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const INSTRUMENTS = [
  { symbol: "EURUSD=X", label: "EUR/USD" },
  { symbol: "GBPUSD=X", label: "GBP/USD" },
  { symbol: "USDJPY=X", label: "USD/JPY" },
  { symbol: "AUDUSD=X", label: "AUD/USD" },
  { symbol: "USDCAD=X", label: "USD/CAD" },
  { symbol: "GC=F", label: "GOLD" },
  { symbol: "SI=F", label: "SILVER" },
  { symbol: "CL=F", label: "OIL" },
  { symbol: "BTC-USD", label: "BTC" },
  { symbol: "^GSPC", label: "S&P 500" },
];

export type Trend = "up" | "down" | "flat";

export interface TrendRow {
  symbol: string;
  label: string;
  d1: Trend;
  h4: Trend;
  h1: Trend;
  aligned: boolean;
}

function sma(vals: number[], period: number, endExclusive: number): number | null {
  const start = endExclusive - period;
  if (start < 0) return null;
  let sum = 0;
  for (let i = start; i < endExclusive; i++) sum += vals[i];
  return sum / period;
}

// Trend = where price sits vs SMA20, confirmed by the SMA's own slope over
// the last 5 periods. Needs both conditions to avoid flagging noise as trend.
function classify(closes: number[]): Trend {
  const n = closes.length;
  if (n < 26) return "flat";
  const smaNow = sma(closes, 20, n);
  const smaPast = sma(closes, 20, n - 5);
  if (smaNow === null || smaPast === null) return "flat";
  const last = closes[n - 1];
  const slope = (smaNow - smaPast) / smaPast;
  const priceAbove = last > smaNow;
  const priceBelow = last < smaNow;
  if (priceAbove && slope > 0.0003) return "up";
  if (priceBelow && slope < -0.0003) return "down";
  return "flat";
}

async function fetchCloses(symbol: string, range: string, interval: string): Promise<number[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    const closes: (number | null)[] = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
    return closes.filter((c): c is number => typeof c === "number");
  } catch {
    return [];
  }
}

// Resample a series of hourly closes into 4-hour bars by taking every 4th
// close (the close of each 4h block) — good enough for a trend bias check.
function resampleH4(hourlyCloses: number[]): number[] {
  const out: number[] = [];
  for (let i = 3; i < hourlyCloses.length; i += 4) out.push(hourlyCloses[i]);
  return out;
}

async function fetchRow(inst: (typeof INSTRUMENTS)[number]): Promise<TrendRow | null> {
  const [daily, hourly] = await Promise.all([
    fetchCloses(inst.symbol, "6mo", "1d"),
    fetchCloses(inst.symbol, "60d", "60m"),
  ]);
  if (daily.length < 26 && hourly.length < 26) return null;
  const d1 = classify(daily);
  const h1 = classify(hourly);
  const h4 = classify(resampleH4(hourly));
  const aligned = d1 !== "flat" && d1 === h4 && h4 === h1;
  return { symbol: inst.symbol, label: inst.label, d1, h4, h1, aligned };
}

let cache: { rows: TrendRow[]; at: number } | null = null;
let inflight: Promise<TrendRow[]> | null = null;

async function build(): Promise<TrendRow[]> {
  const rows = await Promise.all(INSTRUMENTS.map(fetchRow));
  return rows.filter((r): r is TrendRow => r !== null);
}

export async function GET() {
  const now = Date.now();
  if (!cache || now - cache.at >= TTL_MS) {
    if (!inflight) {
      inflight = build()
        .then((rows) => {
          if (rows.length) cache = { rows, at: Date.now() };
          return rows;
        })
        .finally(() => {
          inflight = null;
        });
    }
    try {
      await inflight;
    } catch {
      /* fall back to stale cache */
    }
  }
  return NextResponse.json(
    { rows: cache?.rows ?? [], updatedAt: cache ? new Date(cache.at).toISOString() : null },
    { headers: { "Cache-Control": "no-store" } }
  );
}
