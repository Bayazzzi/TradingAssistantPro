"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Lang = "ru" | "en";

// Flat key → { ru, en } dictionary. Trading jargon (Long/Short, R:R,
// Take-Profit) is kept familiar to traders in both languages.
type Entry = { ru: string; en: string };

const DICT: Record<string, Entry> = {
  // Header
  "brand.tag": { ru: "торговый ассистент", en: "trader's cockpit" },
  "header.sessions": { ru: "Сессии", en: "Sessions" },
  "header.news": { ru: "Новости", en: "News" },
  "header.soundOn": { ru: "вкл", en: "on" },
  "header.soundOff": { ru: "выкл", en: "off" },
  "header.lang": { ru: "Язык", en: "Language" },

  // Ticker
  "ticker.loading": { ru: "Загрузка рыночных данных…", en: "Loading market data…" },
  "ticker.error": { ru: "Котировки недоступны — повтор…", en: "Market feed unavailable — retrying…" },

  // Sessions
  "sessions.title": { ru: "Торговые сессии", en: "Trading Sessions" },
  "sessions.overlap": { ru: "Оверлап", en: "Overlap" },
  "sessions.open": { ru: "открыто", en: "open" },
  "sessions.status.OPEN": { ru: "ОТКРЫТА", en: "OPEN" },
  "sessions.status.CLOSED": { ru: "ЗАКРЫТА", en: "CLOSED" },
  "sessions.status.WEEKEND": { ru: "ВЫХОДНЫЕ", en: "WEEKEND" },
  "sessions.closesIn": { ru: "до закрытия", en: "closes in" },
  "sessions.opensIn": { ru: "до открытия", en: "opens in" },
  "sessions.day": { ru: "День", en: "Daytime" },
  "sessions.night": { ru: "Ночь", en: "Night" },
  "sessions.overlapNote": {
    ru: "Активно окно высокой ликвидности — жди широких диапазонов и быстрых движений.",
    en: "High-liquidity window active — expect wider ranges and faster moves.",
  },
  "sessions.city.Sydney": { ru: "Сидней", en: "Sydney" },
  "sessions.city.Tokyo": { ru: "Токио", en: "Tokyo" },
  "sessions.city.London": { ru: "Лондон", en: "London" },
  "sessions.city.New York": { ru: "Нью-Йорк", en: "New York" },

  // Calendar
  "cal.title": { ru: "Экономический календарь", en: "Economic Calendar" },
  "cal.today": { ru: "Сегодня", en: "Today" },
  "cal.week": { ru: "Неделя", en: "Week" },
  "cal.highOnly": { ru: "Только важные", en: "High only" },
  "cal.mediumPlus": { ru: "Средние+", en: "Medium+" },
  "cal.all": { ru: "Все", en: "All" },
  "cal.loading": { ru: "Загрузка событий…", en: "Loading events…" },
  "cal.error": {
    ru: "Календарь сейчас недоступен. Попробуй обновить через минуту.",
    en: "Calendar feed is unavailable right now. Try refreshing in a moment.",
  },
  "cal.emptyToday": { ru: "Нет событий по фильтру сегодня.", en: "No events match this filter today." },
  "cal.empty": { ru: "Нет событий по фильтру.", en: "No events match this filter." },
  "cal.footer": {
    ru: "Время показано в твоём часовом поясе · источник: ForexFactory",
    en: "Times shown in your local timezone · source: ForexFactory",
  },
  "cal.forecast": { ru: "Прогноз", en: "F" },
  "cal.previous": { ru: "Пред.", en: "P" },

  // Checklist
  "check.title": { ru: "Чек-лист перед сделкой", en: "Pre-Trade Checklist" },
  "check.reset": { ru: "Сбросить", en: "Reset" },
  "check.progress": {
    ru: "{n} / {total} подтверждено — отметь все пункты для зелёного света.",
    en: "{n} / {total} confirmed — complete all to get the green light.",
  },

  // Calculators
  "calc.title": { ru: "Калькуляторы", en: "Calculators" },
  "calc.tab.size": { ru: "Размер позиции", en: "Position Size" },
  "calc.tab.rr": { ru: "Риск : Прибыль", en: "Risk : Reward" },
  "calc.tab.compound": { ru: "Сложный процент", en: "Compounding" },
  "calc.assetType": { ru: "Тип актива", en: "Asset type" },
  "calc.balance": { ru: "Баланс $", en: "Balance $" },
  "calc.risk": { ru: "Риск %", en: "Risk %" },
  "calc.stop": { ru: "Стоп-лосс", en: "Stop-loss" },
  "calc.posSize": { ru: "Размер позиции (лоты)", en: "Position size (lots)" },
  "calc.riskAmount": { ru: "Сумма риска", en: "Risk amount" },
  "calc.entry": { ru: "Вход", en: "Entry" },
  "calc.takeProfit": { ru: "Тейк-профит", en: "Take-profit" },
  "calc.rr": { ru: "Риск : Прибыль", en: "Risk : Reward" },
  "calc.beWinrate": { ru: "Безубыточный винрейт", en: "Breakeven win-rate" },
  "calc.rrDirWarn": {
    ru: "⚠ Уровни выглядят некорректно для позиции {dir} — проверь стороны SL и TP относительно входа.",
    en: "⚠ Levels look inconsistent for a {dir} — check that SL and TP are on the right sides of entry.",
  },
  "calc.rrLowWarn": {
    ru: "Прибыль меньше риска — потребуется высокий винрейт, чтобы быть в плюсе.",
    en: "Reward is smaller than risk — needs a high win-rate to be viable.",
  },
  "calc.dir.long": { ru: "лонг", en: "long" },
  "calc.dir.short": { ru: "шорт", en: "short" },
  "calc.start": { ru: "Старт $", en: "Start $" },
  "calc.gainPerTrade": { ru: "Прибыль/сделку %", en: "Gain / trade %" },
  "calc.numTrades": { ru: "Кол-во сделок", en: "# trades" },
  "calc.finalBalance": { ru: "Итоговый баланс", en: "Final balance" },
  "calc.totalProfit": { ru: "Общая прибыль", en: "Total profit" },
  "calc.compoundNote": {
    ru: "Проекция при постоянной сложной доходности — реальные результаты отличаются.",
    en: "Projection assumes a constant compounded return — real results vary.",
  },

  // Journal
  "jrn.title": { ru: "Журнал сделок", en: "Trade Journal" },
  "jrn.clearAll": { ru: "Очистить всё", en: "Clear all" },
  "jrn.netPnl": { ru: "Чистый P/L", en: "Net P/L" },
  "jrn.winRate": { ru: "Винрейт", en: "Win rate" },
  "jrn.profitFactor": { ru: "Профит-фактор", en: "Profit factor" },
  "jrn.avgR": { ru: "Средний R", en: "Avg R" },
  "jrn.equityCurve": { ru: "Кривая эквити", en: "Equity curve" },
  "jrn.symbol": { ru: "Инструмент", en: "Symbol" },
  "jrn.long": { ru: "Лонг", en: "Long" },
  "jrn.short": { ru: "Шорт", en: "Short" },
  "jrn.pnl": { ru: "P/L $", en: "P/L $" },
  "jrn.rOpt": { ru: "R (необяз.)", en: "R (opt)" },
  "jrn.add": { ru: "+ Добавить", en: "+ Add" },
  "jrn.notes": {
    ru: "Заметки (необязательно) — сетап, ошибка, урок…",
    en: "Notes (optional) — setup, mistake, lesson…",
  },
  "jrn.empty": {
    ru: "Пока нет сделок. Добавь первую выше — статистика и кривая эквити построятся сами.",
    en: "No trades logged yet. Add your first trade above — stats and equity curve build automatically.",
  },
  "jrn.confirmClear": {
    ru: "Удалить все записи журнала? Это нельзя отменить.",
    en: "Delete all journal entries? This cannot be undone.",
  },

  // Footer
  "footer.disclaimer": {
    ru: "Trading Assistant Pro · только в информационных целях, не является финансовой рекомендацией.",
    en: "Trading Assistant Pro · for informational purposes only, not financial advice.",
  },
  "footer.version": { ru: "v8.0 · веб-версия", en: "v8.0 · web edition" },
};

// Asset presets — id stays stable, name is localized.
export function assetPresetName(id: string, lang: Lang): string {
  const names: Record<string, Entry> = {
    forex: { ru: "Forex (стандарт, $10/пункт)", en: "Forex (standard, $10/pip)" },
    forex_jpy: { ru: "Forex, пары с JPY", en: "Forex JPY pairs" },
    gold: { ru: "Золото XAUUSD (100 oz)", en: "Gold XAUUSD (100 oz)" },
    silver: { ru: "Серебро XAGUSD (5000 oz)", en: "Silver XAGUSD (5000 oz)" },
    btc: { ru: "Bitcoin (1 BTC)", en: "Bitcoin (1 BTC)" },
    indices: { ru: "Индексы US30 / SPX ($1/пункт)", en: "Indices US30 / SPX ($1/pt)" },
  };
  return names[id]?.[lang] ?? id;
}

export function assetPointHint(id: string, lang: Lang): string {
  const hints: Record<string, Entry> = {
    forex: { ru: "Стоп-лосс в пунктах", en: "Stop-loss in pips" },
    forex_jpy: { ru: "Стоп-лосс в пунктах", en: "Stop-loss in pips" },
    gold: { ru: "Стоп-лосс в долларах ($1.00)", en: "Stop-loss in dollars ($1.00)" },
    silver: { ru: "Стоп-лосс в долларах ($0.01 = $50)", en: "Stop-loss in dollars ($0.01 = $50)" },
    btc: { ru: "Стоп-лосс в долларах", en: "Stop-loss in dollars" },
    indices: { ru: "Стоп-лосс в пунктах", en: "Stop-loss in points" },
  };
  return hints[id]?.[lang] ?? "";
}

// Checklist styles and questions.
export const CHECKLIST_STYLE_IDS = ["scalp", "intraday", "swing"] as const;
export type ChecklistStyleId = (typeof CHECKLIST_STYLE_IDS)[number];

export function checklistStyleName(id: ChecklistStyleId, lang: Lang): string {
  const names: Record<ChecklistStyleId, Entry> = {
    scalp: { ru: "Скальпинг (M1/M5)", en: "Scalping (M1/M5)" },
    intraday: { ru: "Интрадей (H1/H4)", en: "Intraday (H1/H4)" },
    swing: { ru: "Свинг (D1)", en: "Swing (D1)" },
  };
  return names[id][lang];
}

export function checklistQuestions(id: ChecklistStyleId, lang: Lang): string[] {
  const q: Record<ChecklistStyleId, { ru: string[]; en: string[] }> = {
    scalp: {
      ru: [
        "Контекст на M15/H1 подтверждает вход",
        "Спред минимален, волатильность есть",
        "Прямо сейчас нет важных новостей",
        "Короткий стоп-лосс определён",
        "Быстрый тейк-профит намечен",
        "Я сконцентрирован и не тильтую",
      ],
      en: [
        "Context on M15/H1 confirms the entry",
        "Spread is minimal, volatility is present",
        "No high-impact news due right now",
        "Tight stop-loss is defined",
        "Quick take-profit level is marked",
        "I'm focused and not tilting",
      ],
    },
    intraday: {
      ru: [
        "Тренд старшего ТФ (H1/H4) определён",
        "Уровень поддержки/сопротивления подтверждён",
        "Новости проверены — импульса не ждём",
        "Риск на сделку посчитан (1–2%)",
        "Тейк-профит минимум в 2 раза больше стопа",
        "Я спокоен — без желания отыграться",
      ],
      en: [
        "Higher-timeframe trend (H1/H4) is identified",
        "Support / resistance level is confirmed",
        "News checked — no impulse expected",
        "Risk per trade is calculated (1–2%)",
        "Take-profit is at least 2× the stop-loss",
        "I'm calm — no revenge trading",
      ],
    },
    swing: {
      ru: [
        "Макро-тренд (D1/W1) на моей стороне",
        "Фундаментал не против идеи",
        "Свопы / перенос учтены",
        "Стоп-лосс выдержит нормальную волатильность",
        "Потенциал движения 1:3 или лучше",
        "Я готов держать позицию несколько дней",
      ],
      en: [
        "Macro trend (D1/W1) is on my side",
        "Fundamentals are not against the idea",
        "Swap / overnight costs accounted for",
        "Stop-loss can survive normal volatility",
        "Move potential is 1:3 or better",
        "I'm ready to hold for days",
      ],
    },
  };
  return q[id][lang];
}

export function motivationQuotes(lang: Lang): string[] {
  const quotes: { ru: string[]; en: string[] } = {
    ru: [
      "Дисциплина — мост между целями и прибылью. 🚀",
      "Снайперский вход — теперь жми на курок. 🎯",
      "Тренд — твой друг.",
      "Сначала сохрани капитал, потом думай о прибыли.",
      "Холодная голова — твоё главное преимущество.",
      "Удача любит подготовленных. 🐂🐻",
      "Уважай свой риск. Всегда.",
      "Не жадничай — следуй плану.",
      "Хорошие сетапы стоят ожидания.",
      "Сегодня отличный день для чистой сделки. 💸",
    ],
    en: [
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
    ],
  };
  return quotes[lang];
}

// --- Context ---
interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ru");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("tap.lang");
      if (saved === "ru" || saved === "en") setLangState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      window.localStorage.setItem("tap.lang", l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let str = DICT[key]?.[lang] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
      }
      return str;
    },
    [lang]
  );

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
