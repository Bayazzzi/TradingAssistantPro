import { NextResponse } from "next/server";

// Market news headlines aggregated from public RSS feeds. This is the "open
// the actual news" panel: real headlines that link out to the source. Parsed
// server-side (RSS is XML) and cached in-memory.
export const dynamic = "force-dynamic";

const TTL_MS = 10 * 60 * 1000;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const FEEDS: Array<{ url: string; source: string }> = [
  { url: "https://www.investing.com/rss/news.rss", source: "Investing.com" },
  { url: "https://www.fxstreet.com/rss/news", source: "FXStreet" },
];

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  time: string; // ISO
}

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1] : null;
}

function parseFeed(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  for (const b of blocks) {
    const title = tag(b, "title");
    const link = tag(b, "link");
    const date = tag(b, "pubDate");
    if (!title || !link) continue;
    const t = date ? new Date(decode(date)) : new Date();
    items.push({
      title: decode(title),
      link: decode(link),
      source,
      time: (isNaN(t.getTime()) ? new Date() : t).toISOString(),
    });
  }
  return items;
}

async function fetchFeed(url: string, source: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml" }, cache: "no-store" });
    if (!res.ok) return [];
    return parseFeed(await res.text(), source);
  } catch {
    return [];
  }
}

let cache: { items: NewsItem[]; at: number } | null = null;
let inflight: Promise<NewsItem[]> | null = null;

async function build(): Promise<NewsItem[]> {
  const lists = await Promise.all(FEEDS.map((f) => fetchFeed(f.url, f.source)));
  const merged = lists.flat();
  // Dedupe by link, sort newest first, cap the list.
  const seen = new Set<string>();
  const unique = merged.filter((i) => (seen.has(i.link) ? false : (seen.add(i.link), true)));
  unique.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  return unique.slice(0, 30);
}

export async function GET() {
  const now = Date.now();
  if (!cache || now - cache.at >= TTL_MS) {
    if (!inflight) {
      inflight = build()
        .then((items) => {
          if (items.length) cache = { items, at: Date.now() };
          return items;
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
    { items: cache?.items ?? [], updatedAt: cache ? new Date(cache.at).toISOString() : null },
    { headers: { "Cache-Control": "no-store" } }
  );
}
