import { NextResponse } from "next/server";

// OHLC candles for the interactive chart. Proxies Yahoo Finance and exposes a
// small set of allowed timeframe presets (range + interval) so the endpoint
// can't be used to hammer arbitrary queries.
export const dynamic = "force-dynamic";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

// tf id → Yahoo range/interval
const TF: Record<string, { range: string; interval: string }> = {
  "1D": { range: "1d", interval: "5m" },
  "1W": { range: "5d", interval: "30m" },
  "1M": { range: "1mo", interval: "1d" },
  "3M": { range: "3mo", interval: "1d" },
  "1Y": { range: "1y", interval: "1d" },
};

export interface Candle {
  t: number; // unix seconds
  o: number;
  h: number;
  l: number;
  c: number;
}

const cache = new Map<string, { candles: Candle[]; at: number }>();
const TTL_MS = 60 * 1000;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") ?? "";
  const tfId = searchParams.get("tf") ?? "3M";
  const tf = TF[tfId];
  if (!symbol || !tf) {
    return NextResponse.json({ candles: [], error: "invalid params" }, { status: 400 });
  }

  const key = `${symbol}|${tfId}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return NextResponse.json({ symbol, tf: tfId, candles: hit.candles }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${tf.range}&interval=${tf.interval}`;
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, cache: "no-store" });
    if (!res.ok) throw new Error(`chart status ${res.status}`);
    const data = await res.json();
    const r = data?.chart?.result?.[0];
    const ts: number[] = r?.timestamp ?? [];
    const q = r?.indicators?.quote?.[0] ?? {};
    const candles: Candle[] = [];
    for (let i = 0; i < ts.length; i++) {
      const o = q.open?.[i];
      const h = q.high?.[i];
      const l = q.low?.[i];
      const c = q.close?.[i];
      if ([o, h, l, c].every((x) => typeof x === "number")) {
        candles.push({ t: ts[i], o, h, l, c });
      }
    }
    if (candles.length) cache.set(key, { candles, at: Date.now() });
    return NextResponse.json({ symbol, tf: tfId, candles }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return NextResponse.json({ symbol, tf: tfId, candles: [], error: (err as Error).message }, { status: 200 });
  }
}
