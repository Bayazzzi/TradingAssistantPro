import { NextResponse } from "next/server";

// Best-time-to-trade heatmap: average volatility (range as % of price) for
// each (weekday, UTC hour) bucket over the last ~60 days of hourly bars, so a
// trader can see when a specific instrument actually moves.
export const dynamic = "force-dynamic";

const TTL_MS = 60 * 60 * 1000; // hourly bars over 60d don't need to be fresh
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export interface TimingCell {
  weekday: number; // 0=Sun ... 6=Sat (UTC)
  hour: number; // 0-23 UTC
  avgRangePct: number;
  count: number;
}

const cache = new Map<string, { cells: TimingCell[]; at: number }>();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") ?? "";
  if (!symbol) return NextResponse.json({ cells: [], error: "missing symbol" }, { status: 400 });

  const hit = cache.get(symbol);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return NextResponse.json({ symbol, cells: hit.cells });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=60d&interval=60m`;
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, cache: "no-store" });
    if (!res.ok) throw new Error(`timing status ${res.status}`);
    const data = await res.json();
    const r = data?.chart?.result?.[0];
    const ts: number[] = r?.timestamp ?? [];
    const q = r?.indicators?.quote?.[0] ?? {};

    const buckets = new Map<string, { sum: number; n: number }>();
    for (let i = 0; i < ts.length; i++) {
      const h = q.high?.[i];
      const l = q.low?.[i];
      const c = q.close?.[i];
      if (![h, l, c].every((x) => typeof x === "number") || !c) continue;
      const d = new Date(ts[i] * 1000);
      const weekday = d.getUTCDay();
      const hour = d.getUTCHours();
      const key = `${weekday}-${hour}`;
      const rangePct = ((h - l) / c) * 100;
      const b = buckets.get(key) ?? { sum: 0, n: 0 };
      b.sum += rangePct;
      b.n += 1;
      buckets.set(key, b);
    }

    const cells: TimingCell[] = Array.from(buckets.entries()).map(([key, b]) => {
      const [weekday, hour] = key.split("-").map(Number);
      return { weekday, hour, avgRangePct: b.sum / b.n, count: b.n };
    });

    if (cells.length) cache.set(symbol, { cells, at: Date.now() });
    return NextResponse.json({ symbol, cells });
  } catch (err) {
    return NextResponse.json({ symbol, cells: [], error: (err as Error).message }, { status: 200 });
  }
}
