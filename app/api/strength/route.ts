import { NextResponse } from "next/server";

// Currency Strength Meter: how strong each major currency is right now,
// derived from the daily % move of a balanced basket of pairs. For a pair
// BASE/QUOTE moving +x%, BASE gains +x and QUOTE gains −x; each currency's
// strength is the average of its signed moves across every pair it appears in.
export const dynamic = "force-dynamic";

const TTL_MS = 5 * 60 * 1000;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// Yahoo symbol → [base, quote]
const PAIRS: Array<{ symbol: string; base: string; quote: string }> = [
  { symbol: "EURUSD=X", base: "EUR", quote: "USD" },
  { symbol: "GBPUSD=X", base: "GBP", quote: "USD" },
  { symbol: "AUDUSD=X", base: "AUD", quote: "USD" },
  { symbol: "NZDUSD=X", base: "NZD", quote: "USD" },
  { symbol: "USDJPY=X", base: "USD", quote: "JPY" },
  { symbol: "USDCAD=X", base: "USD", quote: "CAD" },
  { symbol: "USDCHF=X", base: "USD", quote: "CHF" },
  { symbol: "EURGBP=X", base: "EUR", quote: "GBP" },
  { symbol: "EURJPY=X", base: "EUR", quote: "JPY" },
  { symbol: "GBPJPY=X", base: "GBP", quote: "JPY" },
  { symbol: "AUDJPY=X", base: "AUD", quote: "JPY" },
  { symbol: "NZDJPY=X", base: "NZD", quote: "JPY" },
  { symbol: "CADJPY=X", base: "CAD", quote: "JPY" },
  { symbol: "CHFJPY=X", base: "CHF", quote: "JPY" },
];

export interface Strength {
  currency: string;
  score: number; // average signed daily % change
}

async function pairChange(symbol: string): Promise<number | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`;
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, cache: "no-store" });
    if (!res.ok) return null;
    const m = (await res.json())?.chart?.result?.[0]?.meta;
    if (!m || typeof m.regularMarketPrice !== "number") return null;
    const prev = m.chartPreviousClose ?? m.previousClose;
    if (!prev) return null;
    return ((m.regularMarketPrice - prev) / prev) * 100;
  } catch {
    return null;
  }
}

let cache: { list: Strength[]; at: number } | null = null;
let inflight: Promise<Strength[]> | null = null;

async function build(): Promise<Strength[]> {
  const changes = await Promise.all(PAIRS.map((p) => pairChange(p.symbol)));
  const acc: Record<string, { sum: number; n: number }> = {};
  const add = (cur: string, v: number) => {
    acc[cur] = acc[cur] ?? { sum: 0, n: 0 };
    acc[cur].sum += v;
    acc[cur].n += 1;
  };
  PAIRS.forEach((p, i) => {
    const c = changes[i];
    if (c === null) return;
    add(p.base, c);
    add(p.quote, -c);
  });
  return Object.entries(acc)
    .map(([currency, { sum, n }]) => ({ currency, score: n ? sum / n : 0 }))
    .sort((a, b) => b.score - a.score);
}

export async function GET() {
  const now = Date.now();
  if (!cache || now - cache.at >= TTL_MS) {
    if (!inflight) {
      inflight = build()
        .then((list) => {
          if (list.length) cache = { list, at: Date.now() };
          return list;
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
    { list: cache?.list ?? [], updatedAt: cache ? new Date(cache.at).toISOString() : null },
    { headers: { "Cache-Control": "no-store" } }
  );
}
