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

  // Currency converter
  "conv.title": { ru: "Конвертер валют", en: "Currency Converter" },
  "conv.amount": { ru: "Сумма", en: "Amount" },
  "conv.swap": { ru: "Поменять местами", en: "Swap" },
  "conv.rate": { ru: "Курс", en: "Rate" },
  "conv.loading": { ru: "Загрузка курсов…", en: "Loading rates…" },
  "conv.error": { ru: "Курсы недоступны — попробуй позже.", en: "Rates unavailable — try again later." },
  "conv.updated": { ru: "Обновлено", en: "Updated" },

  // Correlation matrix
  "corr.title": { ru: "Корреляция пар", en: "Pair Correlation" },
  "corr.subtitle": {
    ru: "Корреляция дневной доходности за 3 месяца — от −1 (противофаза) до +1 (движутся вместе)",
    en: "3-month daily-return correlation — from −1 (opposite) to +1 (moves together)",
  },
  "corr.loading": { ru: "Расчёт корреляций…", en: "Computing correlations…" },
  "corr.error": { ru: "Данные для расчёта недоступны.", en: "Correlation data unavailable." },
  "corr.strong": { ru: "Сильная", en: "Strong" },
  "corr.weak": { ru: "Слабая", en: "Weak" },
  "corr.inverse": { ru: "Обратная", en: "Inverse" },

  // Calendar event link
  "cal.searchTitle": { ru: "Искать это событие", en: "Search this event" },

  // Market overview
  "ov.title": { ru: "Обзор рынка", en: "Market Overview" },
  "ov.subtitle": {
    ru: "Изменение по таймфреймам и волатильность (ATR за 14 дней, % от цены)",
    en: "Multi-timeframe performance and volatility (14-day ATR, % of price)",
  },
  "ov.instrument": { ru: "Инструмент", en: "Instrument" },
  "ov.price": { ru: "Цена", en: "Price" },
  "ov.vol": { ru: "Волат.", en: "Vol" },
  "ov.trend": { ru: "30д", en: "30d" },
  "ov.loading": { ru: "Загрузка обзора рынка…", en: "Loading market overview…" },
  "ov.error": { ru: "Данные обзора недоступны.", en: "Overview data unavailable." },
  "ov.volHint": {
    ru: "ATR — средний дневной ход. Выше % = сильнее движения, шире нужен стоп.",
    en: "ATR is the average daily move. Higher % = bigger swings, wider stops needed.",
  },

  // Macro barometer
  "macro.title": { ru: "Макро-барометр", en: "Macro Barometer" },
  "macro.subtitle": {
    ru: "Ключевые индикаторы риск-сентимента, двигающие все рынки",
    en: "Key risk-sentiment gauges that move every market",
  },
  "macro.dxy": { ru: "Индекс доллара", en: "Dollar Index" },
  "macro.us10y": { ru: "Доходность US 10Y", en: "US 10Y Yield" },
  "macro.vix": { ru: "VIX (страх)", en: "VIX (fear)" },
  "macro.fearGreed": { ru: "Страх/жадность крипты", en: "Crypto Fear & Greed" },
  "macro.btcDom": { ru: "Доминация BTC", en: "BTC Dominance" },
  "macro.loading": { ru: "Загрузка макро-данных…", en: "Loading macro data…" },
  "macro.error": { ru: "Макро-данные недоступны.", en: "Macro data unavailable." },
  "macro.fg.extremeFear": { ru: "Крайний страх", en: "Extreme Fear" },
  "macro.fg.fear": { ru: "Страх", en: "Fear" },
  "macro.fg.neutral": { ru: "Нейтрально", en: "Neutral" },
  "macro.fg.greed": { ru: "Жадность", en: "Greed" },
  "macro.fg.extremeGreed": { ru: "Крайняя жадность", en: "Extreme Greed" },

  // COT positioning
  "cot.title": { ru: "COT — позиции крупных игроков", en: "COT — Large Speculators" },
  "cot.subtitle": {
    ru: "Чистые позиции некоммерческих трейдеров (фьючерсы CFTC) и изменение за неделю",
    en: "Non-commercial net positioning (CFTC futures) with the week-over-week change",
  },
  "cot.loading": { ru: "Загрузка данных COT…", en: "Loading COT data…" },
  "cot.error": { ru: "Данные COT недоступны.", en: "COT data unavailable." },
  "cot.net": { ru: "Нетто", en: "Net" },
  "cot.wow": { ru: "за неделю", en: "w/w" },
  "cot.long": { ru: "Лонг", en: "Long" },
  "cot.short": { ru: "Шорт", en: "Short" },
  "cot.reportDate": { ru: "Отчёт от", en: "Report date" },
  "cot.bullish": { ru: "Быки", en: "Bullish" },
  "cot.bearish": { ru: "Медведи", en: "Bearish" },

  // Navigation
  "nav.market": { ru: "Рынок", en: "Market" },
  "nav.calendar": { ru: "Календарь", en: "Calendar" },
  "nav.calc": { ru: "Калькуляторы", en: "Calculators" },
  "nav.analysis": { ru: "Анализ", en: "Analysis" },
  "nav.journal": { ru: "Журнал", en: "Journal" },

  // Interactive chart
  "chart.open": { ru: "Открыть график", en: "Open chart" },
  "chart.loading": { ru: "Загрузка графика…", en: "Loading chart…" },
  "chart.error": { ru: "График недоступен.", en: "Chart unavailable." },

  // Currency strength meter
  "str.title": { ru: "Сила валют", en: "Currency Strength" },
  "str.subtitle": {
    ru: "Какая валюта сейчас сильнее всех (средний дневной ход по корзине пар)",
    en: "Which currency is strongest now (average daily move across a basket of pairs)",
  },
  "str.loading": { ru: "Расчёт силы валют…", en: "Computing currency strength…" },
  "str.error": { ru: "Данные по силе валют недоступны.", en: "Currency strength data unavailable." },

  // News feed
  "news.title": { ru: "Лента новостей", en: "Market News" },
  "news.loading": { ru: "Загрузка новостей…", en: "Loading news…" },
  "news.error": { ru: "Новости сейчас недоступны.", en: "News feed unavailable right now." },
  "news.footer": { ru: "Заголовки открываются на первоисточнике · Investing.com, FXStreet", en: "Headlines open at the source · Investing.com, FXStreet" },

  // COT detailed history
  "cot.openHistory": { ru: "Открыть детальную историю", en: "Open detailed history" },
  "coth.title": { ru: "детальная история COT", en: "detailed COT history" },
  "coth.subtitle": {
    ru: "Позиции некоммерческих трейдеров по неделям (CFTC)",
    en: "Weekly non-commercial positioning (CFTC)",
  },
  "coth.loading": { ru: "Загрузка истории…", en: "Loading history…" },
  "coth.error": { ru: "История недоступна.", en: "History unavailable." },
  "coth.date": { ru: "Дата", en: "Date" },
  "coth.long": { ru: "Лонг", en: "Long" },
  "coth.short": { ru: "Шорт", en: "Short" },
  "coth.chgLong": { ru: "Δ Лонг", en: "Chg Long" },
  "coth.chgShort": { ru: "Δ Шорт", en: "Chg Short" },
  "coth.net": { ru: "Нетто", en: "Net" },
  "coth.netChg": { ru: "Δ Нетто", en: "Net Chg" },
  "coth.netPct": { ru: "Нетто %", en: "Net %" },
  "coth.oiLong": { ru: "% ОИ Лонг", en: "% OI Long" },
  "coth.oiShort": { ru: "% ОИ Шорт", en: "% OI Short" },
  "coth.oi": { ru: "Откр. интерес", en: "Open Interest" },

  // Info hints (collapsible explainers)
  "hint.what": { ru: "Что это и что умеет?", en: "What is this?" },
  "hint.ov.4": {
    ru: "Клик по строке открывает интерактивный свечной график с таймфреймами.",
    en: "Click a row to open an interactive candlestick chart with timeframes.",
  },
  "hint.str.1": {
    ru: "Зелёные — сильные валюты, красные — слабые прямо сейчас (за сегодня).",
    en: "Green = strong currencies, red = weak right now (today's move).",
  },
  "hint.str.2": {
    ru: "Идея: покупать сильную против слабой (напр. сильный EUR × слабый JPY → EUR/JPY).",
    en: "Idea: buy the strong against the weak (e.g. strong EUR × weak JPY → EUR/JPY).",
  },
  "hint.cot.3": {
    ru: "Клик по рынку открывает детальную недельную историю COT с хитмапом.",
    en: "Click a market to open its detailed weekly COT history heatmap.",
  },
  "hint.calc.1": {
    ru: "Размер позиции — считает объём в лотах по балансу, риску в % и стоп-лоссу для форекса, металлов, крипты и индексов.",
    en: "Position size — computes lot size from your balance, risk % and stop-loss for FX, metals, crypto and indices.",
  },
  "hint.calc.2": {
    ru: "Риск : Прибыль — соотношение R:R и минимальный винрейт, при котором сделки безубыточны.",
    en: "Risk : Reward — the R:R ratio and the minimum win-rate at which the setup breaks even.",
  },
  "hint.calc.3": {
    ru: "Сложный процент — прогноз роста депозита при повторяющейся доходности на сделку.",
    en: "Compounding — projects account growth from a repeated per-trade return.",
  },
  "hint.ov.1": {
    ru: "Изменение цены за день / неделю / месяц / с начала года — видно, что в тренде, а что откатывает.",
    en: "Price change over day / week / month / year-to-date — see what's trending and what's pulling back.",
  },
  "hint.ov.2": {
    ru: "Волат. (ATR) — средний дневной ход в % от цены. Помогает выбрать адекватный размер стопа.",
    en: "Vol (ATR) — the average daily move as % of price. Helps you pick a sensible stop size.",
  },
  "hint.ov.3": {
    ru: "Мини-график (30д) — форма движения за последние ~40 дней.",
    en: "Sparkline (30d) — the shape of the move over the last ~40 days.",
  },
  "hint.macro.1": {
    ru: "DXY, доходность US 10Y и VIX — барометры силы доллара и аппетита к риску.",
    en: "DXY, US 10Y yield and VIX — barometers of dollar strength and risk appetite.",
  },
  "hint.macro.2": {
    ru: "Индекс страха/жадности и доминация BTC — настроения крипторынка.",
    en: "Fear & Greed and BTC dominance — the mood of the crypto market.",
  },
  "hint.corr.1": {
    ru: "Значения близко к +1 — пары ходят вместе (двойной риск), близко к −1 — в противофазе (хедж).",
    en: "Values near +1 move together (doubled risk); near −1 move opposite (a hedge).",
  },
  "hint.cot.1": {
    ru: "Нетто = лонги минус шорты крупных спекулянтов. Плюс — перевес быков, минус — медведей.",
    en: "Net = large speculators' longs minus shorts. Positive leans bullish, negative bearish.",
  },
  "hint.cot.2": {
    ru: "«за неделю» — как изменилась чистая позиция с прошлого отчёта: набирают лонги или шорты.",
    en: "\"w/w\" — how net positioning shifted since last week's report: adding longs or shorts.",
  },
  "hint.conv.1": {
    ru: "Конвертация между 19 валютами по свежим кросс-курсам; курс пары показан под результатом.",
    en: "Convert between 19 currencies at fresh cross rates; the pair's rate is shown under the result.",
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
