import { NextResponse } from "next/server";
import { TICKER_INSTRUMENTS, type Quote } from "@/lib/instruments";

// Proxy Yahoo Finance so the client avoids CORS and we hide the upstream shape.
// Revalidated server-side; the client polls this route periodically.
export const revalidate = 0;
export const dynamic = "force-dynamic";

const YF_BASE = "https://query1.finance.yahoo.com/v8/finance/chart/";

interface YFChart {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        previousClose?: number;
      };
    }>;
    error?: unknown;
  };
}

async function fetchOne(symbol: string): Promise<{ price: number; prev: number } | null> {
  try {
    const url = `${YF_BASE}${encodeURIComponent(symbol)}?range=1d&interval=1d`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as YFChart;
    const meta = data.chart?.result?.[0]?.meta;
    if (!meta || typeof meta.regularMarketPrice !== "number") return null;
    const prev = meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice;
    return { price: meta.regularMarketPrice, prev };
  } catch {
    return null;
  }
}

// Short in-memory cache so StrictMode double-mounts and multiple viewers
// don't each trigger 13 upstream requests.
const TTL_MS = 20 * 1000;
let cache: { quotes: Quote[]; at: number } | null = null;
let inflight: Promise<Quote[]> | null = null;

async function fetchAll(): Promise<Quote[]> {
  const results = await Promise.all(
    TICKER_INSTRUMENTS.map(async (inst) => {
      const q = await fetchOne(inst.symbol);
      if (!q) return null;
      const changePct = q.prev ? ((q.price - q.prev) / q.prev) * 100 : 0;
      const quote: Quote = {
        symbol: inst.symbol,
        label: inst.label,
        price: q.price,
        changePct,
        decimals: inst.decimals,
      };
      return quote;
    })
  );
  return results.filter((q): q is Quote => q !== null);
}

export async function GET() {
  const now = Date.now();
  if (!cache || now - cache.at >= TTL_MS) {
    if (!inflight) {
      inflight = fetchAll()
        .then((quotes) => {
          if (quotes.length) cache = { quotes, at: Date.now() };
          return quotes;
        })
        .finally(() => {
          inflight = null;
        });
    }
    try {
      await inflight;
    } catch {
      /* fall through to stale cache below */
    }
  }

  const quotes = cache?.quotes ?? [];
  return NextResponse.json(
    { quotes, updatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
