import { NextResponse } from "next/server";
import { COT_MARKETS as MARKETS } from "@/lib/cotMarkets";

// Commitment of Traders (COT): how large speculators (non-commercials) are
// positioned in the major futures, from the CFTC's public Socrata dataset.
// Net = long − short; we also compute the week-over-week change in net, which
// is the signal swing traders actually watch.
export const dynamic = "force-dynamic";

const TTL_MS = 6 * 60 * 60 * 1000; // COT publishes weekly (Fridays) — 6h cache is plenty
const DATASET = "https://publicreporting.cftc.gov/resource/6dca-aqww.json";

export interface CotRow {
  label: string;
  long: number;
  short: number;
  net: number;
  netPrev: number;
  change: number; // net − netPrev
  date: string;
}

interface Raw {
  contract_market_name: string;
  report_date_as_yyyy_mm_dd: string;
  noncomm_positions_long_all: string;
  noncomm_positions_short_all: string;
}

let cache: { rows: CotRow[]; date: string | null; at: number } | null = null;
let inflight: Promise<{ rows: CotRow[]; date: string | null }> | null = null;

async function build(): Promise<{ rows: CotRow[]; date: string | null }> {
  const names = MARKETS.map((m) => `'${m.cftc.replace(/'/g, "''")}'`).join(",");
  // Pull the most recent ~8 weeks for our markets, then take the latest two
  // reports per market to compute the week-over-week change.
  const where = encodeURIComponent(`contract_market_name in(${names})`);
  const url = `${DATASET}?$where=${where}&$order=report_date_as_yyyy_mm_dd DESC&$limit=400`;
  const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!res.ok) throw new Error(`cot status ${res.status}`);
  const raw = (await res.json()) as Raw[];

  const byMarket = new Map<string, Raw[]>();
  for (const r of raw) {
    const arr = byMarket.get(r.contract_market_name) ?? [];
    arr.push(r);
    byMarket.set(r.contract_market_name, arr);
  }

  const rows: CotRow[] = [];
  let latestDate: string | null = null;
  for (const m of MARKETS) {
    const arr = byMarket.get(m.cftc);
    if (!arr || !arr.length) continue;
    // Already ordered DESC by date from the query.
    const cur = arr[0];
    const prev = arr[1];
    const long = parseInt(cur.noncomm_positions_long_all, 10) || 0;
    const short = parseInt(cur.noncomm_positions_short_all, 10) || 0;
    const net = long - short;
    let netPrev = net;
    if (prev) {
      const pl = parseInt(prev.noncomm_positions_long_all, 10) || 0;
      const ps = parseInt(prev.noncomm_positions_short_all, 10) || 0;
      netPrev = pl - ps;
    }
    const date = cur.report_date_as_yyyy_mm_dd?.slice(0, 10) ?? "";
    if (!latestDate || date > latestDate) latestDate = date;
    rows.push({ label: m.label, long, short, net, netPrev, change: net - netPrev, date });
  }
  return { rows, date: latestDate };
}

export async function GET() {
  const now = Date.now();
  if (!cache || now - cache.at >= TTL_MS) {
    if (!inflight) {
      inflight = build()
        .then((result) => {
          if (result.rows.length) cache = { ...result, at: Date.now() };
          return result;
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
  if (!cache) {
    return NextResponse.json({ rows: [], date: null, error: "COT data unavailable" }, { status: 200 });
  }
  return NextResponse.json(
    { rows: cache.rows, date: cache.date, updatedAt: new Date(cache.at).toISOString() },
    { headers: { "Cache-Control": "s-maxage=21600, stale-while-revalidate=43200" } }
  );
}
