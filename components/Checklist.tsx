"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { chimeSuccess } from "@/lib/sound";
import {
  useI18n,
  CHECKLIST_STYLE_IDS,
  checklistStyleName,
  checklistQuestions,
  motivationQuotes,
  type ChecklistStyleId,
} from "@/lib/i18n";

export default function Checklist({ soundEnabled }: { soundEnabled: boolean }) {
  const { t, lang } = useI18n();
  const [rawStyle, setStyle] = useLocalStorage<ChecklistStyleId>("tap.checklist.style", "intraday");
  // Guard against values persisted by older versions (which stored a label,
  // not an id) so an unknown key can't crash the lookups.
  const style: ChecklistStyleId = CHECKLIST_STYLE_IDS.includes(rawStyle as ChecklistStyleId)
    ? (rawStyle as ChecklistStyleId)
    : "intraday";
  const questions = checklistQuestions(style, lang);
  const [checked, setChecked] = useState<boolean[]>(() => questions.map(() => false));
  const [quoteIdx, setQuoteIdx] = useState<number | null>(null);

  const done = useMemo(() => checked.length > 0 && checked.every(Boolean), [checked]);

  // Keep the checked array length in sync if the style changes elsewhere.
  useEffect(() => {
    setChecked((prev) => (prev.length === questions.length ? prev : questions.map(() => false)));
  }, [questions.length]);

  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      const allDone = next.length === questions.length && next.every(Boolean);
      if (allDone && !done) {
        setQuoteIdx(Math.floor(Math.random() * motivationQuotes(lang).length));
        if (soundEnabled) chimeSuccess();
      } else if (!allDone) {
        setQuoteIdx(null);
      }
      return next;
    });
  };

  const changeStyle = (s: ChecklistStyleId) => {
    setStyle(s);
    setChecked(checklistQuestions(s, lang).map(() => false));
    setQuoteIdx(null);
  };

  const reset = () => {
    setChecked(questions.map(() => false));
    setQuoteIdx(null);
  };

  const progress = checked.filter(Boolean).length;
  const quote = quoteIdx !== null ? motivationQuotes(lang)[quoteIdx] : null;

  return (
    <section className="card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-fg tracking-wide uppercase">{t("check.title")}</h2>
        <select
          className="input w-auto py-1 text-xs"
          value={style}
          onChange={(e) => changeStyle(e.target.value as ChecklistStyleId)}
        >
          {CHECKLIST_STYLE_IDS.map((s) => (
            <option key={s} value={s}>
              {checklistStyleName(s, lang)}
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
                checked[i] ? "bg-accent border-accent text-black" : "border-fg-subtle text-transparent"
              }`}
            >
              ✓
            </span>
            <span className={`text-sm ${checked[i] ? "text-fg" : "text-fg-muted"}`}>{q}</span>
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
          <p className={`text-sm font-medium ${done ? "text-accent animate-fade-in" : "text-fg-faint"}`}>
            {done ? quote : t("check.progress", { n: progress, total: questions.length })}
          </p>
          <button onClick={reset} className="btn-ghost text-xs px-3 py-1.5 shrink-0">
            {t("check.reset")}
          </button>
        </div>
      </div>
    </section>
  );
}
