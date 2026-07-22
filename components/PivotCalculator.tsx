"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { TICKER_INSTRUMENTS } from "@/lib/instruments";
import type { Levels } from "@/app/api/pivots/route";

interface PivotData {
  symbol: string;
  date: string;
  high: number;
  low: number;
  close: number;
  classic: Levels;
  fib: Levels;
}

function LevelRow({
  label,
  value,
  decimals,
  kind,
  price,
}: {
  label: string;
  value: number;
  decimals: number;
  kind: "r" | "pp" | "s";
  price: number | null;
}) {
  const color = kind === "r" ? "text-down" : kind === "s" ? "text-up" : "text-accent";
  const near = price !== null && Math.abs(price - value) / value < 0.0015;
  return (
    <div
      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg ${
        near ? "bg-accent/10 border border-accent/30" : ""
      }`}
    >
      <span className={`text-xs font-semibold ${color}`}>{label}</span>
      <span className={`font-mono text-sm ${color}`}>
        {value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      </span>
    </div>
  );
}

function LevelsColumn({ title, levels, decimals, price }: { title: string; levels: Levels; decimals: number; price: number | null }) {
  const order: Array<{ key: keyof Levels; kind: "r" | "pp" | "s" }> = [
    { key: "r3", kind: "r" },
    { key: "r2", kind: "r" },
    { key: "r1", kind: "r" },
    { key: "pp", kind: "pp" },
    { key: "s1", kind: "s" },
    { key: "s2", kind: "s" },
    { key: "s3", kind: "s" },
  ];
  return (
    <div className="flex-1 min-w-[180px]">
      <div className="text-[11px] text-fg-faint uppercase tracking-wide mb-1.5">{title}</div>
      <div className="space-y-0.5">
        {order.map((o) => (
          <LevelRow
            key={o.key}
            label={o.key.toUpperCase()}
            value={levels[o.key]}
            decimals={decimals}
            kind={o.kind}
            price={price}
          />
        ))}
      </div>
    </div>
  );
}

export default function PivotCalculator() {
  const { t } = useI18n();
  const [symbol, setSymbol] = useState(TICKER_INSTRUMENTS[0].symbol);
  const [data, setData] = useState<PivotData | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [livePrice, setLivePrice] = useState<number | null>(null);

  const inst = TICKER_INSTRUMENTS.find((i) => i.symbol === symbol) ?? TICKER_INSTRUMENTS[0];

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    fetch(`/api/pivots?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d.classic) {
          setData(d);
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

  useEffect(() => {
    let alive = true;
    fetch("/api/quotes", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const q = d.quotes?.find((x: { symbol: string }) => x.symbol === symbol);
        setLivePrice(q ? q.price : null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [symbol]);

  const dateLabel = useMemo(() => (data ? data.date : ""), [data]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label">{t("piv.instrument")}</label>
          <select className="input w-auto" value={symbol} onChange={(e) => setSymbol(e.target.value)}>
            {TICKER_INSTRUMENTS.map((i) => (
              <option key={i.symbol} value={i.symbol}>
                {i.label}
              </option>
            ))}
          </select>
        </div>
        {data && (
          <div className="text-xs text-fg-faint">
            {t("piv.basedOn")} {dateLabel} · H {data.high.toFixed(inst.decimals)} · L{" "}
            {data.low.toFixed(inst.decimals)} · C {data.close.toFixed(inst.decimals)}
          </div>
        )}
      </div>

      {status === "loading" && <p className="text-sm text-fg-faint animate-pulse">{t("piv.loading")}</p>}
      {status === "error" && <p className="text-sm text-fg-faint">{t("piv.error")}</p>}

      {status === "ok" && data && (
        <>
          {livePrice !== null && (
            <div className="text-xs text-fg-faint">
              {t("piv.current")}:{" "}
              <span className="font-mono text-fg">{livePrice.toFixed(inst.decimals)}</span>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-5">
            <LevelsColumn title={t("piv.classic")} levels={data.classic} decimals={inst.decimals} price={livePrice} />
            <LevelsColumn title={t("piv.fib")} levels={data.fib} decimals={inst.decimals} price={livePrice} />
          </div>
        </>
      )}
    </div>
  );
}
