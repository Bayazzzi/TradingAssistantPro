"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import InfoHint from "@/components/InfoHint";
import type { Trend, TrendRow } from "@/app/api/trendscan/route";

function TrendChip({ v }: { v: Trend }) {
  const { t } = useI18n();
  const meta =
    v === "up"
      ? { icon: "▲", color: "text-up bg-up/10", label: t("trend.up") }
      : v === "down"
      ? { icon: "▼", color: "text-down bg-down/10", label: t("trend.down") }
      : { icon: "▬", color: "text-fg-faint bg-fg/5", label: t("trend.flat") };
  return (
    <span className={`chip ${meta.color} justify-center w-full`} title={meta.label}>
      {meta.icon}
    </span>
  );
}

export default function TrendScanner() {
  const { t } = useI18n();
  const [rows, setRows] = useState<TrendRow[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/trendscan", { cache: "no-store" });
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
    const id = setInterval(load, 15 * 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <section className="card p-5">
      <h2 className="text-sm font-semibold text-fg tracking-wide uppercase mb-1">{t("trend.title")}</h2>
      <p className="text-[11px] text-fg-faint mb-4">{t("trend.subtitle")}</p>

      {status === "loading" && <p className="text-sm text-fg-faint animate-pulse">{t("trend.loading")}</p>}
      {status === "error" && <p className="text-sm text-fg-faint">{t("trend.error")}</p>}

      {status === "ok" && (
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full min-w-[380px] text-sm">
            <thead>
              <tr className="text-[11px] text-fg-faint uppercase tracking-wide">
                <th className="text-left font-medium py-1.5 pl-1">{t("trend.instrument")}</th>
                <th className="text-center font-medium py-1.5 w-16">D1</th>
                <th className="text-center font-medium py-1.5 w-16">H4</th>
                <th className="text-center font-medium py-1.5 w-16">H1</th>
                <th className="text-center font-medium py-1.5 w-24 pr-1">{t("trend.confluence")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.symbol}
                  className={`border-t border-border/60 ${r.aligned ? "bg-accent/5" : ""}`}
                >
                  <td className="py-2 pl-1 font-semibold text-fg">{r.label}</td>
                  <td className="py-1.5 px-1">
                    <TrendChip v={r.d1} />
                  </td>
                  <td className="py-1.5 px-1">
                    <TrendChip v={r.h4} />
                  </td>
                  <td className="py-1.5 px-1">
                    <TrendChip v={r.h1} />
                  </td>
                  <td className="py-1.5 pr-1 text-center">
                    {r.aligned && <span className="chip bg-accent/15 text-accent">⚡ {t("trend.alignedShort")}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <InfoHint items={[t("hint.trend.1"), t("hint.trend.2")]} />
    </section>
  );
}
