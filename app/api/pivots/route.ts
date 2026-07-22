import { NextResponse } from "next/server";

// Classic pivot points + Fibonacci retracement levels, derived from the
// previous completed day's high/low/close — the standard reference points
// day traders mark before a session.
export const dynamic = "force-dynamic";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const TTL_MS = 15 * 60 * 1000;

export interface Levels {
  r3: number;
  r2: number;
  r1: number;
  pp: number;
  s1: number;
  s2: number;
  s3: number;
}

const cache = new Map<string, { data: unknown; at: number }>();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") ?? "";
  if (!symbol) return NextResponse.json({ error: "missing symbol" }, { status: 400 });

  const hit = cache.get(symbol);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return NextResponse.json(hit.data);
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=10d&interval=1d`;
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, cache: "no-store" });
    if (!res.ok) throw new Error(`pivots status ${res.status}`);
    const data = await res.json();
    const r = data?.chart?.result?.[0];
    const ts: number[] = r?.timestamp ?? [];
    const q = r?.indicators?.quote?.[0] ?? {};
    const bars: Array<{ t: number; h: number; l: number; c: number }> = [];
    for (let i = 0; i < ts.length; i++) {
      const h = q.high?.[i];
      const l = q.low?.[i];
      const c = q.close?.[i];
      if ([h, l, c].every((x) => typeof x === "number")) bars.push({ t: ts[i], h, l, c });
    }
    if (bars.length < 2) throw new Error("not enough history");

    // Yahoo's last daily bar is usually still forming (today) — use the
    // previous completed bar's H/L/C as the reference range.
    const ref = bars[bars.length - 2];
    const { h, l, c } = ref;
    const range = h - l;

    const pp = (h + l + c) / 3;
    const classic: Levels = {
      r3: h + 2 * (pp - l),
      r2: pp + range,
      r1: 2 * pp - l,
      pp,
      s1: 2 * pp - h,
      s2: pp - range,
      s3: l - 2 * (h - pp),
    };
    const fib: Levels = {
      r3: pp + 1.0 * range,
      r2: pp + 0.618 * range,
      r1: pp + 0.382 * range,
      pp,
      s1: pp - 0.382 * range,
      s2: pp - 0.618 * range,
      s3: pp - 1.0 * range,
    };

    const payload = {
      symbol,
      date: new Date(ref.t * 1000).toISOString().slice(0, 10),
      high: h,
      low: l,
      close: c,
      classic,
      fib,
    };
    cache.set(symbol, { data: payload, at: Date.now() });
    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 200 });
  }
}
