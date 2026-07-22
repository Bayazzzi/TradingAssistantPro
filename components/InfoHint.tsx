"use client";

import { useI18n } from "@/lib/i18n";

// A small collapsible explainer (native <details>) so each tool can carry a
// short "what is this / what can it do" note without cluttering the UI.
export default function InfoHint({ items }: { items: string[] }) {
  const { t } = useI18n();
  return (
    <details className="mt-4 group">
      <summary className="flex items-center gap-1.5 cursor-pointer select-none text-xs text-fg-faint hover:text-fg-muted transition-colors list-none">
        <span className="w-4 h-4 rounded-full border border-current inline-flex items-center justify-center text-[10px] font-semibold">
          ?
        </span>
        {t("hint.what")}
        <span className="transition-transform group-open:rotate-180 text-[10px]">▾</span>
      </summary>
      <ul className="mt-2 space-y-1 text-xs text-fg-faint pl-1 animate-fade-in">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-accent shrink-0">•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
