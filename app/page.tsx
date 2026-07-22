"use client";

import { useEffect } from "react";
import Header from "@/components/Header";
import Ticker from "@/components/Ticker";
import SessionsClock from "@/components/SessionsClock";
import Calculators from "@/components/Calculators";
import Checklist from "@/components/Checklist";
import EconomicCalendar from "@/components/EconomicCalendar";
import Journal from "@/components/Journal";
import CurrencyConverter from "@/components/CurrencyConverter";
import CorrelationMatrix from "@/components/CorrelationMatrix";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { unlockAudio } from "@/lib/sound";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";

export default function Home() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <Dashboard />
      </I18nProvider>
    </ThemeProvider>
  );
}

function Dashboard() {
  const { t } = useI18n();
  const [sessionSound, setSessionSound] = useLocalStorage<boolean>("tap.sound.session", true);
  const [newsSound, setNewsSound] = useLocalStorage<boolean>("tap.sound.news", true);

  // Unlock audio on the first user interaction anywhere on the page.
  useEffect(() => {
    const handler = () => unlockAudio();
    window.addEventListener("pointerdown", handler, { once: true });
    return () => window.removeEventListener("pointerdown", handler);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        sessionSound={sessionSound}
        newsSound={newsSound}
        onToggleSession={() => setSessionSound((v) => !v)}
        onToggleNews={() => setNewsSound((v) => !v)}
      />
      <Ticker />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5 space-y-5">
        <SessionsClock soundEnabled={sessionSound} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <EconomicCalendar soundEnabled={newsSound} />
          <Checklist soundEnabled={sessionSound} />
        </div>

        <Calculators />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <CurrencyConverter />
          <CorrelationMatrix />
        </div>

        <Journal />
      </main>

      <footer className="border-t border-border py-5 mt-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-fg-subtle">
          <span>{t("footer.disclaimer")}</span>
          <span className="font-mono">{t("footer.version")}</span>
        </div>
      </footer>
    </div>
  );
}
