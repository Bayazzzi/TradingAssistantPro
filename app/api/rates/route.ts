import { NextResponse } from "next/server";

// Currency converter data — public, no-key exchange rate feed (USD base).
// Cached in-memory since the upstream only refreshes every ~24h.
export const dynamic = "force-dynamic";

const FEED = "https://open.er-api.com/v6/latest/USD";
const TTL_MS = 60 * 60 * 1000; // 1 hour

let cache: { rates: Record<string, number>; at: number } | null = null;
let inflight: Promise<Record<string, number>> | null = null;

async function fetchRates(): Promise<Record<string, number>> {
  const res = await fetch(FEED, { cache: "no-store" });
  if (!res.ok) throw new Error(`rates feed status ${res.status}`);
  const data = (await res.json()) as { result: string; rates: Record<string, number> };
  if (data.result !== "success" || !data.rates) throw new Error("rates feed malformed response");
  return data.rates;
}

export async function GET() {
  const now = Date.now();
  if (!cache || now - cache.at >= TTL_MS) {
    if (!inflight) {
      inflight = fetchRates()
        .then((rates) => {
          cache = { rates, at: Date.now() };
          return rates;
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
    return NextResponse.json({ rates: {}, base: "USD", error: "rates unavailable" }, { status: 200 });
  }

  return NextResponse.json(
    { rates: cache.rates, base: "USD", updatedAt: new Date(cache.at).toISOString() },
    { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=7200" } }
  );
}
