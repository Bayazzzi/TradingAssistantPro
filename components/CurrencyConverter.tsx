"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";

// A focused list of currencies traders actually care about, ordered by
// relevance rather than alphabetically. The full rates payload has ~160
// currencies; we don't need a picker for all of them.
const CURRENCIES = [
  "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD", "CNY",
  "SEK", "NOK", "SGD", "HKD", "MXN", "ZAR", "TRY", "INR", "KZT", "RUB",
];

function num(v: string): number {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

export default function CurrencyConverter() {
  const { t, lang } = useI18n();
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [amount, setAmount] = useState("100");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/rates", { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;
        if (data.rates && Object.keys(data.rates).length) {
          setRates(data.rates);
          setUpdatedAt(data.updatedAt ?? null);
          setStatus("ok");
        } else {
          setStatus("error");
        }
      } catch {
        if (alive) setStatus("error");
      }
    };
    load();
    const id = setInterval(load, 30 * 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const result = useMemo(() => {
    if (!rates || !rates[from] || !rates[to]) return null;
    const amt = num(amount);
    if (!Number.isFinite(amt)) return null;
    // Rates are USD-based: convert `from` → USD → `to`.
    const rate = rates[to] / rates[from];
    return { value: amt * rate, rate };
  }, [rates, from, to, amount]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const locale = lang === "ru" ? "ru-RU" : "en-US";

  return (
    <section className="card p-5">
      <h2 className="text-sm font-semibold text-fg tracking-wide uppercase mb-4">{t("conv.title")}</h2>

      {status === "loading" && <p className="text-sm text-fg-faint animate-pulse">{t("conv.loading")}</p>}
      {status === "error" && <p className="text-sm text-fg-faint">{t("conv.error")}</p>}

      {status === "ok" && (
        <div className="space-y-3">
          <div>
            <label className="label">{t("conv.amount")}</label>
            <input
              className="input font-mono"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
            />
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
            <div>
              <label className="label">{from}</label>
              <select className="input" value={from} onChange={(e) => setFrom(e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={swap}
              className="btn-ghost w-9 h-9 !p-0 mb-0.5 shrink-0"
              title={t("conv.swap")}
              aria-label={t("conv.swap")}
            >
              ⇄
            </button>
            <div>
              <label className="label">{to}</label>
              <select className="input" value={to} onChange={(e) => setTo(e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl bg-bg-soft/60 border border-border px-4 py-3">
            <div className="font-mono text-2xl text-accent">
              {result
                ? result.value.toLocaleString(locale, { maximumFractionDigits: 2 })
                : "—"}{" "}
              <span className="text-base text-fg-faint">{to}</span>
            </div>
            <div className="text-xs text-fg-faint mt-1 font-mono">
              {t("conv.rate")}: 1 {from} = {result ? result.rate.toFixed(6) : "—"} {to}
            </div>
          </div>

          {updatedAt && (
            <p className="text-[10px] text-fg-subtle">
              {t("conv.updated")}: {new Date(updatedAt).toLocaleString(locale)}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
