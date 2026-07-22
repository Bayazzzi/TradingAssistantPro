import { NextResponse } from "next/server";

// Macro barometer: the handful of gauges that set risk sentiment across every
// market — dollar index, US 10y yield, VIX, crypto Fear & Greed and BTC
// dominance. Aggregated from a few public feeds and cached in-memory.
export const dynamic = "force-dynamic";

const TTL_MS = 10 * 60 * 1000;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export interface MacroData {
  dxy: { value: number; changePct: number } | null;
  us10y: { value: number; changePct: number } | null;
  vix: { value: number; changePct: number } | null;
  fearGreed: { value: number; label: string } | null;
  btcDominance: number | null;
}

async function yahooQuote(symbol: string): Promise<{ value: number; changePct: number } | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`;
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, cache: "no-store" });
    if (!res.ok) return null;
    const m = (await res.json())?.chart?.result?.[0]?.meta;
    if (!m || typeof m.regularMarketPrice !== "number") return null;
    const prev = m.chartPreviousClose ?? m.previousClose ?? m.regularMarketPrice;
    const changePct = prev ? ((m.regularMarketPrice - prev) / prev) * 100 : 0;
    return { value: m.regularMarketPrice, changePct };
  } catch {
    return null;
  }
}

async function fearGreed(): Promise<{ value: number; label: string } | null> {
  try {
    const res = await fetch("https://api.alternative.me/fng/", { cache: "no-store" });
    if (!res.ok) return null;
    const d = (await res.json())?.data?.[0];
    if (!d) return null;
    return { value: parseInt(d.value, 10), label: d.value_classification };
  } catch {
    return null;
  }
}

async function btcDominance(): Promise<number | null> {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/global", {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const d = (await res.json())?.data?.market_cap_percentage?.btc;
    return typeof d === "number" ? d : null;
  } catch {
    return null;
  }
}

let cache: { data: MacroData; at: number } | null = null;
let inflight: Promise<MacroData> | null = null;

async function build(): Promise<MacroData> {
  const [dxy, us10y, vix, fg, dom] = await Promise.all([
    yahooQuote("DX-Y.NYB"),
    yahooQuote("^TNX"),
    yahooQuote("^VIX"),
    fearGreed(),
    btcDominance(),
  ]);
  return { dxy, us10y, vix, fearGreed: fg, btcDominance: dom };
}

export async function GET() {
  const now = Date.now();
  if (!cache || now - cache.at >= TTL_MS) {
    if (!inflight) {
      inflight = build()
        .then((data) => {
          cache = { data, at: Date.now() };
          return data;
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
    { data: cache?.data ?? null, updatedAt: cache ? new Date(cache.at).toISOString() : null },
    { headers: { "Cache-Control": "no-store" } }
  );
}
