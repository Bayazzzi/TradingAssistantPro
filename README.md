# Trading Assistant Pro

[English](#english) · [Русский](#русский)

![version](https://img.shields.io/badge/version-8.0-2cc985) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![License](https://img.shields.io/badge/license-MIT-blue)

---

## English

A trader's cockpit in the browser — the web edition of the original Windows desktop
app, rebuilt on **Next.js** and deployable to **Vercel**. Everything runs live, works on
any device, and needs no installation. Interface available in **Russian and English**
(toggle in the header, default Russian).

### Features

The dashboard is organized into tabs — **Market · Calendar · Calculators · Analysis ·
Journal** — so each view stays focused, and every tool carries a collapsible "what is
this?" explainer.

- **Trading Sessions** — live local clocks for Sydney, Tokyo, London and New York with
  open/closed/weekend status, countdown to the next boundary, a 24-hour UTC timeline and
  automatic detection of the high-liquidity **London × New York overlap**.
- **Live Market Ticker** — scrolling quotes for FX majors, gold, silver, oil, BTC/ETH and
  major indices, proxied server-side from Yahoo Finance.
- **Market Overview** — a table of multi-timeframe performance (1D/1W/1M/YTD), ATR-based
  volatility and a 30-day sparkline per instrument. Click any row for an **interactive
  candlestick chart** with 1D–1Y timeframes.
- **Macro Barometer** — the gauges that set risk sentiment: Dollar Index, US 10Y yield,
  VIX, crypto Fear & Greed and BTC dominance.
- **Currency Strength** — which currency is strongest/weakest right now, aggregated from a
  basket of pairs (buy strong against weak).
- **Market News** — a live headlines feed (Investing.com, FXStreet) linking out to sources.
- **COT positioning** — how large speculators are positioned in the major futures (CFTC
  weekly data) with week-over-week change; click a market for a **detailed weekly COT
  history heatmap** (long/short, changes, net, % of open interest, open interest).
- **Economic Calendar** — this week's events with impact levels, forecast and previous,
  filterable by impact and today/week, from the ForexFactory JSON feed.
- **Calculators** — position size, risk:reward (with breakeven win-rate) and compounding.
- **Pre-Trade Checklist** — discipline gate with scalping / intraday / swing presets.
- **Trade Journal** — log trades locally and get net P/L, win rate, profit factor, average
  R and an equity curve. Stored in your browser — nothing leaves your device.
- **Currency Converter** — convert between 19 major/EM currencies using live rates.
- **Pair Correlation** — a heatmap of 3-month daily-return correlation across FX majors,
  gold, oil, BTC and the S&P 500, so you can spot hidden overlapping risk.
- **Light / dark theme** — toggle in the header, persisted, no flash on reload.
- **Sound alerts** — cross-platform chimes (Web Audio API) for session opens and imminent
  high-impact news.

### Tech stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS. Serverless API routes proxy
the market/calendar feeds with in-memory caching to respect upstream rate limits.

### Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Production: `npm run build && npm start`.

### Deploy to Vercel

Zero-config. Import the GitHub repo from the Vercel dashboard, or from the CLI:

```bash
vercel --prod
```

No environment variables are required — the data feeds are public.

### Disclaimer

Market and calendar data come from public feeds and may be delayed or occasionally
unavailable; the UI degrades gracefully. This tool is for **informational and educational
purposes only** and is **not financial advice**.

The original Windows desktop version (customtkinter) is preserved under
[`legacy/trd.py`](legacy/trd.py).

---

## Русский

Кокпит трейдера прямо в браузере — веб-версия оригинального Windows-приложения,
переписанная на **Next.js** и разворачиваемая на **Vercel**. Всё работает вживую, на любом
устройстве и без установки. Интерфейс на **русском и английском** (переключатель в шапке,
по умолчанию русский).

### Возможности

Дашборд разбит на вкладки — **Рынок · Календарь · Калькуляторы · Анализ · Журнал** —
чтобы каждый экран был сфокусированным, и у каждого инструмента есть сворачиваемое
пояснение «что это?».

- **Торговые сессии** — живые локальные часы Сиднея, Токио, Лондона и Нью-Йорка со
  статусами открыто/закрыто/выходные, таймером до следующего события, 24-часовым
  UTC-таймлайном и авто-детектом окна высокой ликвидности **Лондон × Нью-Йорк**.
- **Бегущая строка котировок** — FX-мажоры, золото, серебро, нефть, BTC/ETH и основные
  индексы через серверный прокси Yahoo Finance.
- **Обзор рынка** — таблица изменения по таймфреймам (1D/1W/1M/YTD), волатильность на
  базе ATR и мини-график за 30 дней по каждому инструменту. Клик по строке открывает
  **интерактивный свечной график** с таймфреймами 1D–1Y.
- **Макро-барометр** — индикаторы риск-сентимента: индекс доллара, доходность US 10Y,
  VIX, крипто-индекс страха/жадности и доминация BTC.
- **Сила валют** — какая валюта сейчас сильнее/слабее всех, из корзины пар (покупай
  сильную против слабой).
- **Лента новостей** — живой фид заголовков (Investing.com, FXStreet) со ссылками на
  первоисточник.
- **COT-позиционирование** — как стоят крупные спекулянты в основных фьючерсах (недельные
  данные CFTC) с изменением за неделю; клик по рынку открывает **детальную недельную
  историю COT с хитмапом** (лонг/шорт, изменения, нетто, % от открытого интереса, ОИ).
- **Экономический календарь** — события недели с уровнем важности, прогнозом и предыдущим
  значением, фильтры по важности и сегодня/неделя (фид ForexFactory).
- **Калькуляторы** — размер позиции, риск:прибыль (с безубыточным винрейтом) и сложный
  процент.
- **Чек-лист перед сделкой** — дисциплина с пресетами скальпинг / интрадей / свинг.
- **Журнал сделок** — веди сделки локально и получай чистый P/L, винрейт, профит-фактор,
  средний R и кривую эквити. Хранится в браузере — данные не покидают устройство.
- **Конвертер валют** — конвертация между 19 основными и валютами развивающихся рынков по
  живым курсам.
- **Корреляция пар** — тепловая карта корреляции дневной доходности за 3 месяца по FX-мажорам,
  золоту, нефти, BTC и S&P 500 — помогает увидеть скрытое пересечение риска.
- **Светлая/тёмная тема** — переключатель в шапке, сохраняется, без мигания при перезагрузке.
- **Звуковые алерты** — кроссплатформенные сигналы (Web Audio API) на открытие сессий и
  приближение важных новостей.

### Технологии

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS. Serverless-роуты проксируют
рыночный и календарный фиды с кэшированием в памяти, чтобы уважать лимиты источников.

### Запуск

```bash
npm install
npm run dev
```

Открой <http://localhost:3000>. Прод: `npm run build && npm start`.

### Деплой на Vercel

Без конфигурации. Импортируй репозиторий в дашборде Vercel или через CLI:

```bash
vercel --prod
```

Переменные окружения не нужны — фиды публичные.

### Дисклеймер

Рыночные и календарные данные берутся из публичных источников и могут задерживаться или
быть временно недоступны; интерфейс корректно это переживает. Инструмент носит
**исключительно информационный и образовательный характер** и **не является финансовой
рекомендацией**.

Оригинальная десктоп-версия (customtkinter) сохранена в
[`legacy/trd.py`](legacy/trd.py).
