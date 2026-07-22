"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { alertNews } from "@/lib/sound";
import type { CalendarEvent } from "@/app/api/calendar/route";
import { useI18n } from "@/lib/i18n";

const IMPACT_META: Record<string, { color: string; label: string; rank: number }> = {
  High: { color: "text-down", label: "High", rank: 3 },
  Medium: { color: "text-warn", label: "Medium", rank: 2 },
  Low: { color: "text-fg-faint", label: "Low", rank: 1 },
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
                : "bg-fg-faint"
              : "bg-fg-subtle"
          }`}
        />
      ))}
    </span>
  );
}

export default function EconomicCalendar({ soundEnabled }: { soundEnabled: boolean }) {
  const { t, lang } = useI18n();
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

  const locale = lang === "ru" ? "ru-RU" : "en-GB";
  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  const fmtDay = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" });

  return (
    <section className="card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h2 className="text-sm font-semibold text-fg tracking-wide uppercase">{t("cal.title")}</h2>
        <div className="flex items-center gap-1.5">
          <div className="flex bg-bg-soft/60 p-0.5 rounded-lg text-xs">
            {(["today", "week"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`px-2.5 py-1 rounded-md ${
                  scope === s ? "bg-bg-hover text-fg" : "text-fg-faint"
                }`}
              >
                {s === "today" ? t("cal.today") : t("cal.week")}
              </button>
            ))}
          </div>
          <select
            className="input w-auto py-1 text-xs"
            value={minImpact}
            onChange={(e) => setMinImpact(Number(e.target.value))}
          >
            <option value={3}>{t("cal.highOnly")}</option>
            <option value={2}>{t("cal.mediumPlus")}</option>
            <option value={1}>{t("cal.all")}</option>
          </select>
          <button onClick={load} className="btn-ghost text-xs px-2.5 py-1" title="Refresh">
            ↻
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-1.5 max-h-[420px]">
        {status === "loading" && <p className="text-sm text-fg-faint animate-pulse">{t("cal.loading")}</p>}
        {status === "error" && <p className="text-sm text-fg-faint">{t("cal.error")}</p>}
        {status === "ok" && filtered.length === 0 && (
          <p className="text-sm text-fg-faint">{scope === "today" ? t("cal.emptyToday") : t("cal.empty")}</p>
        )}
        {filtered.map((e) => {
          const past = new Date(e.time).getTime() < Date.now();
          // ForexFactory's own JSON feed carries no per-event permalink, so a
          // scoped search is the closest thing to "open this event".
          const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
            `${e.currency} ${e.title} site:forexfactory.com`
          )}`;
          return (
            <a
              key={e.id}
              href={searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={t("cal.searchTitle")}
              className={`flex items-center gap-3 rounded-xl border border-border bg-bg-soft/40 px-3 py-2 hover:bg-bg-hover hover:border-accent/30 transition-colors cursor-pointer ${
                past ? "opacity-50" : ""
              }`}
            >
              <div className="w-14 shrink-0 text-right">
                <div className="font-mono text-sm text-fg">{fmtTime(e.time)}</div>
                {scope === "week" && <div className="text-[10px] text-fg-subtle">{fmtDay(e.time)}</div>}
              </div>
              <span className="chip bg-fg/5 text-fg-muted font-mono shrink-0 w-12 justify-center">
                {e.currency}
              </span>
              <Dots impact={e.impact} />
              <span className="text-sm text-fg-muted truncate flex-1" title={e.title}>
                {e.title}
              </span>
              {(e.forecast || e.previous) && (
                <span className="text-[11px] text-fg-faint font-mono shrink-0 hidden sm:block">
                  {e.forecast && <span>{t("cal.forecast")}: {e.forecast}</span>}
                  {e.previous && <span className="ml-2">{t("cal.previous")}: {e.previous}</span>}
                </span>
              )}
            </a>
          );
        })}
      </div>
      <p className="mt-3 text-[10px] text-fg-subtle">{t("cal.footer")}</p>
    </section>
  );
}
