# Trading Assistant Pro

A trader's cockpit in the browser — the web edition of the original Windows desktop
app, rebuilt on **Next.js** and deployable to **Vercel**. Everything runs live, works
on any device, and needs no installation.

![v8 web edition](https://img.shields.io/badge/version-8.0-2cc985) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Trading Sessions** — live local clocks for Sydney, Tokyo, London and New York with
  open/closed/weekend status, countdown to the next boundary, a 24-hour UTC timeline and
  automatic detection of the high-liquidity **London × New York overlap**.
- **Live Market Ticker** — scrolling quotes for FX majors, gold, silver, oil, BTC/ETH and
  major indices, proxied server-side from Yahoo Finance (auto-refreshing).
- **Economic Calendar** — this week's events with impact levels, currency, forecast and
  previous, filterable by impact and today/week, sourced from the ForexFactory JSON feed.
- **Calculators**
  - *Position size* — lots from balance, risk % and stop-loss across FX, metals, crypto and indices.
  - *Risk : Reward* — R:R ratio and the breakeven win-rate a setup needs, with sanity checks.
  - *Compounding* — projected account growth over a number of trades.
- **Pre-Trade Checklist** — discipline gate with scalping / intraday / swing presets and a
  motivational nudge when every box is ticked. Your chosen style persists.
- **Trade Journal** — log trades locally (P/L, direction, R multiple, notes) and get an
  auto-computed net P/L, win rate, profit factor, average R and an equity curve. Stored in
  your browser (localStorage) — nothing leaves your device.
- **Sound alerts** — cross-platform chimes (Web Audio API) for session opens and imminent
  high-impact news. Toggle-able and remembered.

## Tech stack

- Next.js 14 (App Router) · React 18 · TypeScript
- Tailwind CSS
- Serverless API routes proxy the market/calendar feeds (with in-memory caching to respect
  upstream rate limits)

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

Production build:

```bash
npm run build
npm start
```

## Deploy to Vercel

The app is zero-config on Vercel. Either import the GitHub repo from the Vercel dashboard,
or from the CLI:

```bash
npm i -g vercel
vercel --prod
```

No environment variables are required — the data feeds are public.

## Notes & disclaimer

- Market and calendar data come from public feeds and may be delayed or occasionally
  unavailable; the UI degrades gracefully when a feed is down.
- This tool is for **informational and educational purposes only** and is **not financial
  advice**. Always do your own research and manage your own risk.

## Legacy desktop app

The original Windows desktop version (customtkinter) lives in [`legacy/trd.py`](legacy/trd.py).
The web edition supersedes it and adds the calendar filters, calculators, journal and
cross-platform sound.
