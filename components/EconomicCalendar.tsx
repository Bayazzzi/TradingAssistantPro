"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { alertNews } from "@/lib/sound";
import type { CalendarEvent } from "@/app/api/calendar/route";

const IMPACT_META: Record<string, { color: string; label: string; rank: number }> = {
  High: { color: "text-down", label: "High", rank: 3 },
  Medium: { color: "text-warn", label: "Medium", rank: 2 },
  Low: { color: "text-gray-500", label: "Low", rank: 1 },
  Holiday: { color: "text-blue-400", label: "Holiday", rank: 0 },
};

function Dots({ impact }: { impact: string }) {
  const rank = IMPACT_META[impact]?.rank ?? 0;
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i <= rank
              ? impact === "High"
                ? "bg-down"
                : impact === "Medium"
                ? "bg-warn"
                : "bg-gray-500"
              : "bg-gray-700"
          }`}
        />
      ))}
    </span>
  );
}

export default function EconomicCalendar({ soundEnabled }: { soundEnabled: boolean }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [minImpact, setMinImpact] = useState<number>(2); // default: medium+
  const [scope, setScope] = useState<"today" | "week">("today");
  const alerted = useRef<Set<string>>(new Set());

  const load = async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/calendar", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data.events)) {
        setEvents(data.events);
        setStatus(data.events.length ? "ok" : "error");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 15 * 60_000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    return events
      .filter((e) => (IMPACT_META[e.impact]?.rank ?? 0) >= minImpact)
      .filter((e) => {
        const d = new Date(e.time);
        if (scope === "today") return d.toDateString() === todayStr;
        return d >= new Date(now.getTime() - 60 * 60 * 1000); // week: upcoming
      })
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }, [events, minImpact, scope]);

  // Alert for imminent (±1 min) high-impact events.
  useEffect(() => {
    if (!soundEnabled) return;
    const check = () => {
      const now = Date.now();
      events.forEach((e) => {
        if (e.impact !== "High") return;
        const t = new Date(e.time).getTime();
        const diff = t - now;
        if (diff >= -60_000 && diff <= 60_000 && !alerted.current.has(e.id)) {
          alerted.current.add(e.id);
          alertNews();
        }
      });
    };
    const id = setInterval(check, 20_000);
    return () => clearInterval(id);
  }, [events, soundEnabled]);

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const fmtDay = (iso: string) =>
    new Date(iso).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });

  return (
    <section className="card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h2 className="text-sm font-semibold text-gray-200 tracking-wide uppercase">Economic Calendar</h2>
        <div className="flex items-center gap-1.5">
          <div className="flex bg-bg-soft/60 p-0.5 rounded-lg text-xs">
            {(["today", "week"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`px-2.5 py-1 rounded-md capitalize ${
                  scope === s ? "bg-bg-hover text-gray-100" : "text-gray-500"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <select
            className="input w-auto py-1 text-xs"
            value={minImpact}
            onChange={(e) => setMinImpact(Number(e.target.value))}
          >
            <option value={3}>High only</option>
            <option value={2}>Medium+</option>
            <option value={1}>All</option>
          </select>
          <button onClick={load} className="btn-ghost text-xs px-2.5 py-1" title="Refresh">
            ↻
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-1.5 max-h-[420px]">
        {status === "loading" && <p className="text-sm text-gray-500 animate-pulse">Loading events…</p>}
        {status === "error" && (
          <p className="text-sm text-gray-500">
            Calendar feed is unavailable right now. Try refreshing in a moment.
          </p>
        )}
        {status === "ok" && filtered.length === 0 && (
          <p className="text-sm text-gray-500">No events match this filter{scope === "today" ? " today" : ""}.</p>
        )}
        {filtered.map((e) => {
          const past = new Date(e.time).getTime() < Date.now();
          return (
            <div
              key={e.id}
              className={`flex items-center gap-3 rounded-xl border border-border bg-bg-soft/40 px-3 py-2 ${
                past ? "opacity-50" : ""
              }`}
            >
              <div className="w-14 shrink-0 text-right">
                <div className="font-mono text-sm text-gray-200">{fmtTime(e.time)}</div>
                {scope === "week" && <div className="text-[10px] text-gray-600">{fmtDay(e.time)}</div>}
              </div>
              <span className="chip bg-white/5 text-gray-300 font-mono shrink-0 w-12 justify-center">
                {e.currency}
              </span>
              <Dots impact={e.impact} />
              <span className="text-sm text-gray-300 truncate flex-1" title={e.title}>
                {e.title}
              </span>
              {(e.forecast || e.previous) && (
                <span className="text-[11px] text-gray-500 font-mono shrink-0 hidden sm:block">
                  {e.forecast && <span>F: {e.forecast}</span>}
                  {e.previous && <span className="ml-2">P: {e.previous}</span>}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[10px] text-gray-600">Times shown in your local timezone · source: ForexFactory</p>
    </section>
  );
}
