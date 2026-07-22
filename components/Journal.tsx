"use client";

import { useMemo, useState } from "react";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { useI18n } from "@/lib/i18n";

interface Trade {
  id: string;
  date: string; // YYYY-MM-DD
  symbol: string;
  direction: "Long" | "Short";
  pnl: number; // in account currency
  rr: number | null; // realised R multiple, optional
  notes: string;
}

function StatTile({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" | "neutral" }) {
  const color = tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-gray-100";
  return (
    <div className="rounded-xl bg-bg-soft/60 border border-border px-3 py-2.5">
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className={`font-mono text-lg mt-0.5 ${color}`}>{value}</div>
    </div>
  );
}

const today = () => new Date().toISOString().slice(0, 10);

export default function Journal() {
  const { t } = useI18n();
  const [trades, setTrades] = useLocalStorage<Trade[]>("tap.journal", []);
  const [form, setForm] = useState({
    date: today(),
    symbol: "",
    direction: "Long" as "Long" | "Short",
    pnl: "",
    rr: "",
    notes: "",
  });

  const stats = useMemo(() => {
    const n = trades.length;
    const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
    const wins = trades.filter((t) => t.pnl > 0).length;
    const losses = trades.filter((t) => t.pnl < 0).length;
    const winRate = n ? (wins / n) * 100 : 0;
    const grossWin = trades.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
    const grossLoss = Math.abs(trades.filter((t) => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
    const profitFactor = grossLoss ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0;
    const rrTrades = trades.filter((t) => t.rr !== null);
    const avgR = rrTrades.length ? rrTrades.reduce((s, t) => s + (t.rr ?? 0), 0) / rrTrades.length : null;
    // Equity curve points
    let cum = 0;
    const curve = trades
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
      .map((t) => (cum += t.pnl));
    return { n, totalPnl, wins, losses, winRate, profitFactor, avgR, curve };
  }, [trades]);

  const add = () => {
    const pnl = parseFloat(form.pnl.replace(",", "."));
    if (!form.symbol.trim() || !Number.isFinite(pnl)) return;
    const rr = form.rr.trim() ? parseFloat(form.rr.replace(",", ".")) : null;
    const trade: Trade = {
      id: crypto.randomUUID(),
      date: form.date || today(),
      symbol: form.symbol.trim().toUpperCase(),
      direction: form.direction,
      pnl,
      rr: rr !== null && Number.isFinite(rr) ? rr : null,
      notes: form.notes.trim(),
    };
    setTrades((prev) => [trade, ...prev]);
    setForm({ date: today(), symbol: "", direction: "Long", pnl: "", rr: "", notes: "" });
  };

  const remove = (id: string) => setTrades((prev) => prev.filter((t) => t.id !== id));

  const clearAll = () => {
    if (confirm(t("jrn.confirmClear"))) setTrades([]);
  };

  const money = (v: number) =>
    `${v >= 0 ? "+" : "-"}$${Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-200 tracking-wide uppercase">{t("jrn.title")}</h2>
        {trades.length > 0 && (
          <button onClick={clearAll} className="btn-ghost text-xs px-2.5 py-1 text-down/80">
            {t("jrn.clearAll")}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <StatTile
          label={t("jrn.netPnl")}
          value={stats.n ? money(stats.totalPnl) : "—"}
          tone={stats.totalPnl > 0 ? "up" : stats.totalPnl < 0 ? "down" : "neutral"}
        />
        <StatTile label={t("jrn.winRate")} value={stats.n ? `${stats.winRate.toFixed(0)}%` : "—"} />
        <StatTile
          label={t("jrn.profitFactor")}
          value={stats.n ? (stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)) : "—"}
        />
        <StatTile label={t("jrn.avgR")} value={stats.avgR !== null ? `${stats.avgR.toFixed(2)}R` : "—"} />
      </div>

      {/* Equity curve */}
      {stats.curve.length > 1 && <EquityCurve points={stats.curve} label={t("jrn.equityCurve")} />}

      {/* Add form */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4 mt-4">
        <input
          type="date"
          className="input md:col-span-1"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <input
          className="input"
          placeholder={t("jrn.symbol")}
          value={form.symbol}
          onChange={(e) => setForm({ ...form, symbol: e.target.value })}
        />
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
          placeholder={t("jrn.pnl")}
          inputMode="decimal"
          value={form.pnl}
          onChange={(e) => setForm({ ...form, pnl: e.target.value })}
        />
        <input
          className="input"
          placeholder={t("jrn.rOpt")}
          inputMode="decimal"
          value={form.rr}
          onChange={(e) => setForm({ ...form, rr: e.target.value })}
        />
        <button onClick={add} className="btn-primary">
          {t("jrn.add")}
        </button>
      </div>
      <input
        className="input mb-4"
        placeholder={t("jrn.notes")}
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
        onKeyDown={(e) => e.key === "Enter" && add()}
      />

      {/* List */}
      {trades.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">{t("jrn.empty")}</p>
      ) : (
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto -mr-2 pr-2">
          {trades.map((tr) => (
            <div
              key={tr.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-bg-soft/40 px-3 py-2 group"
            >
              <span className="text-[11px] text-gray-600 font-mono w-16 shrink-0">{tr.date.slice(5)}</span>
              <span className="chip bg-white/5 text-gray-200 font-mono w-16 justify-center shrink-0">{tr.symbol}</span>
              <span className={`text-xs shrink-0 ${tr.direction === "Long" ? "text-up" : "text-down"}`}>
                {tr.direction === "Long" ? `▲ ${t("jrn.long")}` : `▼ ${t("jrn.short")}`}
              </span>
              <span className="text-xs text-gray-500 truncate flex-1">{tr.notes}</span>
              {tr.rr !== null && <span className="text-xs font-mono text-gray-500 shrink-0">{tr.rr.toFixed(1)}R</span>}
              <span
                className={`font-mono text-sm shrink-0 w-24 text-right ${tr.pnl >= 0 ? "text-up" : "text-down"}`}
              >
                {money(tr.pnl)}
              </span>
              <button
                onClick={() => remove(tr.id)}
                className="text-gray-600 hover:text-down text-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                title="Delete"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EquityCurve({ points, label }: { points: number[]; label: string }) {
  const w = 100;
  const h = 28;
  const min = Math.min(0, ...points);
  const max = Math.max(0, ...points);
  const range = max - min || 1;
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const last = points[points.length - 1];
  const positive = last >= 0;
  return (
    <div className="rounded-xl bg-bg-soft/60 border border-border p-3">
      <div className="text-[11px] text-gray-500 mb-1">{label}</div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-16">
        <line x1="0" y1={h - ((0 - min) / range) * h} x2={w} y2={h - ((0 - min) / range) * h} stroke="#26344a" strokeWidth="0.3" strokeDasharray="1,1" />
        <path d={path} fill="none" stroke={positive ? "#26d07c" : "#ff5c6c"} strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
