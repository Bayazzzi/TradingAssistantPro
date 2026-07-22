"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import type { Candle } from "@/app/api/chart/route";

const TFS = ["1D", "1W", "1M", "3M", "1Y"] as const;
type Tf = (typeof TFS)[number];

interface Props {
  symbol: string;
  label: string;
  decimals: number;
  onClose: () => void;
}

export default function PriceChart({ symbol, label, decimals, onClose }: Props) {
  const { t, lang } = useI18n();
  const [tf, setTf] = useState<Tf>("3M");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    fetch(`/api/chart?symbol=${encodeURIComponent(symbol)}&tf=${tf}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (Array.isArray(d.candles) && d.candles.length) {
          setCandles(d.candles);
          setStatus("ok");
        } else {
          setStatus("error");
        }
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
  }, [symbol, tf]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const W = 720;
  const H = 340;
  const padL = 8;
  const padR = 56;
  const padT = 12;
  const padB = 22;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const geom = useMemo(() => {
    if (!candles.length) return null;
    const lo = Math.min(...candles.map((c) => c.l));
    const hi = Math.max(...candles.map((c) => c.h));
    const range = hi - lo || 1;
    const x = (i: number) => padL + (i / Math.max(1, candles.length - 1)) * plotW;
    const y = (p: number) => padT + (1 - (p - lo) / range) * plotH;
    const cw = Math.max(1, (plotW / candles.length) * 0.6);
    return { lo, hi, range, x, y, cw };
  }, [candles, plotW, plotH]);

  const first = candles[0]?.c;
  const last = candles[candles.length - 1]?.c;
  const chg = first && last ? ((last - first) / first) * 100 : 0;
  const up = chg >= 0;

  const fmtPrice = (p: number) =>
    p.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const locale = lang === "ru" ? "ru-RU" : "en-GB";
  const fmtTime = (sec: number) => {
    const d = new Date(sec * 1000);
    return tf === "1D" || tf === "1W"
      ? d.toLocaleString(locale, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "2-digit" });
  };

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!geom || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - padL) / plotW) * (candles.length - 1));
    setHover(i >= 0 && i < candles.length ? i : null);
  };

  const hovered = hover !== null ? candles[hover] : null;

  // Y-axis gridlines (4 levels)
  const gridlines = geom
    ? [0, 0.25, 0.5, 0.75, 1].map((f) => {
        const price = geom.lo + f * geom.range;
        return { y: geom.y(price), price };
      })
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="card p-4 w-full max-w-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-baseline gap-3">
            <h3 className="text-lg font-bold text-fg">{label}</h3>
            {status === "ok" && last !== undefined && (
              <>
                <span className="font-mono text-fg">{fmtPrice(last)}</span>
                <span className={`font-mono text-sm ${up ? "text-up" : "text-down"}`}>
                  {up ? "+" : ""}
                  {chg.toFixed(2)}%
                </span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-border bg-bg-soft/60 text-fg-faint hover:text-fg hover:bg-bg-hover transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-1 mb-3 bg-bg-soft/60 p-1 rounded-xl w-fit">
          {TFS.map((f) => (
            <button
              key={f}
              onClick={() => setTf(f)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                tf === f ? "bg-bg-hover text-fg" : "text-fg-faint hover:text-fg-muted"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative">
          {status === "loading" && (
            <div className="h-[340px] flex items-center justify-center text-fg-faint animate-pulse">
              {t("chart.loading")}
            </div>
          )}
          {status === "error" && (
            <div className="h-[340px] flex items-center justify-center text-fg-faint">{t("chart.error")}</div>
          )}
          {status === "ok" && geom && (
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              className="w-full h-auto select-none"
              onMouseMove={onMove}
              onMouseLeave={() => setHover(null)}
            >
              {gridlines.map((g, i) => (
                <g key={i}>
                  <line x1={padL} y1={g.y} x2={padL + plotW} y2={g.y} stroke="rgb(var(--border))" strokeWidth="0.5" />
                  <text x={padL + plotW + 4} y={g.y + 3} fontSize="9" fill="rgb(var(--fg-faint))" className="font-mono">
                    {fmtPrice(g.price)}
                  </text>
                </g>
              ))}

              {candles.map((c, i) => {
                const cUp = c.c >= c.o;
                const color = cUp ? "#26d07c" : "#ff5c6c";
                const x = geom.x(i);
                const yO = geom.y(c.o);
                const yC = geom.y(c.c);
                const bodyTop = Math.min(yO, yC);
                const bodyH = Math.max(1, Math.abs(yC - yO));
                return (
                  <g key={i}>
                    <line x1={x} y1={geom.y(c.h)} x2={x} y2={geom.y(c.l)} stroke={color} strokeWidth="0.8" />
                    <rect x={x - geom.cw / 2} y={bodyTop} width={geom.cw} height={bodyH} fill={color} />
                  </g>
                );
              })}

              {hovered && (
                <line
                  x1={geom.x(hover!)}
                  y1={padT}
                  x2={geom.x(hover!)}
                  y2={padT + plotH}
                  stroke="rgb(var(--fg-faint))"
                  strokeWidth="0.5"
                  strokeDasharray="2,2"
                />
              )}
            </svg>
          )}

          {hovered && (
            <div className="absolute top-1 left-1 rounded-lg bg-bg-soft/95 border border-border px-2.5 py-1.5 text-[11px] font-mono pointer-events-none">
              <div className="text-fg-faint">{fmtTime(hovered.t)}</div>
              <div className="grid grid-cols-2 gap-x-3 mt-0.5 text-fg">
                <span>O {fmtPrice(hovered.o)}</span>
                <span>H {fmtPrice(hovered.h)}</span>
                <span>L {fmtPrice(hovered.l)}</span>
                <span>C {fmtPrice(hovered.c)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
