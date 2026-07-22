"use client";

import { useEffect, useRef, useState } from "react";
import {
  computeAllSessions,
  activeOverlap,
  formatCountdown,
  SESSIONS,
  type SessionState,
} from "@/lib/sessions";
import { chimeOpen } from "@/lib/sound";
import { useI18n } from "@/lib/i18n";

function SessionCard({ s }: { s: SessionState }) {
  const { t } = useI18n();
  const openStyles = s.isOpen
    ? "border-accent/50 bg-accent/5"
    : s.status === "WEEKEND"
    ? "border-border bg-bg-soft/40 opacity-70"
    : "border-border bg-bg-soft/40";

  const statusColor =
    s.status === "OPEN" ? "text-accent" : s.status === "WEEKEND" ? "text-warn" : "text-gray-500";

  return (
    <div className={`relative rounded-2xl border p-4 transition-colors ${openStyles}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{s.def.flag}</span>
          <span className="font-semibold text-sm text-gray-100">{t(`sessions.city.${s.def.city}`)}</span>
        </div>
        <span className="text-base leading-none" title={s.isDay ? t("sessions.day") : t("sessions.night")}>
          {s.isDay ? "☀️" : "🌙"}
        </span>
      </div>

      <div className="mt-3 font-mono text-2xl tracking-tight text-gray-50">{s.localTime}</div>

      <div className="mt-2 flex items-center justify-between">
        <span
          className={`chip ${
            s.isOpen ? "bg-accent/15" : "bg-white/5"
          } ${statusColor}`}
        >
          {s.isOpen && (
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-ring inline-block" />
          )}
          {t(`sessions.status.${s.status}`)}
        </span>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        {s.isOpen ? t("sessions.closesIn") : t("sessions.opensIn")}{" "}
        <span className={`font-mono ${s.isOpen ? "text-accent/90" : "text-gray-300"}`}>
          {formatCountdown(s.msToBoundary)}
        </span>
      </div>
    </div>
  );
}

// A 24-hour UTC timeline showing each session's window.
function Timeline({ nowUTCHour }: { nowUTCHour: number }) {
  const { t } = useI18n();
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between text-[10px] text-gray-600 mb-1 font-mono px-0.5">
        <span>00 UTC</span>
        <span>06</span>
        <span>12</span>
        <span>18</span>
        <span>24</span>
      </div>
      <div className="relative h-[68px] rounded-lg bg-bg-soft/60 border border-border overflow-hidden">
        {SESSIONS.map((def, idx) => {
          const rowTop = (idx / SESSIONS.length) * 100;
          const rowH = 100 / SESSIONS.length;
          const segments: Array<[number, number]> = [];
          if (def.openUTC < def.closeUTC) {
            segments.push([def.openUTC, def.closeUTC]);
          } else {
            segments.push([def.openUTC, 24]);
            segments.push([0, def.closeUTC]);
          }
          return segments.map(([a, b], i) => (
            <div
              key={`${def.key}-${i}`}
              className="absolute rounded-md"
              style={{
                left: `${(a / 24) * 100}%`,
                width: `${((b - a) / 24) * 100}%`,
                top: `${rowTop + 8}%`,
                height: `${rowH - 12}%`,
                background: def.color,
                opacity: 0.75,
              }}
              title={t(`sessions.city.${def.city}`)}
            />
          ));
        })}
        {/* Now marker */}
        <div
          className="absolute top-0 bottom-0 w-px bg-white/80"
          style={{ left: `${(nowUTCHour / 24) * 100}%` }}
        >
          <div className="absolute -top-0.5 -left-1 w-2 h-2 rounded-full bg-white" />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-3">
        {SESSIONS.map((def) => (
          <span key={def.key} className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: def.color }} />
            {t(`sessions.city.${def.city}`)}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SessionsClock({ soundEnabled }: { soundEnabled: boolean }) {
  const { t } = useI18n();
  // Start empty so server and client render identically; the effect fills it in
  // on mount, avoiding a time-based hydration mismatch.
  const [states, setStates] = useState<SessionState[]>([]);
  const [nowUTCHour, setNowUTCHour] = useState(0);
  const wasOpen = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const next = computeAllSessions(now);
      setStates(next);
      setNowUTCHour(now.getUTCHours() + now.getUTCMinutes() / 60);

      // Sound on a session transitioning to OPEN.
      next.forEach((s) => {
        const prev = wasOpen.current[s.def.key];
        if (prev === false && s.isOpen && soundEnabled) chimeOpen();
        wasOpen.current[s.def.key] = s.isOpen;
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [soundEnabled]);

  const overlap = activeOverlap(states);
  const openCount = states.filter((s) => s.isOpen).length;
  const overlapLabel = overlap
    ? overlap
        .split(" × ")
        .map((c) => t(`sessions.city.${c}`))
        .join(" × ")
    : null;

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-200 tracking-wide uppercase">
          {t("sessions.title")}
        </h2>
        <div className="flex items-center gap-2">
          {overlapLabel ? (
            <span className="chip bg-warn/15 text-warn">⚡ {t("sessions.overlap")}: {overlapLabel}</span>
          ) : (
            <span className="chip bg-white/5 text-gray-400">{openCount} {t("sessions.open")}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {states.length
          ? states.map((s) => <SessionCard key={s.def.key} s={s} />)
          : SESSIONS.map((def) => (
              <div key={def.key} className="rounded-2xl border border-border bg-bg-soft/40 p-4 h-[132px] animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="text-lg leading-none">{def.flag}</span>
                  <span className="font-semibold text-sm text-gray-100">{t(`sessions.city.${def.city}`)}</span>
                </div>
              </div>
            ))}
      </div>

      <Timeline nowUTCHour={nowUTCHour} />

      {overlap && (
        <p className="mt-3 text-xs text-warn/80">{t("sessions.overlapNote")}</p>
      )}
    </section>
  );
}
