import { NextResponse } from "next/server";
import { cftcNameForLabel, COT_MARKETS } from "@/lib/cotMarkets";

// Detailed weekly COT history for a single market — the full table with
// long/short, weekly changes, net, net %, % of open interest and open
// interest, matching the COT-Reports.com layout. Same CFTC Socrata dataset.
export const dynamic = "force-dynamic";

const DATASET = "https://publicreporting.cftc.gov/resource/6dca-aqww.json";
const TTL_MS = 6 * 60 * 60 * 1000;
const WEEKS = 52;

export interface CotHistoryRow {
  date: string;
  long: number;
  short: number;
  changeLong: number;
  changeShort: number;
  net: number;
  netChange: number;
  netPctChange: number | null;
  pctOiLong: number;
  pctOiShort: number;
  openInterest: number;
}

interface Raw {
  report_date_as_yyyy_mm_dd: string;
  noncomm_positions_long_all: string;
  noncomm_positions_short_all: string;
  change_in_noncomm_long_all: string;
  change_in_noncomm_short_all: string;
  pct_of_oi_noncomm_long_all: string;
  pct_of_oi_noncomm_short_all: string;
  open_interest_all: string;
}

const cache = new Map<string, { rows: CotHistoryRow[]; at: number }>();

const numOf = (s: string | undefined) => {
  const n = parseFloat(s ?? "");
  return Number.isFinite(n) ? n : 0;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const label = searchParams.get("label") ?? "";
  const cftc = cftcNameForLabel(label);
  const meta = COT_MARKETS.find((m) => m.label === label);
  if (!cftc) {
    return NextResponse.json({ rows: [], error: "unknown market" }, { status: 400 });
  }

  const hit = cache.get(label);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return NextResponse.json({ label, unit: meta?.unit, rows: hit.rows });
  }

  try {
    const where = encodeURIComponent(`contract_market_name='${cftc.replace(/'/g, "''")}'`);
    const url = `${DATASET}?$where=${where}&$order=report_date_as_yyyy_mm_dd DESC&$limit=${WEEKS}`;
    const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!res.ok) throw new Error(`cot-history status ${res.status}`);
    const raw = (await res.json()) as Raw[];

    const rows: CotHistoryRow[] = raw.map((r) => {
      const long = numOf(r.noncomm_positions_long_all);
      const short = numOf(r.noncomm_positions_short_all);
      const changeLong = numOf(r.change_in_noncomm_long_all);
      const changeShort = numOf(r.change_in_noncomm_short_all);
      const net = long - short;
      const netChange = changeLong - changeShort;
      const prevNet = net - netChange;
      const netPctChange = prevNet !== 0 ? (netChange / Math.abs(prevNet)) * 100 : null;
      return {
        date: r.report_date_as_yyyy_mm_dd?.slice(0, 10) ?? "",
        long,
        short,
        changeLong,
        changeShort,
        net,
        netChange,
        netPctChange,
        pctOiLong: numOf(r.pct_of_oi_noncomm_long_all),
        pctOiShort: numOf(r.pct_of_oi_noncomm_short_all),
        openInterest: numOf(r.open_interest_all),
      };
    });
    // Oldest → newest for a natural top-to-bottom reading like the reference tables.
    rows.reverse();
    if (rows.length) cache.set(label, { rows, at: Date.now() });
    return NextResponse.json({ label, unit: meta?.unit, rows });
  } catch (err) {
    return NextResponse.json({ label, rows: [], error: (err as Error).message }, { status: 200 });
  }
}
