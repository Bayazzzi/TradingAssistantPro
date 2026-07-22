"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import InfoHint from "@/components/InfoHint";
import type { CotRow } from "@/app/api/cot/route";

// A long/short split bar for one market: green = long share, red = short share.
function SplitBar({ long, short }: { long: number; short: number }) {
  const total = long + short || 1;
  const longPct = (long / total) * 100;
  return (
    <div className="h-2 rounded-full overflow-hidden flex bg-bg-hover" title={`L ${long.toLocaleString()} / S ${short.toLocaleString()}`}>
      <div className="h-full bg-up/80" style={{ width: `${longPct}%` }} />
      <div className="h-full bg-down/80" style={{ width: `${100 - longPct}%` }} />
    </div>
  );
}

export default function CotPositioning() {
  const { t, lang } = useI18n();
  const [rows, setRows] = useState<CotRow[]>([]);
  const [date, setDate] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    let alive = true;
    fetch("/api/cot", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (Array.isArray(d.rows) && d.rows.length) {
          setRows(d.rows);
          setDate(d.date ?? null);
          setStatus("ok");
        } else {
          setStatus("error");
        }
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
  }, []);

  const fmt = (n: number) => n.toLocaleString(lang === "ru" ? "ru-RU" : "en-US");
  const signed = (n: number) => `${n >= 0 ? "+" : ""}${fmt(n)}`;

  return (
    <section className="card p-5">
      <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
        <h2 className="text-sm font-semibold text-fg tracking-wide uppercase">{t("cot.title")}</h2>
        {date && (
          <span className="text-[10px] text-fg-subtle">
            {t("cot.reportDate")}: {new Date(date).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-GB")}
          </span>
        )}
      </div>
      <p className="text-[11px] text-fg-faint mb-4">{t("cot.subtitle")}</p>

      {status === "loading" && <p className="text-sm text-fg-faint animate-pulse">{t("cot.loading")}</p>}
      {status === "error" && <p className="text-sm text-fg-faint">{t("cot.error")}</p>}

      {status === "ok" && (
        <div className="space-y-2.5">
          {rows.map((r) => {
            const bullish = r.net >= 0;
            return (
              <div key={r.label} className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3">
                <span className="font-semibold text-sm text-fg">{r.label}</span>
                <div>
                  <SplitBar long={r.long} short={r.short} />
                  <div className="flex items-center justify-between mt-1 text-[10px] text-fg-subtle font-mono">
                    <span>{t("cot.long")} {fmt(r.long)}</span>
                    <span>{t("cot.short")} {fmt(r.short)}</span>
                  </div>
                </div>
                <div className="text-right w-24">
                  <div className={`font-mono text-sm ${bullish ? "text-up" : "text-down"}`}>
                    {signed(r.net)}
                  </div>
                  <div
                    className={`text-[10px] font-mono ${
                      r.change > 0 ? "text-up" : r.change < 0 ? "text-down" : "text-fg-subtle"
                    }`}
                  >
                    {signed(r.change)} {t("cot.wow")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <InfoHint items={[t("hint.cot.1"), t("hint.cot.2")]} />
    </section>
  );
}
