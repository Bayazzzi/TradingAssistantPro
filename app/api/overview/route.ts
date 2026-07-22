import { NextResponse } from "next/server";

// Market overview: multi-timeframe performance, ATR-based volatility and a
// sparkline for each instrument — all derived from one year of daily candles
// per symbol (Yahoo Finance). Cached in-memory since daily bars are enough.
export const dynamic = "force-dynamic";

const TTL_MS = 15 * 60 * 1000;

const INSTRUMENTS = [
  { symbol: "EURUSD=X", label: "EUR/USD", decimals: 4 },
  { symbol: "GBPUSD=X", label: "GBP/USD", decimals: 4 },
  { symbol: "USDJPY=X", label: "USD/JPY", decimals: 2 },
  { symbol: "AUDUSD=X", label: "AUD/USD", decimals: 4 },
  { symbol: "USDCAD=X", label: "USD/CAD", decimals: 4 },
  { symbol: "GC=F", label: "GOLD", decimals: 2 },
  { symbol: "SI=F", label: "SILVER", decimals: 2 },
  { symbol: "CL=F", label: "OIL", decimals: 2 },
  { symbol: "BTC-USD", label: "BTC", decimals: 0 },
  { symbol: "ETH-USD", label: "ETH", decimals: 0 },
  { symbol: "^GSPC", label: "S&P 500", decimals: 2 },
  { symbol: "^NDX", label: "NAS 100", decimals: 2 },
  { symbol: "^DJI", label: "DOW", decimals: 0 },
];

export interface OverviewRow {
  symbol: string;
  label: string;
  decimals: number;
  price: number;
  d1: number | null;
  w1: number | null;
  m1: number | null;
  ytd: number | null;
  atrPct: number | null; // ATR(14) as % of price — comparable volatility
  spark: number[];
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function pctChange(from: number, to: number): number | null {
  if (!from || !Number.isFinite(from)) return null;
  return ((to - from) / from) * 100;
}

function atr14(high: number[], low: number[], close: number[]): number | null {
  const n = close.length;
  if (n < 15) return null;
  const trs: number[] = [];
  for (let i = 1; i < n; i++) {
    const tr = Math.max(
      high[i] - low[i],
      Math.abs(high[i] - close[i - 1]),
      Math.abs(low[i] - close[i - 1])
    );
    trs.push(tr);
  }
  const last14 = trs.slice(-14);
  return last14.reduce((s, x) => s + x, 0) / last14.length;
}

async function fetchRow(inst: (typeof INSTRUMENTS)[number]): Promise<OverviewRow | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      inst.symbol
    )}?range=1y&interval=1d`;
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const r = data?.chart?.result?.[0];
    if (!r) return null;
    const ts: number[] = r.timestamp ?? [];
    const q = r.indicators?.quote?.[0] ?? {};
    // Keep only bars where close is present, aligning the OHLC + timestamp arrays.
    const idx: number[] = [];
    (q.close ?? []).forEach((c: number | null, i: number) => {
      if (typeof c === "number" && typeof q.high?.[i] === "number" && typeof q.low?.[i] === "number") idx.push(i);
    });
    if (idx.length < 5) return null;
    const close = idx.map((i) => q.close[i] as number);
    const high = idx.map((i) => q.high[i] as number);
    const low = idx.map((i) => q.low[i] as number);
    const times = idx.map((i) => ts[i]);
    const n = close.length;
    const price = close[n - 1];

    const at = (back: number) => (n - 1 - back >= 0 ? close[n - 1 - back] : null);
    const d1 = at(1) !== null ? pctChange(at(1)!, price) : null;
    const w1 = at(5) !== null ? pctChange(at(5)!, price) : null;
    const m1 = at(21) !== null ? pctChange(at(21)!, price) : null;

    // YTD: first close of the current calendar year.
    const year = new Date().getUTCFullYear();
    let ytdBase: number | null = null;
    for (let i = 0; i < n; i++) {
      if (new Date(times[i] * 1000).getUTCFullYear() === year) {
        ytdBase = close[i];
        break;
      }
    }
    const ytd = ytdBase !== null ? pctChange(ytdBase, price) : null;

    const atr = atr14(high, low, close);
    const atrPct = atr !== null && price ? (atr / price) * 100 : null;

    const spark = close.slice(-40);

    return { symbol: inst.symbol, label: inst.label, decimals: inst.decimals, price, d1, w1, m1, ytd, atrPct, spark };
  } catch {
    return null;
  }
}

let cache: { rows: OverviewRow[]; at: number } | null = null;
let inflight: Promise<OverviewRow[]> | null = null;

async function build(): Promise<OverviewRow[]> {
  const rows = await Promise.all(INSTRUMENTS.map(fetchRow));
  return rows.filter((r): r is OverviewRow => r !== null);
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
