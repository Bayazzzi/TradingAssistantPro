"use client";

import { useEffect, useState } from "react";
import { unlockAudio, beep } from "@/lib/sound";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { trackThemeToggle, trackLangToggle } from "@/lib/analytics";

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={() => {
        toggle();
        trackThemeToggle(theme === "dark" ? "light" : "dark");
      }}
      className="flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-bg-soft/60 text-sm hover:bg-bg-hover transition-colors"
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? "🌙" : "☀️"}
    </button>
  );
}

function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex bg-bg-soft/60 border border-border rounded-lg p-0.5 text-xs font-medium">
      {(["ru", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => {
            setLang(l);
            trackLangToggle(l);
          }}
          className={`px-2 py-1 rounded-md uppercase transition-colors ${
            lang === l ? "bg-bg-hover text-fg" : "text-fg-faint hover:text-fg-muted"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

interface Props {
  sessionSound: boolean;
  newsSound: boolean;
  onToggleSession: () => void;
  onToggleNews: () => void;
}

function Toggle({ on, onClick, label, icon }: { on: boolean; onClick: () => void; label: string; icon: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-colors ${
        on
          ? "border-accent/40 bg-accent/10 text-accent"
          : "border-border bg-bg-soft/60 text-fg-faint hover:text-fg-muted"
      }`}
      title={`${label}: ${on ? "on" : "off"}`}
    >
      <span>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
      <span className={`w-1.5 h-1.5 rounded-full ${on ? "bg-accent" : "bg-fg-subtle"}`} />
    </button>
  );
}

export default function Header({ sessionSound, newsSound, onToggleSession, onToggleNews }: Props) {
  const { t } = useI18n();
  const [utc, setUtc] = useState("--:--:--");

  useEffect(() => {
    const tick = () =>
      setUtc(
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "UTC",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date())
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-bg/85 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent text-lg">
            ▲
          </span>
          <div>
            <h1 className="text-sm font-bold text-fg leading-tight">
              Trading Assistant <span className="text-accent">Pro</span>
            </h1>
            <p className="text-[10px] text-fg-faint leading-tight font-mono">UTC {utc}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Toggle
            on={sessionSound}
            onClick={() => {
              unlockAudio();
              if (!sessionSound) beep(880, 150, 0.12);
              onToggleSession();
            }}
            label={t("header.sessions")}
            icon="🔔"
          />
          <Toggle
            on={newsSound}
            onClick={() => {
              unlockAudio();
              if (!newsSound) beep(1200, 150, 0.12);
              onToggleNews();
            }}
            label={t("header.news")}
            icon="📢"
          />
          <LangToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
