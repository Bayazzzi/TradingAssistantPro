"use client";

import { useEffect, useState } from "react";
import { unlockAudio, beep } from "@/lib/sound";

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
          : "border-border bg-bg-soft/60 text-gray-500 hover:text-gray-300"
      }`}
      title={`${label}: ${on ? "on" : "off"}`}
    >
      <span>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
      <span className={`w-1.5 h-1.5 rounded-full ${on ? "bg-accent" : "bg-gray-600"}`} />
    </button>
  );
}

export default function Header({ sessionSound, newsSound, onToggleSession, onToggleNews }: Props) {
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
            <h1 className="text-sm font-bold text-gray-100 leading-tight">
              Trading Assistant <span className="text-accent">Pro</span>
            </h1>
            <p className="text-[10px] text-gray-500 leading-tight font-mono">UTC {utc}</p>
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
            label="Sessions"
            icon="🔔"
          />
          <Toggle
            on={newsSound}
            onClick={() => {
              unlockAudio();
              if (!newsSound) beep(1200, 150, 0.12);
              onToggleNews();
            }}
            label="News"
            icon="📢"
          />
        </div>
      </div>
    </header>
  );
}
