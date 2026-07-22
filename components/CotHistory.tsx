"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import type { CotHistoryRow } from "@/app/api/cot-history/route";

// Color helpers — replicate the COT-Reports heatmap feel.
// Sequential: intensity by position within [min,max]; hue fixed (green or red).
function seqBg(v: number, min: number, max: number, positive: boolean): string {
  const range = max - min || 1;
  const a = 0.12 + ((v - min) / range) * 0.6;
  return positive ? `rgba(38,208,124,${a.toFixed(2)})` : `rgba(255,92,108,${a.toFixed(2)})`;
}
// Diverging: green for positive, red for negative, intensity by |v|/maxAbs.
function divBg(v: number, maxAbs: number): string {
  const a = 0.12 + (Math.abs(v) / (maxAbs || 1)) * 0.6;
  return v >= 0 ? `rgba(38,208,124,${a.toFixed(2)})` : `rgba(255,92,108,${a.toFixed(2)})`;
}

interface Props {
  label: string;
  onClose: () => void;
}

const fmt = (n: number) => n.toLocaleString("en-US");
const signed = (n: number) => `${n >= 0 ? "+" : ""}${fmt(n)}`;

export default function CotHistory({ label, onClose }: Props) {
  const { t, lang } = useI18n();
  const [rows, setRows] = useState<CotHistoryRow[]>([]);
  const [unit, setUnit] = useState<string | undefined>();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    let alive = true;
    fetch(`/api/cot-history?label=${encodeURIComponent(label)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (Array.isArray(d.rows) && d.rows.length) {
          setRows(d.rows);
          setUnit(d.unit);
          setStatus("ok");
        } else {
          setStatus("error");
        }
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
  }, [label]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const ranges = useMemo(() => {
    const col = (sel: (r: CotHistoryRow) => number) => {
      const vals = rows.map(sel);
      return { min: Math.min(...vals), max: Math.max(...vals), maxAbs: Math.max(...vals.map(Math.abs), 1) };
    };
    if (!rows.length) return null;
    return {
      long: col((r) => r.long),
      short: col((r) => r.short),
      changeLong: col((r) => r.changeLong),
      changeShort: col((r) => r.changeShort),
      net: col((r) => r.net),
      netChange: col((r) => r.netChange),
      netPct: col((r) => r.netPctChange ?? 0),
      pctLong: col((r) => r.pctOiLong),
      pctShort: col((r) => r.pctOiShort),
      oi: col((r) => r.openInterest),
    };
  }, [rows]);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString(lang === "ru" ? "ru-RU" : "en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const cell = "px-2 py-1 text-right font-mono whitespace-nowrap";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div className="card w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="text-lg font-bold text-fg">
              {label} — {t("coth.title")}
            </h3>
            <p className="text-[11px] text-fg-faint">
              {t("coth.subtitle")}
              {unit ? ` · ${unit}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-border bg-bg-soft/60 text-fg-faint hover:text-fg hover:bg-bg-hover transition-colors shrink-0"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="overflow-auto p-2">
          {status === "loading" && <p className="text-sm text-fg-faint animate-pulse p-4">{t("coth.loading")}</p>}
          {status === "error" && <p className="text-sm text-fg-faint p-4">{t("coth.error")}</p>}

          {status === "ok" && ranges && (
            <table className="text-[11px] border-separate border-spacing-0.5 min-w-[820px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-bg-card text-fg-faint uppercase text-[10px]">
                  <th className="px-2 py-1.5 text-left">{t("coth.date")}</th>
                  <th className="px-2 py-1.5 text-right">{t("coth.long")}</th>
                  <th className="px-2 py-1.5 text-right">{t("coth.short")}</th>
                  <th className="px-2 py-1.5 text-right">{t("coth.chgLong")}</th>
                  <th className="px-2 py-1.5 text-right">{t("coth.chgShort")}</th>
                  <th className="px-2 py-1.5 text-right">{t("coth.net")}</th>
                  <th className="px-2 py-1.5 text-right">{t("coth.netChg")}</th>
                  <th className="px-2 py-1.5 text-right">{t("coth.netPct")}</th>
                  <th className="px-2 py-1.5 text-right">{t("coth.oiLong")}</th>
                  <th className="px-2 py-1.5 text-right">{t("coth.oiShort")}</th>
                  <th className="px-2 py-1.5 text-right">{t("coth.oi")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.date}>
                    <td className="px-2 py-1 text-left font-mono text-fg-muted whitespace-nowrap">{fmtDate(r.date)}</td>
                    <td className={`${cell} text-fg`} style={{ background: seqBg(r.long, ranges.long.min, ranges.long.max, true) }}>
                      {fmt(r.long)}
                    </td>
                    <td className={`${cell} text-fg`} style={{ background: seqBg(r.short, ranges.short.min, ranges.short.max, false) }}>
                      {fmt(r.short)}
                    </td>
                    <td className={`${cell} text-fg`} style={{ background: divBg(r.changeLong, ranges.changeLong.maxAbs) }}>
                      {signed(r.changeLong)}
                    </td>
                    <td className={`${cell} text-fg`} style={{ background: divBg(r.changeShort, ranges.changeShort.maxAbs) }}>
                      {signed(r.changeShort)}
                    </td>
                    <td className={`${cell} text-fg font-semibold`} style={{ background: divBg(r.net, ranges.net.maxAbs) }}>
                      {/* Arrow reflects the week-over-week direction of net, like COT-Reports. */}
                      {r.netChange >= 0 ? "▲ " : "▼ "}
                      {fmt(r.net)}
                    </td>
                    <td className={`${cell} text-fg`} style={{ background: divBg(r.netChange, ranges.netChange.maxAbs) }}>
                      {signed(r.netChange)}
                    </td>
                    <td className={`${cell} text-fg`} style={{ background: divBg(r.netPctChange ?? 0, ranges.netPct.maxAbs) }}>
                      {r.netPctChange === null ? "—" : `${r.netPctChange >= 0 ? "+" : ""}${r.netPctChange.toFixed(2)}%`}
                    </td>
                    <td className={`${cell} text-fg`} style={{ background: seqBg(r.pctOiLong, ranges.pctLong.min, ranges.pctLong.max, true) }}>
                      {r.pctOiLong.toFixed(1)}%
                    </td>
                    <td className={`${cell} text-fg`} style={{ background: seqBg(r.pctOiShort, ranges.pctShort.min, ranges.pctShort.max, false) }}>
                      {r.pctOiShort.toFixed(1)}%
                    </td>
                    <td className={`${cell} text-fg-muted`} style={{ background: seqBg(r.openInterest, ranges.oi.min, ranges.oi.max, true) }}>
                      {fmt(r.openInterest)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
