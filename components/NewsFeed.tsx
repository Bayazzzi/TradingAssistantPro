"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import type { NewsItem } from "@/app/api/news/route";

function relTime(iso: string, lang: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return lang === "ru" ? "только что" : "just now";
  if (min < 60) return lang === "ru" ? `${min} мин назад` : `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return lang === "ru" ? `${h} ч назад` : `${h}h ago`;
  const d = Math.floor(h / 24);
  return lang === "ru" ? `${d} дн назад` : `${d}d ago`;
}

export default function NewsFeed() {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  const load = async () => {
    try {
      const res = await fetch("/api/news", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data.items) && data.items.length) {
        setItems(data.items);
        setStatus("ok");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 10 * 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="card p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-fg tracking-wide uppercase">{t("news.title")}</h2>
        <button onClick={load} className="btn-ghost text-xs px-2.5 py-1" title="Refresh">
          ↻
        </button>
      </div>

      {status === "loading" && <p className="text-sm text-fg-faint animate-pulse">{t("news.loading")}</p>}
      {status === "error" && <p className="text-sm text-fg-faint">{t("news.error")}</p>}

      {status === "ok" && (
        <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-1 max-h-[460px]">
          {items.map((n, i) => (
            <a
              key={`${n.link}-${i}`}
              href={n.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-transparent hover:border-border hover:bg-bg-hover/50 px-3 py-2 transition-colors group"
            >
              <div className="text-sm text-fg-muted group-hover:text-fg transition-colors leading-snug">
                {n.title}
              </div>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-fg-subtle">
                <span className="font-medium">{n.source}</span>
                <span>·</span>
                <span>{relTime(n.time, lang)}</span>
              </div>
            </a>
          ))}
        </div>
      )}
      <p className="mt-3 text-[10px] text-fg-subtle">{t("news.footer")}</p>
    </section>
  );
}
