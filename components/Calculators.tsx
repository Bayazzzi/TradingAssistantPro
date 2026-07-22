"use client";

import { useMemo, useState } from "react";
import { ASSET_PRESETS } from "@/lib/instruments";
import { useI18n, assetPresetName, assetPointHint } from "@/lib/i18n";
import InfoHint from "@/components/InfoHint";
import PivotCalculator from "@/components/PivotCalculator";

function num(v: string): number {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-bg-soft/60 border border-border px-3 py-2.5">
      <div className="text-[11px] text-fg-faint">{label}</div>
      <div className={`font-mono text-lg mt-0.5 ${accent ? "text-accent" : "text-fg"}`}>{value}</div>
    </div>
  );
}

function PositionSizeCalc() {
  const { t, lang } = useI18n();
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
        <label className="label">{t("calc.assetType")}</label>
        <select className="input" value={asset} onChange={(e) => setAsset(e.target.value)}>
          {ASSET_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {assetPresetName(p.id, lang)}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="label">{t("calc.balance")}</label>
          <input className="input" value={balance} onChange={(e) => setBalance(e.target.value)} inputMode="decimal" />
        </div>
        <div>
          <label className="label">{t("calc.risk")}</label>
          <input className="input" value={risk} onChange={(e) => setRisk(e.target.value)} inputMode="decimal" />
        </div>
        <div>
          <label className="label">{t("calc.stop")}</label>
          <input className="input" value={sl} onChange={(e) => setSl(e.target.value)} inputMode="decimal" />
        </div>
      </div>
      <p className="text-[11px] text-fg-faint">{assetPointHint(asset, lang)}</p>
      <div className="grid grid-cols-2 gap-2">
        <Stat label={t("calc.posSize")} value={result ? result.lot.toFixed(2) : "—"} accent />
        <Stat label={t("calc.riskAmount")} value={result ? `$${result.riskMoney.toFixed(2)}` : "—"} />
      </div>
    </div>
  );
}

function RiskRewardCalc() {
  const { t } = useI18n();
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
          <label className="label">{t("calc.entry")}</label>
          <input className="input" value={entry} onChange={(e) => setEntry(e.target.value)} inputMode="decimal" placeholder="1.1000" />
        </div>
        <div>
          <label className="label">{t("calc.stop")}</label>
          <input className="input" value={stop} onChange={(e) => setStop(e.target.value)} inputMode="decimal" placeholder="1.0950" />
        </div>
        <div>
          <label className="label">{t("calc.takeProfit")}</label>
          <input className="input" value={target} onChange={(e) => setTarget(e.target.value)} inputMode="decimal" placeholder="1.1150" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat label={t("calc.rr")} value={res ? `1 : ${res.rr.toFixed(2)}` : "—"} accent />
        <Stat label={t("calc.beWinrate")} value={res ? `${(res.beWin * 100).toFixed(1)}%` : "—"} />
      </div>
      {res && !res.dirValid && (
        <p className="text-xs text-down">
          {t("calc.rrDirWarn", { dir: res.isLong ? t("calc.dir.long") : t("calc.dir.short") })}
        </p>
      )}
      {res && res.rr < 1 && res.dirValid && (
        <p className="text-xs text-warn">{t("calc.rrLowWarn")}</p>
      )}
    </div>
  );
}

function CompoundCalc() {
  const { t } = useI18n();
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
          <label className="label">{t("calc.start")}</label>
          <input className="input" value={start} onChange={(e) => setStart(e.target.value)} inputMode="decimal" />
        </div>
        <div>
          <label className="label">{t("calc.gainPerTrade")}</label>
          <input className="input" value={pct} onChange={(e) => setPct(e.target.value)} inputMode="decimal" />
        </div>
        <div>
          <label className="label">{t("calc.numTrades")}</label>
          <input className="input" value={periods} onChange={(e) => setPeriods(e.target.value)} inputMode="numeric" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Stat label={t("calc.finalBalance")} value={res ? `$${res.final.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—"} accent />
        <Stat label={t("calc.totalProfit")} value={res ? `$${res.profit.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—"} />
      </div>
      <p className="text-[11px] text-fg-faint">{t("calc.compoundNote")}</p>
    </div>
  );
}

const TABS = [
  { id: "size", key: "calc.tab.size" },
  { id: "rr", key: "calc.tab.rr" },
  { id: "compound", key: "calc.tab.compound" },
  { id: "pivots", key: "calc.tab.pivots" },
] as const;

export default function Calculators() {
  const { t } = useI18n();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("size");
  return (
    <section className="card p-5">
      <h2 className="text-sm font-semibold text-fg tracking-wide uppercase mb-4">{t("calc.title")}</h2>
      <div className="flex gap-1 mb-4 bg-bg-soft/60 p-1 rounded-xl">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
              tab === tb.id ? "bg-bg-hover text-fg" : "text-fg-faint hover:text-fg-muted"
            }`}
          >
            {t(tb.key)}
          </button>
        ))}
      </div>
      {tab === "size" && <PositionSizeCalc />}
      {tab === "rr" && <RiskRewardCalc />}
      {tab === "compound" && <CompoundCalc />}
      {tab === "pivots" && <PivotCalculator />}
      <InfoHint items={[t("hint.calc.1"), t("hint.calc.2"), t("hint.calc.3"), t("hint.calc.4")]} />
    </section>
  );
}
