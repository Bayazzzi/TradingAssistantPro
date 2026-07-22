"use client";

import { useMemo, useState } from "react";
import { ASSET_PRESETS } from "@/lib/instruments";

function num(v: string): number {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-bg-soft/60 border border-border px-3 py-2.5">
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className={`font-mono text-lg mt-0.5 ${accent ? "text-accent" : "text-gray-100"}`}>{value}</div>
    </div>
  );
}

function PositionSizeCalc() {
  const [asset, setAsset] = useState(ASSET_PRESETS[0].id);
  const [balance, setBalance] = useState("10000");
  const [risk, setRisk] = useState("1");
  const [sl, setSl] = useState("20");

  const preset = ASSET_PRESETS.find((p) => p.id === asset)!;
  const result = useMemo(() => {
    const b = num(balance);
    const r = num(risk);
    const s = num(sl);
    if ([b, r, s].some((x) => !Number.isFinite(x)) || s <= 0) return null;
    const riskMoney = b * (r / 100);
    const lot = riskMoney / (s * preset.valuePerPointPerLot);
    return { riskMoney, lot };
  }, [balance, risk, sl, preset]);

  return (
    <div className="space-y-3">
      <div>
        <label className="label">Asset type</label>
        <select className="input" value={asset} onChange={(e) => setAsset(e.target.value)}>
          {ASSET_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="label">Balance $</label>
          <input className="input" value={balance} onChange={(e) => setBalance(e.target.value)} inputMode="decimal" />
        </div>
        <div>
          <label className="label">Risk %</label>
          <input className="input" value={risk} onChange={(e) => setRisk(e.target.value)} inputMode="decimal" />
        </div>
        <div>
          <label className="label">Stop-loss</label>
          <input className="input" value={sl} onChange={(e) => setSl(e.target.value)} inputMode="decimal" />
        </div>
      </div>
      <p className="text-[11px] text-gray-500">{preset.pointHint}</p>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Position size (lots)" value={result ? result.lot.toFixed(2) : "—"} accent />
        <Stat label="Risk amount" value={result ? `$${result.riskMoney.toFixed(2)}` : "—"} />
      </div>
    </div>
  );
}

function RiskRewardCalc() {
  const [entry, setEntry] = useState("");
  const [stop, setStop] = useState("");
  const [target, setTarget] = useState("");

  const res = useMemo(() => {
    const e = num(entry);
    const s = num(stop);
    const t = num(target);
    if ([e, s, t].some((x) => !Number.isFinite(x))) return null;
    const riskDist = Math.abs(e - s);
    const rewardDist = Math.abs(t - e);
    if (riskDist === 0) return null;
    const rr = rewardDist / riskDist;
    const isLong = t >= e;
    const dirValid = isLong ? s < e && t > e : s > e && t < e;
    // Breakeven win-rate needed to be profitable at this R:R.
    const beWin = 1 / (1 + rr);
    return { rr, beWin, dirValid, isLong };
  }, [entry, stop, target]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="label">Entry</label>
          <input className="input" value={entry} onChange={(e) => setEntry(e.target.value)} inputMode="decimal" placeholder="1.1000" />
        </div>
        <div>
          <label className="label">Stop-loss</label>
          <input className="input" value={stop} onChange={(e) => setStop(e.target.value)} inputMode="decimal" placeholder="1.0950" />
        </div>
        <div>
          <label className="label">Take-profit</label>
          <input className="input" value={target} onChange={(e) => setTarget(e.target.value)} inputMode="decimal" placeholder="1.1150" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Risk : Reward" value={res ? `1 : ${res.rr.toFixed(2)}` : "—"} accent />
        <Stat label="Breakeven win-rate" value={res ? `${(res.beWin * 100).toFixed(1)}%` : "—"} />
      </div>
      {res && !res.dirValid && (
        <p className="text-xs text-down">
          ⚠ Levels look inconsistent for a {res.isLong ? "long" : "short"} — check that SL and TP are on the right sides of entry.
        </p>
      )}
      {res && res.rr < 1 && res.dirValid && (
        <p className="text-xs text-warn">Reward is smaller than risk — needs a high win-rate to be viable.</p>
      )}
    </div>
  );
}

function CompoundCalc() {
  const [start, setStart] = useState("10000");
  const [pct, setPct] = useState("2");
  const [periods, setPeriods] = useState("50");

  const res = useMemo(() => {
    const s = num(start);
    const p = num(pct);
    const n = Math.round(num(periods));
    if ([s, p].some((x) => !Number.isFinite(x)) || !Number.isFinite(n) || n < 0) return null;
    const final = s * Math.pow(1 + p / 100, n);
    const profit = final - s;
    return { final, profit };
  }, [start, pct, periods]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="label">Start $</label>
          <input className="input" value={start} onChange={(e) => setStart(e.target.value)} inputMode="decimal" />
        </div>
        <div>
          <label className="label">Gain / trade %</label>
          <input className="input" value={pct} onChange={(e) => setPct(e.target.value)} inputMode="decimal" />
        </div>
        <div>
          <label className="label"># trades</label>
          <input className="input" value={periods} onChange={(e) => setPeriods(e.target.value)} inputMode="numeric" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Final balance" value={res ? `$${res.final.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—"} accent />
        <Stat label="Total profit" value={res ? `$${res.profit.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—"} />
      </div>
      <p className="text-[11px] text-gray-500">Projection assumes a constant compounded return — real results vary.</p>
    </div>
  );
}

const TABS = [
  { id: "size", label: "Position Size" },
  { id: "rr", label: "Risk : Reward" },
  { id: "compound", label: "Compounding" },
] as const;

export default function Calculators() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("size");
  return (
    <section className="card p-5">
      <h2 className="text-sm font-semibold text-gray-200 tracking-wide uppercase mb-4">Calculators</h2>
      <div className="flex gap-1 mb-4 bg-bg-soft/60 p-1 rounded-xl">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
              tab === t.id ? "bg-bg-hover text-gray-100" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "size" && <PositionSizeCalc />}
      {tab === "rr" && <RiskRewardCalc />}
      {tab === "compound" && <CompoundCalc />}
    </section>
  );
}
