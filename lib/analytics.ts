"use client";

import { track } from "@vercel/analytics/react";

// Thin wrappers around Vercel Analytics custom events so call sites stay
// typo-proof and the event vocabulary lives in one place. Automatic pageview
// tracking only sees "/" since tabs are client-side state, not routes — these
// events are what actually shows which sections people use.
export function trackTabView(tab: string) {
  track("tab_view", { tab });
}

export function trackChartOpen(symbol: string) {
  track("chart_open", { symbol });
}

export function trackCotHistoryOpen(market: string) {
  track("cot_history_open", { market });
}

export function trackThemeToggle(theme: string) {
  track("theme_toggle", { theme });
}

export function trackLangToggle(lang: string) {
  track("lang_toggle", { lang });
}

export function trackCalendarNewsClick(currency: string, impact: string) {
  track("calendar_news_click", { currency, impact });
}
