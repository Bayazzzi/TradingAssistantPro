"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { useI18n } from "@/lib/i18n";
import InfoHint from "@/components/InfoHint";

// Same labels as /api/correlation, so open positions can be matched against
// the correlation matrix for a same-page risk-overlap warning.
const SYMBOLS = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD", "GOLD", "OIL", "BTC", "S&P 500"];

interface Position {
  id: string;
  symbol: string;
  direction: "Long" | "Short";
  riskUsd: number;
  notes: string;
}

interface CorrData {
  labels: string[];
  matrix: number[][];
}

export default function RiskPanel() {
  const { t } = useI18n();
  const [positions, setPositions] = useLocalStorage<Position[]>("tap.openPositions", []);
  const [balance, setBalance] = useLocalStorage<string>("tap.openPositions.balance", "10000");
  const [form, setForm] = useState({ symbol: SYMBOLS[0], direction: "Long" as "Long" | "Short", riskUsd: "", notes: "" });
  const [corr, setCorr] = useState<CorrData | null>(null);

  useEffect(() => {
    fetch("/api/correlation", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.labels?.length) setCorr({ labels: d.labels, matrix: d.matrix });
      })
      .catch(() => {});
  }, []);

  const add = () => {
    const risk = parseFloat(form.riskUsd.replace(",", "."));
    if (!Number.isFinite(risk) || risk <= 0) return;
    const pos: Position = {
      id: crypto.randomUUID(),
      symbol: form.symbol,
      direction: form.direction,
      riskUsd: risk,
      notes: form.notes.trim(),
    };
    setPositions((prev) => [pos, ...prev]);
    setForm({ symbol: SYMBOLS[0], direction: "Long", riskUsd: "", notes: "" });
  };

  const remove = (id: string) => setPositions((prev) => prev.filter((p) => p.id !== id));

  const totalRisk = useMemo(() => positions.reduce((s, p) => s + p.riskUsd, 0), [positions]);
  const balNum = parseFloat(balance.replace(",", "."));
  const totalRiskPct = Number.isFinite(balNum) && balNum > 0 ? (totalRisk / balNum) * 100 : null;

  // Pairwise correlation warnings between distinct symbols currently open.
  const warnings = useMemo(() => {
    if (!corr) return [];
    const out: Array<{ a: string; b: string; value: number }> = [];
    const uniqueSymbols = Array.from(new Set(positions.map((p) => p.symbol)));
    for (let i = 0; i < uniqueSymbols.length; i++) {
      for (let j = i + 1; j < uniqueSymbols.length; j++) {
        const ai = corr.labels.indexOf(uniqueSymbols[i]);
        const bi = corr.labels.indexOf(uniqueSymbols[j]);
        if (ai === -1 || bi === -1) continue;
        const v = corr.matrix[ai][bi];
        if (Math.abs(v) >= 0.6) out.push({ a: uniqueSymbols[i], b: uniqueSymbols[j], value: v });
      }
    }
    return out;
  }, [corr, positions]);

  const riskTone = totalRiskPct === null ? "" : totalRiskPct >= 6 ? "text-down" : totalRiskPct >= 3 ? "text-warn" : "text-up";

  return (
    <section className="card p-5">
      <h2 className="text-sm font-semibold text-fg tracking-wide uppercase mb-1">{t("risk.title")}</h2>
      <p className="text-[11px] text-fg-faint mb-4">{t("risk.subtitle")}</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl bg-bg-soft/60 border border-border px-3 py-2.5">
          <div className="text-[11px] text-fg-faint">{t("risk.totalRisk")}</div>
          <div className="font-mono text-lg mt-0.5 text-fg">${totalRisk.toFixed(2)}</div>
        </div>
        <div className="rounded-xl bg-bg-soft/60 border border-border px-3 py-2.5">
          <div className="text-[11px] text-fg-faint">{t("risk.pctOfBalance")}</div>
          <div className={`font-mono text-lg mt-0.5 ${riskTone}`}>
            {totalRiskPct !== null ? `${totalRiskPct.toFixed(1)}%` : "—"}
          </div>
        </div>
        <div>
          <label className="label">{t("risk.balance")}</label>
          <input className="input" value={balance} onChange={(e) => setBalance(e.target.value)} inputMode="decimal" />
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="space-y-1.5 mb-4">
          {warnings.map((w, i) => (
            <div key={i} className="text-xs rounded-lg bg-warn/10 text-warn px-3 py-2">
              ⚠ {w.a} × {w.b}: {t("risk.correlated")} ({w.value >= 0 ? "+" : ""}
              {w.value.toFixed(2)})
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        <select className="input" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })}>
          {SYMBOLS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={form.direction}
          onChange={(e) => setForm({ ...form, direction: e.target.value as "Long" | "Short" })}
        >
          <option value="Long">{t("jrn.long")}</option>
          <option value="Short">{t("jrn.short")}</option>
        </select>
        <input
          className="input"
          placeholder={t("risk.riskAmount")}
          inputMode="decimal"
          value={form.riskUsd}
          onChange={(e) => setForm({ ...form, riskUsd: e.target.value })}
        />
        <input
          className="input md:col-span-1"
          placeholder={t("jrn.notes")}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button onClick={add} className="btn-primary">
          {t("jrn.add")}
        </button>
      </div>

      {positions.length === 0 ? (
        <p className="text-sm text-fg-faint text-center py-4">{t("risk.empty")}</p>
      ) : (
        <div className="space-y-1.5">
          {positions.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border bg-bg-soft/40 px-3 py-2 group">
              <span className="chip bg-fg/5 text-fg font-mono w-20 justify-center shrink-0">{p.symbol}</span>
              <span className={`text-xs shrink-0 ${p.direction === "Long" ? "text-up" : "text-down"}`}>
                {p.direction === "Long" ? `▲ ${t("jrn.long")}` : `▼ ${t("jrn.short")}`}
              </span>
              <span className="text-xs text-fg-faint truncate flex-1">{p.notes}</span>
              <span className="font-mono text-sm text-fg shrink-0">${p.riskUsd.toFixed(2)}</span>
              <button
                onClick={() => remove(p.id)}
                className="text-fg-subtle hover:text-down text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      <InfoHint items={[t("hint.risk.1"), t("hint.risk.2")]} />
    </section>
  );
}
