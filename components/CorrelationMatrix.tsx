"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

interface CorrData {
  labels: string[];
  matrix: number[][];
}

// Color a correlation value from red (strong inverse) through neutral to
// green (strong positive), matching the up/down palette used elsewhere.
function cellColor(v: number): string {
  const a = Math.min(1, Math.abs(v));
  if (v >= 0) return `rgba(38, 208, 124, ${0.12 + a * 0.55})`;
  return `rgba(255, 92, 108, ${0.12 + a * 0.55})`;
}

function cellTextClass(v: number): string {
  if (Math.abs(v) >= 0.6) return "text-fg font-semibold";
  return "text-fg-muted";
}

export default function CorrelationMatrix() {
  const { t } = useI18n();
  const [data, setData] = useState<CorrData | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    let alive = true;
    fetch("/api/correlation", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d.labels?.length) {
          setData({ labels: d.labels, matrix: d.matrix });
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

  return (
    <section className="card p-5">
      <h2 className="text-sm font-semibold text-fg tracking-wide uppercase mb-1">{t("corr.title")}</h2>
      <p className="text-[11px] text-fg-faint mb-4">{t("corr.subtitle")}</p>

      {status === "loading" && <p className="text-sm text-fg-faint animate-pulse">{t("corr.loading")}</p>}
      {status === "error" && <p className="text-sm text-fg-faint">{t("corr.error")}</p>}

      {status === "ok" && data && (
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="border-collapse text-[11px] w-full min-w-[480px]">
            <thead>
              <tr>
                <th className="p-1"></th>
                {data.labels.map((l) => (
                  <th key={l} className="p-1 font-mono text-fg-faint font-normal whitespace-nowrap">
                    {l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.matrix.map((row, i) => (
                <tr key={data.labels[i]}>
                  <th className="p-1 pr-2 font-mono text-fg-faint font-normal text-right whitespace-nowrap">
                    {data.labels[i]}
                  </th>
                  {row.map((v, j) => (
                    <td
                      key={j}
                      className={`text-center font-mono rounded-md ${cellTextClass(v)}`}
                      style={{ background: cellColor(v) }}
                      title={`${data.labels[i]} × ${data.labels[j]}: ${v.toFixed(2)}`}
                    >
                      <div className="px-1.5 py-1.5">{v.toFixed(2)}</div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center gap-4 mt-3 text-[10px] text-fg-faint">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(38, 208, 124, 0.6)" }} />
              {t("corr.strong")} +
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(38, 208, 124, 0.15)" }} />
              {t("corr.weak")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "rgba(255, 92, 108, 0.6)" }} />
              {t("corr.inverse")}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
