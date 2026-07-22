"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import InfoHint from "@/components/InfoHint";
import { TICKER_INSTRUMENTS } from "@/lib/instruments";
import type { TimingCell } from "@/app/api/timing/route";

// Mon-Fri only — weekend cells for FX/futures are near-empty/noise.
const WEEKDAYS = [1, 2, 3, 4, 5];

export default function TimingHeatmap() {
  const { t, lang } = useI18n();
  const [symbol, setSymbol] = useState(TICKER_INSTRUMENTS[0].symbol);
  const [cells, setCells] = useState<TimingCell[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    fetch(`/api/timing?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (Array.isArray(d.cells) && d.cells.length) {
          setCells(d.cells);
          setStatus("ok");
        } else {
          setStatus("error");
        }
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
  }, [symbol]);

  const grid = useMemo(() => {
    const map = new Map<string, number>();
    let max = 0;
    cells.forEach((c) => {
      map.set(`${c.weekday}-${c.hour}`, c.avgRangePct);
      if (c.avgRangePct > max) max = c.avgRangePct;
    });
    return { map, max: max || 1 };
  }, [cells]);

  const top3 = useMemo(() => [...cells].sort((a, b) => b.avgRangePct - a.avgRangePct).slice(0, 3), [cells]);

  const dayLabel = (wd: number) => {
    const names =
      lang === "ru"
        ? ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"]
        : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return names[wd];
  };

  return (
    <section className="card p-5">
      <h2 className="text-sm font-semibold text-fg tracking-wide uppercase mb-1">{t("timing.title")}</h2>
      <p className="text-[11px] text-fg-faint mb-4">{t("timing.subtitle")}</p>

      <div className="mb-3">
        <select className="input w-auto" value={symbol} onChange={(e) => setSymbol(e.target.value)}>
          {TICKER_INSTRUMENTS.map((i) => (
            <option key={i.symbol} value={i.symbol}>
              {i.label}
            </option>
          ))}
        </select>
      </div>

      {status === "loading" && <p className="text-sm text-fg-faint animate-pulse">{t("timing.loading")}</p>}
      {status === "error" && <p className="text-sm text-fg-faint">{t("timing.error")}</p>}

      {status === "ok" && (
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="border-collapse text-[10px] w-full min-w-[520px]">
            <thead>
              <tr>
                <th className="w-8"></th>
                {WEEKDAYS.map((wd) => (
                  <th key={wd} className="px-0.5 py-1 font-normal text-fg-faint">
                    {dayLabel(wd)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 24 }, (_, hour) => hour).map((hour) => (
                <tr key={hour}>
                  <td className="text-right pr-1 text-fg-subtle font-mono">{hour.toString().padStart(2, "0")}</td>
                  {WEEKDAYS.map((wd) => {
                    const v = grid.map.get(`${wd}-${hour}`);
                    const a = v !== undefined ? 0.08 + (v / grid.max) * 0.85 : 0;
                    return (
                      <td
                        key={wd}
                        className="p-0.5"
                        title={v !== undefined ? `${dayLabel(wd)} ${hour}:00 UTC — ${v.toFixed(3)}%` : ""}
                      >
                        <div
                          className="h-4 rounded-sm"
                          style={{ background: v !== undefined ? `rgba(245,158,11,${a.toFixed(2)})` : "rgba(120,120,120,0.05)" }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-fg-subtle mt-2">{t("timing.axisNote")}</p>

          {top3.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {top3.map((c, i) => (
                <span key={i} className="chip bg-warn/10 text-warn">
                  🔥 {dayLabel(c.weekday)} {c.hour.toString().padStart(2, "0")}:00 UTC — {c.avgRangePct.toFixed(3)}%
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      <InfoHint items={[t("hint.timing.1"), t("hint.timing.2")]} />
    </section>
  );
}
