"use client";

import { useMemo, useState } from "react";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { chimeSuccess } from "@/lib/sound";

const STYLES: Record<string, string[]> = {
  "Scalping (M1/M5)": [
    "Context on M15/H1 confirms the entry",
    "Spread is minimal, volatility is present",
    "No high-impact news due right now",
    "Tight stop-loss is defined",
    "Quick take-profit level is marked",
    "I'm focused and not tilting",
  ],
  "Intraday (H1/H4)": [
    "Higher-timeframe trend (H1/H4) is identified",
    "Support / resistance level is confirmed",
    "News checked — no impulse expected",
    "Risk per trade is calculated (1–2%)",
    "Take-profit is at least 2× the stop-loss",
    "I'm calm — no revenge trading",
  ],
  "Swing (D1)": [
    "Macro trend (D1/W1) is on my side",
    "Fundamentals are not against the idea",
    "Swap / overnight costs accounted for",
    "Stop-loss can survive normal volatility",
    "Move potential is 1:3 or better",
    "I'm ready to hold for days",
  ],
};

const QUOTES = [
  "Discipline is the bridge between goals and profit. 🚀",
  "Sniper entry — now pull the trigger. 🎯",
  "The trend is your friend.",
  "Protect capital first, profit second.",
  "A cool head is your biggest edge.",
  "Fortune favours the prepared. 🐂🐻",
  "Respect your risk. Every time.",
  "Don't be greedy — follow the plan.",
  "Great setups are worth the wait.",
  "Today is a good day for a clean trade. 💸",
];

export default function Checklist({ soundEnabled }: { soundEnabled: boolean }) {
  const [style, setStyle] = useLocalStorage<string>("tap.checklist.style", "Intraday (H1/H4)");
  const questions = STYLES[style] ?? STYLES["Intraday (H1/H4)"];
  const [checked, setChecked] = useState<boolean[]>(() => questions.map(() => false));
  const [quote, setQuote] = useState<string | null>(null);

  const done = useMemo(() => checked.length > 0 && checked.every(Boolean), [checked]);

  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      const allDone = next.length === questions.length && next.every(Boolean);
      if (allDone && !done) {
        setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
        if (soundEnabled) chimeSuccess();
      } else if (!allDone) {
        setQuote(null);
      }
      return next;
    });
  };

  const changeStyle = (s: string) => {
    setStyle(s);
    setChecked(STYLES[s].map(() => false));
    setQuote(null);
  };

  const reset = () => {
    setChecked(questions.map(() => false));
    setQuote(null);
  };

  const progress = checked.filter(Boolean).length;

  return (
    <section className="card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-200 tracking-wide uppercase">Pre-Trade Checklist</h2>
        <select
          className="input w-auto py-1 text-xs"
          value={style}
          onChange={(e) => changeStyle(e.target.value)}
        >
          {Object.keys(STYLES).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 flex-1">
        {questions.map((q, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className={`w-full flex items-start gap-3 text-left rounded-xl px-3 py-2.5 border transition-colors ${
              checked[i]
                ? "border-accent/40 bg-accent/5"
                : "border-border bg-bg-soft/40 hover:bg-bg-hover"
            }`}
          >
            <span
              className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center text-xs shrink-0 ${
                checked[i] ? "bg-accent border-accent text-black" : "border-gray-600 text-transparent"
              }`}
            >
              ✓
            </span>
            <span className={`text-sm ${checked[i] ? "text-gray-200" : "text-gray-400"}`}>{q}</span>
          </button>
        ))}
      </div>

      <div className="mt-4">
        <div className="h-1.5 rounded-full bg-bg-soft overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${(progress / questions.length) * 100}%` }}
          />
        </div>
        <div className="mt-3 min-h-[2.5rem] flex items-center justify-between gap-3">
          <p className={`text-sm font-medium ${done ? "text-accent animate-fade-in" : "text-gray-500"}`}>
            {done ? quote : `${progress} / ${questions.length} confirmed — complete all to get the green light.`}
          </p>
          <button onClick={reset} className="btn-ghost text-xs px-3 py-1.5 shrink-0">
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}
