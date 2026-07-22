// Instrument definitions used by the ticker, quotes and calculators.

export interface Instrument {
  symbol: string; // Yahoo Finance symbol
  label: string; // Short display name
  group: "FX" | "Metals" | "Energy" | "Crypto" | "Index";
  decimals: number;
}

export const TICKER_INSTRUMENTS: Instrument[] = [
  { symbol: "EURUSD=X", label: "EUR/USD", group: "FX", decimals: 4 },
  { symbol: "GBPUSD=X", label: "GBP/USD", group: "FX", decimals: 4 },
  { symbol: "USDJPY=X", label: "USD/JPY", group: "FX", decimals: 2 },
  { symbol: "AUDUSD=X", label: "AUD/USD", group: "FX", decimals: 4 },
  { symbol: "USDCAD=X", label: "USD/CAD", group: "FX", decimals: 4 },
  { symbol: "GC=F", label: "GOLD", group: "Metals", decimals: 2 },
  { symbol: "SI=F", label: "SILVER", group: "Metals", decimals: 2 },
  { symbol: "CL=F", label: "OIL", group: "Energy", decimals: 2 },
  { symbol: "BTC-USD", label: "BTC", group: "Crypto", decimals: 0 },
  { symbol: "ETH-USD", label: "ETH", group: "Crypto", decimals: 0 },
  { symbol: "^GSPC", label: "S&P 500", group: "Index", decimals: 2 },
  { symbol: "^NDX", label: "NAS 100", group: "Index", decimals: 2 },
  { symbol: "^DJI", label: "DOW", group: "Index", decimals: 0 },
];

export interface Quote {
  symbol: string;
  label: string;
  price: number;
  changePct: number;
  decimals: number;
}

// Calculator asset presets: value of one full point/tick move per 1.0 lot in USD.
export interface AssetPreset {
  id: string;
  name: string;
  // USD P/L per 1 point of stop-loss, per 1.0 standard lot.
  valuePerPointPerLot: number;
  pointHint: string;
}

export const ASSET_PRESETS: AssetPreset[] = [
  { id: "forex", name: "Forex (standard, $10/pip)", valuePerPointPerLot: 10, pointHint: "Stop-loss in pips" },
  { id: "forex_jpy", name: "Forex JPY pairs", valuePerPointPerLot: 9.1, pointHint: "Stop-loss in pips" },
  { id: "gold", name: "Gold XAUUSD (100 oz)", valuePerPointPerLot: 100, pointHint: "Stop-loss in dollars ($1.00)" },
  { id: "silver", name: "Silver XAGUSD (5000 oz)", valuePerPointPerLot: 5000, pointHint: "Stop-loss in dollars ($0.01 = $50)" },
  { id: "btc", name: "Bitcoin (1 BTC)", valuePerPointPerLot: 1, pointHint: "Stop-loss in dollars" },
  { id: "indices", name: "Indices US30 / SPX ($1/pt)", valuePerPointPerLot: 1, pointHint: "Stop-loss in points" },
];
