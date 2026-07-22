"use client";

import { useEffect, useState } from "react";
import type { Quote } from "@/lib/instruments";

function QuoteItem({ q }: { q: Quote }) {
  const up = q.changePct >= 0;
  return (
    <span className="inline-flex items-center gap-2 px-5 border-r border-border/60">
      <span className="font-semibold text-gray-200">{q.label}</span>
      <span className="font-mono text-gray-100">
        {q.price.toLocaleString("en-US", {
          minimumFractionDigits: q.decimals,
          maximumFractionDigits: q.decimals,
        })}
      </span>
      <span className={`font-mono text-xs ${up ? "text-up" : "text-down"}`}>
        {up ? "▲" : "▼"} {Math.abs(q.changePct).toFixed(2)}%
      </span>
    </span>
  );
}

export default function Ticker() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [status, setStatus] = useState<"loading" | "live" | "error">("loading");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/quotes", { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;
        if (Array.isArray(data.quotes) && data.quotes.length) {
          setQuotes(data.quotes);
          setStatus("live");
        } else {
          setStatus("error");
        }
      } catch {
        if (alive) setStatus("error");
      }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="h-9 flex items-center px-4 bg-black/60 border-b border-border text-sm text-gray-500">
        <span className="animate-pulse">Loading market data…</span>
      </div>
    );
  }

  if (status === "error" || quotes.length === 0) {
    return (
      <div className="h-9 flex items-center px-4 bg-black/60 border-b border-border text-sm text-gray-500">
        Market feed unavailable — retrying…
      </div>
    );
  }

  // Duplicate the list so the marquee loops seamlessly (-50% translate).
  const doubled = [...quotes, ...quotes];

  return (
    <div className="h-9 flex items-center bg-black/60 border-b border-border overflow-hidden group">
      <div className="marquee-track animate-marquee group-hover:no-marquee-anim text-sm">
        {doubled.map((q, i) => (
          <QuoteItem key={`${q.symbol}-${i}`} q={q} />
        ))}
      </div>
    </div>
  );
}
