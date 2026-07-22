"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import InfoHint from "@/components/InfoHint";
import PriceChart from "@/components/PriceChart";
import type { OverviewRow } from "@/app/api/overview/route";

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return <span className="text-fg-subtle">—</span>;
  const w = 80;
  const h = 22;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const up = points[points.length - 1] >= points[0];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} preserveAspectRatio="none" className="inline-block align-middle">
      <path d={path} fill="none" stroke={up ? "#26d07c" : "#ff5c6c"} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Pct({ v }: { v: number | null }) {
  if (v === null) return <span className="text-fg-subtle font-mono text-xs">—</span>;
  const up = v >= 0;
  return (
    <span className={`font-mono text-xs ${up ? "text-up" : "text-down"}`}>
      {up ? "+" : ""}
      {v.toFixed(2)}%
    </span>
  );
}

// Volatility badge — colored by how energetic the instrument is right now.
function Vol({ atrPct }: { atrPct: number | null }) {
  if (atrPct === null) return <span className="text-fg-subtle font-mono text-xs">—</span>;
  const tone = atrPct >= 3 ? "text-down" : atrPct >= 1.2 ? "text-warn" : "text-fg-muted";
  return <span className={`font-mono text-xs ${tone}`}>{atrPct.toFixed(2)}%</span>;
}

export default function MarketOverview() {
  const { t } = useI18n();
  const [rows, setRows] = useState<OverviewRow[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [chart, setChart] = useState<OverviewRow | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/overview", { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;
        if (Array.isArray(data.rows) && data.rows.length) {
          setRows(data.rows);
          setStatus("ok");
        } else {
          setStatus("error");
        }
      } catch {
        if (alive) setStatus("error");
      }
    };
    load();
    const id = setInterval(load, 5 * 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <section className="card p-5">
      <h2 className="text-sm font-semibold text-fg tracking-wide uppercase mb-1">{t("ov.title")}</h2>
      <p className="text-[11px] text-fg-faint mb-4">{t("ov.subtitle")}</p>

      {status === "loading" && <p className="text-sm text-fg-faint animate-pulse">{t("ov.loading")}</p>}
      {status === "error" && <p className="text-sm text-fg-faint">{t("ov.error")}</p>}

      {status === "ok" && (
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-[11px] text-fg-faint uppercase tracking-wide">
                <th className="text-left font-medium py-1.5 pl-1">{t("ov.instrument")}</th>
                <th className="text-right font-medium py-1.5">{t("ov.price")}</th>
                <th className="text-right font-medium py-1.5">1D</th>
                <th className="text-right font-medium py-1.5">1W</th>
                <th className="text-right font-medium py-1.5">1M</th>
                <th className="text-right font-medium py-1.5">YTD</th>
                <th className="text-right font-medium py-1.5" title={t("ov.volHint")}>
                  {t("ov.vol")}
                </th>
                <th className="text-right font-medium py-1.5 pr-1">{t("ov.trend")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.symbol}
                  onClick={() => setChart(r)}
                  className="border-t border-border/60 hover:bg-bg-hover/50 transition-colors cursor-pointer"
                  title={t("chart.open")}
                >
                  <td className="py-2 pl-1 font-semibold text-fg">{r.label}</td>
                  <td className="py-2 text-right font-mono text-fg">
                    {r.price.toLocaleString("en-US", {
                      minimumFractionDigits: r.decimals,
                      maximumFractionDigits: r.decimals,
                    })}
                  </td>
                  <td className="py-2 text-right">
                    <Pct v={r.d1} />
                  </td>
                  <td className="py-2 text-right">
                    <Pct v={r.w1} />
                  </td>
                  <td className="py-2 text-right">
                    <Pct v={r.m1} />
                  </td>
                  <td className="py-2 text-right">
                    <Pct v={r.ytd} />
                  </td>
                  <td className="py-2 text-right">
                    <Vol atrPct={r.atrPct} />
                  </td>
                  <td className="py-2 pr-1 text-right">
                    <Sparkline points={r.spark} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <InfoHint items={[t("hint.ov.1"), t("hint.ov.2"), t("hint.ov.3"), t("hint.ov.4")]} />

      {chart && (
        <PriceChart
          symbol={chart.symbol}
          label={chart.label}
          decimals={chart.decimals}
          onClose={() => setChart(null)}
        />
      )}
    </section>
  );
}
