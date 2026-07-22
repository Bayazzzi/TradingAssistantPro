"use client";

import { useEffect } from "react";
import Header from "@/components/Header";
import Ticker from "@/components/Ticker";
import SessionsClock from "@/components/SessionsClock";
import MarketOverview from "@/components/MarketOverview";
import MacroBarometer from "@/components/MacroBarometer";
import CurrencyStrength from "@/components/CurrencyStrength";
import Calculators from "@/components/Calculators";
import Checklist from "@/components/Checklist";
import EconomicCalendar from "@/components/EconomicCalendar";
import NewsFeed from "@/components/NewsFeed";
import Journal from "@/components/Journal";
import CurrencyConverter from "@/components/CurrencyConverter";
import CorrelationMatrix from "@/components/CorrelationMatrix";
import CotPositioning from "@/components/CotPositioning";
import TrendScanner from "@/components/TrendScanner";
import TimingHeatmap from "@/components/TimingHeatmap";
import RiskPanel from "@/components/RiskPanel";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { unlockAudio } from "@/lib/sound";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { ThemeProvider } from "@/lib/theme";
import { trackTabView } from "@/lib/analytics";

export default function Home() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <Dashboard />
      </I18nProvider>
    </ThemeProvider>
  );
}

type TabId = "market" | "calendar" | "calc" | "analysis" | "journal";

const TABS: Array<{ id: TabId; key: string; icon: string }> = [
  { id: "market", key: "nav.market", icon: "📊" },
  { id: "calendar", key: "nav.calendar", icon: "📅" },
  { id: "calc", key: "nav.calc", icon: "🧮" },
  { id: "analysis", key: "nav.analysis", icon: "🔍" },
  { id: "journal", key: "nav.journal", icon: "📓" },
];

function Dashboard() {
  const { t } = useI18n();
  const [sessionSound, setSessionSound] = useLocalStorage<boolean>("tap.sound.session", true);
  const [newsSound, setNewsSound] = useLocalStorage<boolean>("tap.sound.news", true);
  const [tab, setTab] = useLocalStorage<TabId>("tap.tab", "market");

  // Unlock audio on the first user interaction anywhere on the page.
  useEffect(() => {
    const handler = () => unlockAudio();
    window.addEventListener("pointerdown", handler, { once: true });
    return () => window.removeEventListener("pointerdown", handler);
  }, []);

  // Tabs are client-side state on a single route, so automatic pageview
  // tracking can't tell them apart — fire a custom event on every switch
  // (including the initial tab restored from localStorage).
  useEffect(() => {
    trackTabView(tab);
  }, [tab]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        sessionSound={sessionSound}
        newsSound={newsSound}
        onToggleSession={() => setSessionSound((v) => !v)}
        onToggleNews={() => setNewsSound((v) => !v)}
      />

      {/* Primary navigation — sticks just under the header for quick switching. */}
      <nav className="sticky top-14 z-10 bg-bg/85 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {TABS.map((tb) => (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === tb.id
                    ? "border-accent text-fg"
                    : "border-transparent text-fg-faint hover:text-fg-muted"
                }`}
              >
                <span>{tb.icon}</span>
                {t(tb.key)}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <Ticker />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5 space-y-5">
        {tab === "market" && (
          <>
            <SessionsClock soundEnabled={sessionSound} />
            <MarketOverview />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
              <MacroBarometer />
              <CurrencyStrength />
            </div>
          </>
        )}

        {tab === "calendar" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            <EconomicCalendar soundEnabled={newsSound} />
            <NewsFeed />
          </div>
        )}

        {tab === "calc" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            <Calculators />
            <CurrencyConverter />
          </div>
        )}

        {tab === "analysis" && (
          <>
            <TrendScanner />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
              <CorrelationMatrix />
              <TimingHeatmap />
            </div>
            <CotPositioning />
          </>
        )}

        {tab === "journal" && (
          <>
            <Checklist soundEnabled={sessionSound} />
            <RiskPanel />
            <Journal />
          </>
        )}
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
