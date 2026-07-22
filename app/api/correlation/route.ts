import { NextResponse } from "next/server";

// Pairwise correlation of daily returns across major instruments — helps a
// trader spot hidden overlap in risk (e.g. AUDUSD and Gold often move together).
export const dynamic = "force-dynamic";

const SYMBOLS = [
  { symbol: "EURUSD=X", label: "EUR/USD" },
  { symbol: "GBPUSD=X", label: "GBP/USD" },
  { symbol: "USDJPY=X", label: "USD/JPY" },
  { symbol: "AUDUSD=X", label: "AUD/USD" },
  { symbol: "USDCAD=X", label: "USD/CAD" },
  { symbol: "GC=F", label: "GOLD" },
  { symbol: "CL=F", label: "OIL" },
  { symbol: "BTC-USD", label: "BTC" },
  { symbol: "^GSPC", label: "S&P 500" },
];

const TTL_MS = 60 * 60 * 1000; // 1 hour — daily-bar data doesn't need to be fresher

interface Series {
  label: string;
  returns: number[];
}

async function fetchReturns(symbol: string): Promise<number[] | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      symbol
    )}?range=3mo&interval=1d`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    const closes: (number | null)[] = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
    const clean = closes.filter((c): c is number => typeof c === "number");
    if (clean.length < 10) return null;
    const returns: number[] = [];
    for (let i = 1; i < clean.length; i++) {
      returns.push((clean[i] - clean[i - 1]) / clean[i - 1]);
    }
    return returns;
  } catch {
    return null;
  }
}

function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 5) return 0;
  const av = a.slice(-n);
  const bv = b.slice(-n);
  const meanA = av.reduce((s, x) => s + x, 0) / n;
  const meanB = bv.reduce((s, x) => s + x, 0) / n;
  let num = 0;
  let denA = 0;
  let denB = 0;
  for (let i = 0; i < n; i++) {
    const da = av[i] - meanA;
    const db = bv[i] - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  const den = Math.sqrt(denA * denB);
  return den === 0 ? 0 : num / den;
}

let cache: { labels: string[]; matrix: number[][]; at: number } | null = null;
let inflight: Promise<{ labels: string[]; matrix: number[][] }> | null = null;

async function computeMatrix(): Promise<{ labels: string[]; matrix: number[][] }> {
  const series: Series[] = [];
  for (const s of SYMBOLS) {
    const returns = await fetchReturns(s.symbol);
    if (returns) series.push({ label: s.label, returns });
  }
  const matrix = series.map((row) => series.map((col) => pearson(row.returns, col.returns)));
  return { labels: series.map((s) => s.label), matrix };
}

export async function GET() {
  const now = Date.now();
  if (!cache || now - cache.at >= TTL_MS) {
    if (!inflight) {
      inflight = computeMatrix()
        .then((result) => {
          if (result.labels.length) cache = { ...result, at: Date.now() };
          return result;
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

  if (!cache) {
    return NextResponse.json({ labels: [], matrix: [], error: "correlation data unavailable" }, { status: 200 });
  }

  return NextResponse.json(
    { labels: cache.labels, matrix: cache.matrix, updatedAt: new Date(cache.at).toISOString() },
    { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=7200" } }
  );
}
