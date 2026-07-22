"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import InfoHint from "@/components/InfoHint";
import type { MacroData } from "@/app/api/macro/route";

function GaugeCard({
  label,
  value,
  sub,
  subTone,
}: {
  label: string;
  value: string;
  sub?: string;
  subTone?: "up" | "down" | "neutral";
}) {
  const subColor = subTone === "up" ? "text-up" : subTone === "down" ? "text-down" : "text-fg-faint";
  return (
    <div className="rounded-xl bg-bg-soft/60 border border-border px-3 py-3">
      <div className="text-[11px] text-fg-faint">{label}</div>
      <div className="font-mono text-xl text-fg mt-1">{value}</div>
      {sub && <div className={`text-xs font-mono mt-0.5 ${subColor}`}>{sub}</div>}
    </div>
  );
}

// Fear & Greed meter (0-100) with a colored bar.
function FearGreedCard({ value, label }: { value: number; label: string }) {
  const { t } = useI18n();
  const localized =
    value <= 24
      ? t("macro.fg.extremeFear")
      : value <= 44
      ? t("macro.fg.fear")
      : value <= 55
      ? t("macro.fg.neutral")
      : value <= 75
      ? t("macro.fg.greed")
      : t("macro.fg.extremeGreed");
  // Red (fear) → yellow → green (greed)
  const hue = (value / 100) * 120;
  const color = `hsl(${hue}, 70%, 50%)`;
  return (
    <div className="rounded-xl bg-bg-soft/60 border border-border px-3 py-3">
      <div className="text-[11px] text-fg-faint">{t("macro.fearGreed")}</div>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="font-mono text-xl" style={{ color }}>
          {value}
        </span>
        <span className="text-xs" style={{ color }}>
          {localized}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-bg-hover mt-2 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

export default function MacroBarometer() {
  const { t } = useI18n();
  const [data, setData] = useState<MacroData | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/macro", { cache: "no-store" });
        const json = await res.json();
        if (!alive) return;
        if (json.data) {
          setData(json.data);
          setStatus("ok");
        } else {
          setStatus("error");
        }
      } catch {
        if (alive) setStatus("error");
      }
    };
    load();
    const id = setInterval(load, 10 * 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const chg = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
  const tone = (v: number): "up" | "down" => (v >= 0 ? "up" : "down");

  return (
    <section className="card p-5">
      <h2 className="text-sm font-semibold text-fg tracking-wide uppercase mb-1">{t("macro.title")}</h2>
      <p className="text-[11px] text-fg-faint mb-4">{t("macro.subtitle")}</p>

      {status === "loading" && <p className="text-sm text-fg-faint animate-pulse">{t("macro.loading")}</p>}
      {status === "error" && <p className="text-sm text-fg-faint">{t("macro.error")}</p>}

      {status === "ok" && data && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {data.dxy && (
            <GaugeCard
              label={t("macro.dxy")}
              value={data.dxy.value.toFixed(2)}
              sub={chg(data.dxy.changePct)}
              subTone={tone(data.dxy.changePct)}
            />
          )}
          {data.us10y && (
            <GaugeCard
              label={t("macro.us10y")}
              value={`${data.us10y.value.toFixed(2)}%`}
              sub={chg(data.us10y.changePct)}
              subTone={tone(data.us10y.changePct)}
            />
          )}
          {data.vix && (
            <GaugeCard
              label={t("macro.vix")}
              value={data.vix.value.toFixed(2)}
              sub={chg(data.vix.changePct)}
              subTone={tone(data.vix.changePct)}
            />
          )}
          {data.fearGreed && <FearGreedCard value={data.fearGreed.value} label={data.fearGreed.label} />}
          {data.btcDominance !== null && (
            <GaugeCard label={t("macro.btcDom")} value={`${data.btcDominance.toFixed(1)}%`} />
          )}
        </div>
      )}
      <InfoHint items={[t("hint.macro.1"), t("hint.macro.2")]} />
    </section>
  );
}
