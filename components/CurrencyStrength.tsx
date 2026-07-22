"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import InfoHint from "@/components/InfoHint";
import type { Strength } from "@/app/api/strength/route";

const FLAGS: Record<string, string> = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  JPY: "🇯🇵",
  AUD: "🇦🇺",
  CAD: "🇨🇦",
  CHF: "🇨🇭",
  NZD: "🇳🇿",
};

export default function CurrencyStrength() {
  const { t } = useI18n();
  const [list, setList] = useState<Strength[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/strength", { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;
        if (Array.isArray(data.list) && data.list.length) {
          setList(data.list);
          setStatus("ok");
        } else {
          setStatus("error");
        }
      } catch {
        if (alive) setStatus("error");
      }
    };
    load();
    const id = setInterval(load, 5 * 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const maxAbs = Math.max(0.01, ...list.map((s) => Math.abs(s.score)));

  return (
    <section className="card p-5">
      <h2 className="text-sm font-semibold text-fg tracking-wide uppercase mb-1">{t("str.title")}</h2>
      <p className="text-[11px] text-fg-faint mb-4">{t("str.subtitle")}</p>

      {status === "loading" && <p className="text-sm text-fg-faint animate-pulse">{t("str.loading")}</p>}
      {status === "error" && <p className="text-sm text-fg-faint">{t("str.error")}</p>}

      {status === "ok" && (
        <div className="space-y-2">
          {list.map((s) => {
            const pos = s.score >= 0;
            const width = (Math.abs(s.score) / maxAbs) * 50; // % of half-width
            return (
              <div key={s.currency} className="flex items-center gap-3">
                <span className="w-14 shrink-0 flex items-center gap-1.5 text-sm font-semibold text-fg">
                  <span>{FLAGS[s.currency] ?? "🏳️"}</span>
                  {s.currency}
                </span>
                {/* Diverging bar: center line, grows right (strong) or left (weak). */}
                <div className="flex-1 relative h-5 flex items-center">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border" />
                  <div
                    className={`absolute h-3 rounded-sm ${pos ? "bg-up/80" : "bg-down/80"}`}
                    style={
                      pos
                        ? { left: "50%", width: `${width}%` }
                        : { right: "50%", width: `${width}%` }
                    }
                  />
                </div>
                <span className={`w-14 shrink-0 text-right font-mono text-xs ${pos ? "text-up" : "text-down"}`}>
                  {pos ? "+" : ""}
                  {s.score.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
      <InfoHint items={[t("hint.str.1"), t("hint.str.2")]} />
    </section>
  );
}
