import { NextResponse } from "next/server";

// Economic calendar via the public ForexFactory weekly JSON feed.
// This replaces the original app's fragile investing.com HTML scraping with a
// stable JSON source that returns the whole week with impact levels.
//
// The upstream feed rate-limits aggressive polling (429), so we keep a small
// in-memory cache and only hit it at most once every few minutes per instance.
export const dynamic = "force-dynamic";

const FEED = "https://nfs.faireconomy.media/ff_calendar_thisweek.json";
const TTL_MS = 10 * 60 * 1000; // serve cached data for 10 minutes

interface FFEvent {
  title: string;
  country: string;
  date: string; // ISO with offset
  impact: "High" | "Medium" | "Low" | "Holiday";
  forecast: string;
  previous: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  currency: string;
  time: string; // ISO
  impact: "High" | "Medium" | "Low" | "Holiday";
  forecast: string;
  previous: string;
}

// Module-scoped cache survives across requests on a warm serverless instance.
let cache: { events: CalendarEvent[]; fetchedAt: number } | null = null;
let inflight: Promise<CalendarEvent[]> | null = null;

async function fetchFeed(): Promise<CalendarEvent[]> {
  const res = await fetch(FEED, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`feed status ${res.status}`);
  const raw = (await res.json()) as FFEvent[];
  return raw
    .filter((e) => e && e.date)
    .map((e, i) => ({
      id: `${e.country}-${e.date}-${i}`,
      title: e.title,
      currency: e.country,
      time: new Date(e.date).toISOString(),
      impact: e.impact,
      forecast: e.forecast ?? "",
      previous: e.previous ?? "",
    }));
}

async function getEvents(): Promise<{ events: CalendarEvent[]; cached: boolean }> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < TTL_MS) {
    return { events: cache.events, cached: true };
  }
  // Coalesce concurrent misses into a single upstream request.
  if (!inflight) {
    inflight = fetchFeed()
      .then((events) => {
        cache = { events, fetchedAt: Date.now() };
        return events;
      })
      .finally(() => {
        inflight = null;
      });
  }
  try {
    const events = await inflight;
    return { events, cached: false };
  } catch (err) {
    // On failure, fall back to any stale cache we still have.
    if (cache) return { events: cache.events, cached: true };
    throw err;
  }
}

export async function GET() {
  try {
    const { events } = await getEvents();
    return NextResponse.json(
      { events, updatedAt: new Date().toISOString(), source: "forexfactory" },
      { headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=1800" } }
    );
  } catch (err) {
    return NextResponse.json(
      { events: [], error: (err as Error).message, updatedAt: new Date().toISOString() },
      { status: 200 }
    );
  }
}
